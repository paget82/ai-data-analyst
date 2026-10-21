"""
AI Data Analyst Agent - backend service.

Replaces the two n8n workflows that used to live in n8n/workflows/
(main-flow.json + sub-flow.json) with a single plain-Python service that
preserves the exact same behaviour and API contract, so the existing React
frontend keeps working unmodified.

Original n8n architecture:

  main-flow (webhook, header auth "X-API-Key"):
    Webhook -> Data Analyst AI Agent (LangChain agent, OpenAI GPT-5.1,
               Postgres chat memory, structured output parser fixed by
               GPT-5-mini)
                   -> tool: database_query -> calls sub-flow
    -> Format Response (Code node) -> Respond to Webhook

  sub-flow (invoked as the database_query tool, input: query_description):
    Workflow Input Trigger
      -> SQL-query-Generator (LangChain LLM chain, Anthropic Claude Opus 4.6)
      -> Query Validation (Code node: extract SQL, block destructive
         statements, require SELECT/WITH)
      -> Valid? (If node)
           true  -> Execute SQL query (Postgres node) -> Format Result
           false -> Format Result directly
      -> Edit Fields (stringify) -> returned to the tool call

Python mapping in this file:
    Flask app + /webhook/data-analyst-agent route ~= Webhook + Respond to Webhook
    run_agent()          ~= Data Analyst AI Agent node (manual tool-calling loop)
    generate_sql_raw()   ~= SQL-query-Generator node (Anthropic Claude)
    extract_sql()        ~= Query Validation node (SQL extraction + safety checks)
    execute_sql_query()  ~= Execute SQL query node
    format_result()      ~= Format Result node
    database_query()     ~= the database_query tool == the whole sub-flow
    load_history/save_message ~= Postgres Chat Memory node (chat_histories table)
    parse_structured_output() ~= Structured Output Parser node (GPT-5-mini autofix)
    format_response()    ~= Format Response Code node

Environment variables (see docker-compose.yml / .env.example):
    OPENAI_API_KEY, ANTHROPIC_API_KEY, API_AUTH_TOKEN,
    POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
"""

import os
import re
import json
import datetime
from typing import Any

from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras
from openai import OpenAI
from anthropic import Anthropic

# --------------------------------------------------------------------------
# Config
# --------------------------------------------------------------------------

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
API_AUTH_TOKEN = os.environ.get("API_AUTH_TOKEN")  # matches "X-API-Key" header

POSTGRES_HOST = os.environ.get("POSTGRES_HOST", "postgres")
POSTGRES_PORT = os.environ.get("POSTGRES_PORT", "5432")
POSTGRES_USER = os.environ.get("POSTGRES_USER", "analyst")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "analyst")
POSTGRES_DB = os.environ.get("POSTGRES_DB", "olist")
DATABASE_URL = os.environ.get("DATABASE_URL") or (
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}"
    f"@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)

MAIN_MODEL = "gpt-5.1"          # was the "GPT 5.1" node (main agent)
FIX_MODEL = "gpt-5-mini"        # was the "GPT-5-mini" node (output-parser autofix)
SQL_MODEL = "claude-opus-4-6"   # was the "Anthropic Chat Model" node (sub-flow)

openai_client = OpenAI(api_key=OPENAI_API_KEY)
anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)

app = Flask(__name__)
# n8n's webhook node allows cross-origin requests by default; the frontend
# calls this service directly from the browser, so mirror that here.
CORS(app, resources={r"/webhook/*": {"origins": "*"}, r"/healthz": {"origins": "*"}})


# --------------------------------------------------------------------------
# Main agent system prompt (content identical to main-flow.json's systemMessage)
# --------------------------------------------------------------------------

def build_system_message() -> str:
    return f"""## Your Role

You are an AI Data Analyst assistant with access to a Brazilian E-Commerce database.
Your job is to help users analyze data through natural language queries, providing
insights, visualizations, and conversational responses.

---

## Database Schema & Context

### Overview
- Database: PostgreSQL
- Dataset: Olist Brazilian E-Commerce (2016-2018)
- Total Orders: ~100,000 orders
- Total Customers: ~99,000 customers
- Date Range: September 2016 - October 2018

### Tables
1. customers(customer_id, customer_unique_id, customer_zip_code_prefix,
   customer_city, customer_state)
2. orders(order_id, customer_id, order_status, order_purchase_timestamp,
   order_delivered_customer_date, order_approved_at,
   order_delivered_carrier_date, order_estimated_delivery_date)
3. order_items(order_id, order_item_id, product_id, seller_id, price, freight_value)
4. products(product_id, product_category_name, product_weight_g,
   product_length_cm, product_height_cm, product_width_cm)
5. sellers(seller_id, seller_city, seller_state, seller_zip_code_prefix)
6. order_payments(order_id, payment_type, payment_installments, payment_value)
7. order_reviews(review_id, order_id, review_score, review_comment_title,
   review_comment_message)
8. product_category_translation(product_category_name, product_category_name_english)
9. geolocation(geolocation_zip_code_prefix, geolocation_lat, geolocation_lng,
   geolocation_city, geolocation_state)

### Critical Business Rules
1. Revenue calculations: only count orders where order_status = 'delivered'
2. Total order value: SUM(price + freight_value) from order_items
3. Timestamps: cast TEXT to timestamp with field::timestamp
4. Category names: use English via LEFT JOIN with product_category_translation
5. Unique customers: use customer_unique_id, not customer_id
6. Date aggregation: DATE_TRUNC('month', timestamp::timestamp) for monthly
7. NULL handling: use COALESCE()

---

## Available Tools

### database_query
Call this tool to convert a natural-language description into SQL and fetch the
result from the database.

When to use:
- user asks for data, statistics, or insights ("what", "how many", "show me",
  "top", "list")

When NOT to use:
- greetings, thanks, small talk, follow-up questions answerable from memory

---

## Response Format

You MUST return a valid JSON object shaped like:
{{
  "response": "natural language answer, 2-4 sentences, with 1-2 insights",
  "data": {{"headers": ["col1", "col2"], "rows": [["v1", "v2"]]}},
  "visualization": {{
    "type": "bar|line|pie",
    "x_label": "...", "y_label": "...",
    "labels": [...], "values": [...]
  }}
}}

- "data" only if a database query was executed (max 20 rows).
- "visualization" only if the data fits: bar (category + numeric, 2-20 rows),
  line (time series), pie (categories, max 8 slices).
- Never include Portuguese category names, never include canceled orders in
  revenue, never write raw SQL yourself (the tool does that).

The current date = {datetime.datetime.now().isoformat()}
"""


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "database_query",
            "description": (
                "Convert a natural language query into SQL and fetch the "
                "response from the Brazilian E-Commerce database."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query_description": {
                        "type": "string",
                        "description": (
                            "Natural language description of what data the "
                            "user wants to query from the database"
                        ),
                    }
                },
                "required": ["query_description"],
            },
        },
    }
]

OUTPUT_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "response": {
            "type": "string",
            "description": "Natural language explanation with insights (required)",
        },
        "data": {
            "type": "object",
            "properties": {
                "headers": {"type": "array", "items": {"type": "string"}},
                "rows": {
                    "type": "array",
                    "items": {"type": "array", "items": {"type": "string"}},
                },
            },
        },
        "visualization": {
            "type": "object",
            "properties": {
                "type": {"type": "string", "enum": ["bar", "line", "pie"]},
                "x_label": {"type": "string"},
                "y_label": {"type": "string"},
                "labels": {"type": "array", "items": {"type": "string"}},
                "values": {"type": "array", "items": {"type": "number"}},
            },
        },
    },
    "required": ["response"],
}


# --------------------------------------------------------------------------
# database_query tool == the whole sub-flow
# (SQL-query-Generator -> Query Validation -> Valid? -> Execute SQL query /
#  Format Result -> Edit Fields)
# --------------------------------------------------------------------------

def build_sql_generation_prompt() -> str:
    return f"""## Role:
You are an expert PostgreSQL SQL generator for a Brazilian E-Commerce database.

## TASK: Convert the natural language query description into a valid PostgreSQL query.

## DATABASE SCHEMA:
### Overview
- Database: PostgreSQL
- Dataset: Olist Brazilian E-Commerce (2016-2018)
- Total Orders: ~100,000 orders / Customers: ~99,000 / Products: ~32,000 / Sellers: ~3,000

### Core Tables
1. customers(customer_id, customer_unique_id, customer_zip_code_prefix,
   customer_city, customer_state)
2. orders(order_id [PK], customer_id, order_status, order_purchase_timestamp,
   order_approved_at, order_delivered_carrier_date, order_delivered_customer_date,
   order_estimated_delivery_date)
   - key statuses: delivered, canceled, shipped, processing
   - ALWAYS filter order_status = 'delivered' for revenue/completed orders
3. order_items(order_id, order_item_id, product_id, seller_id,
   shipping_limit_date, price, freight_value)
   - total order value = SUM(price + freight_value)
4. products(product_id [PK], product_category_name, product_name_length,
   product_description_length, product_photos_qty, product_weight_g,
   product_length_cm, product_height_cm, product_width_cm)
5. sellers(seller_id [PK], seller_zip_code_prefix, seller_city, seller_state)
6. order_payments(order_id, payment_sequential, payment_type,
   payment_installments, payment_value)
7. order_reviews(review_id [PK], order_id, review_score, review_comment_title,
   review_comment_message, review_creation_date, review_answer_timestamp)
8. product_category_translation(product_category_name [PK],
   product_category_name_english)
9. geolocation(geolocation_zip_code_prefix, geolocation_lat, geolocation_lng,
   geolocation_city, geolocation_state)

### Table Relationships
customers -> orders -> order_items -> products / sellers
orders -> order_payments
orders -> order_reviews
product_category_translation <- products (via category name)
geolocation <- customers, sellers (via zip code)

### Important Data Notes
- All timestamp fields are TEXT; cast with field::timestamp
- Date range: 2016-09-04 to 2018-10-17
- Use DATE_TRUNC('month', field::timestamp) for monthly aggregations
- Top states by volume: SP, RJ, MG, RS, PR
- Use customer_unique_id (not customer_id) for customer counting/retention

## CRITICAL RULES:
1. Only generate SELECT statements (no INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE)
2. Always filter by order_status = 'delivered' when calculating revenue or completed orders
3. Convert TEXT timestamps to timestamp type: field::timestamp
4. Use LEFT JOIN with product_category_translation for English category names
5. Use COALESCE for NULL handling
6. Use DATE_TRUNC('month', timestamp::timestamp) for monthly aggregations
7. Use COUNT(DISTINCT order_id) to count orders (not items)
8. Limit results to reasonable numbers (default 100 max, unless user specifies)
9. Use proper table aliases for readability
10. For customer counting, use customer_unique_id not customer_id

## RESPONSE FORMAT:
Return ONLY a valid JSON object in exactly this format, with no markdown code
blocks, no explanations, and no extra text:
{{"sql": "YOUR SQL QUERY HERE"}}

Escape any double quotes inside the SQL string properly for valid JSON.

---
The Current Date = {datetime.datetime.now().isoformat()}
"""


def generate_sql_raw(query_description: str) -> str:
    """== 'SQL-query-Generator' node (Anthropic Claude Opus 4.6).

    On failure this mirrors onError:"continueErrorOutput" by returning the
    error as text, which then flows into extract_sql() just like in n8n.
    """
    try:
        message = anthropic_client.messages.create(
            model=SQL_MODEL,
            max_tokens=4096,
            system=build_sql_generation_prompt(),
            messages=[
                {
                    "role": "user",
                    "content": f"Natural Language Query:\n{query_description}\n\nSQL Query:",
                }
            ],
        )
        text_blocks = [b.text for b in message.content if b.type == "text"]
        return "\n".join(text_blocks)
    except Exception as exc:  # noqa: BLE001
        return json.dumps({"error": str(exc)})


DESTRUCTIVE_PATTERNS = [
    re.compile(r"\bDROP\b", re.I),
    re.compile(r"\bDELETE\b", re.I),
    re.compile(r"\bTRUNCATE\b", re.I),
    re.compile(r"\bALTER\b", re.I),
    re.compile(r"\bUPDATE\b", re.I),
    re.compile(r"\bINSERT\b", re.I),
    re.compile(r"\bCREATE\b", re.I),
    re.compile(r"\bGRANT\b", re.I),
    re.compile(r"\bREVOKE\b", re.I),
    re.compile(r";.*SELECT", re.I | re.S),  # multiple statements
    re.compile(r"--"),                      # line comments
    re.compile(r"/\*"),                     # block comments
]


def extract_sql(raw_text: str, query_description: str) -> dict:
    """== 'Query Validation' code node: extract + validate the SQL."""
    json_match = re.search(r'\{[\s\S]*"sql"\s*:\s*"([\s\S]*?)"\s*\}', raw_text)
    if json_match:
        sql = json_match.group(1).replace('\\"', '"').replace("\\n", " ")
    else:
        select_match = re.search(r"(SELECT|WITH)[\s\S]*", raw_text, re.I)
        sql = select_match.group(0) if select_match else None

    if not sql:
        return {
            "success": False,
            "valid": False,
            "error": "Could not extract SQL from model output.",
            "sql": None,
        }

    for pattern in DESTRUCTIVE_PATTERNS:
        if pattern.search(sql):
            return {
                "success": False,
                "valid": False,
                "error": "Query contains unauthorized operations. Only SELECT queries are allowed.",
                "sql": sql,
            }

    trimmed_upper = sql.strip().upper()
    if not (trimmed_upper.startswith("SELECT") or trimmed_upper.startswith("WITH")):
        return {
            "success": False,
            "valid": False,
            "error": "Query must be a SELECT statement.",
            "sql": sql,
        }

    return {
        "success": True,
        "valid": True,
        "sql": sql.strip(),
        "query_description": query_description,
    }


def _json_safe(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return str(value)  # Decimal, datetime, etc.


def execute_sql_query(sql: str) -> list[dict]:
    """== 'Execute SQL query' Postgres node."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql)
            return [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()


def format_result(validation: dict) -> dict:
    """== 'Format Result' code node."""
    if validation.get("valid") is False:
        return {
            "success": False,
            "error": validation.get("error"),
            "sql": validation.get("sql"),
        }

    sql = validation["sql"]
    try:
        rows = execute_sql_query(sql)
    except Exception as exc:  # noqa: BLE001
        return {"success": False, "error": f"Database error: {exc}", "sql": sql}

    if not rows:
        return {
            "success": True,
            "data": {"headers": [], "rows": []},
            "row_count": 0,
            "sql_executed": sql,
            "message": "Query executed successfully but returned no results.",
        }

    headers = list(rows[0].keys())
    row_values = [[_json_safe(row[h]) for h in headers] for row in rows]

    return {
        "success": True,
        "data": {"headers": headers, "rows": row_values},
        "row_count": len(rows),
        "sql_executed": sql,
    }


def database_query(query_description: str) -> dict:
    """The database_query tool exposed to the agent == the whole sub-flow."""
    raw_text = generate_sql_raw(query_description)
    validation = extract_sql(raw_text, query_description)
    return format_result(validation)


# --------------------------------------------------------------------------
# Chat memory == "Postgres Chat Memory" node (table: chat_histories)
# --------------------------------------------------------------------------

def ensure_memory_table() -> None:
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS chat_histories (
                    id SERIAL PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                )
                """
            )
        conn.commit()
    finally:
        conn.close()


def load_history(session_id: str, limit: int = 20) -> list[dict]:
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT role, content FROM chat_histories
                WHERE session_id = %s
                ORDER BY id DESC LIMIT %s
                """,
                (session_id, limit),
            )
            rows = cur.fetchall()
        return [{"role": r, "content": c} for r, c in reversed(rows)]
    finally:
        conn.close()


def save_message(session_id: str, role: str, content: str) -> None:
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO chat_histories (session_id, role, content) VALUES (%s, %s, %s)",
                (session_id, role, content),
            )
        conn.commit()
    finally:
        conn.close()


# --------------------------------------------------------------------------
# Structured output parser + GPT-5-mini autofix
# --------------------------------------------------------------------------

def parse_structured_output(raw_text: str) -> dict:
    """Mirrors the n8n Structured Output Parser node (autoFix=True)."""
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        pass

    fix_completion = openai_client.chat.completions.create(
        model=FIX_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "Fix the following text so it becomes valid JSON matching "
                    f"this JSON schema:\n{json.dumps(OUTPUT_JSON_SCHEMA)}\n"
                    "Return ONLY the corrected JSON, nothing else."
                ),
            },
            {"role": "user", "content": raw_text},
        ],
    )
    fixed = fix_completion.choices[0].message.content.strip()
    if fixed.startswith("```"):
        fixed = fixed.strip("`")
        fixed = fixed.split("\n", 1)[1] if "\n" in fixed else fixed
    try:
        return json.loads(fixed)
    except json.JSONDecodeError:
        return {"response": raw_text}


# --------------------------------------------------------------------------
# Agent loop == "Data Analyst AI Agent" node
# --------------------------------------------------------------------------

def run_agent(user_message: str, session_id: str) -> dict:
    ensure_memory_table()  
    history = load_history(session_id)

    messages = [{"role": "system", "content": build_system_message()}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    intermediate_steps = []

    for _ in range(5):  # tool-calling loop, capped to avoid infinite loops
        completion = openai_client.chat.completions.create(
            model=MAIN_MODEL,
            messages=messages,
            tools=TOOLS,
        )
        choice = completion.choices[0]
        msg = choice.message

        if msg.tool_calls:
            messages.append(msg.model_dump(exclude_none=True))
            for tool_call in msg.tool_calls:
                args = json.loads(tool_call.function.arguments)
                result = database_query(args["query_description"])
                intermediate_steps.append({"tool_call": args, "result": result})
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(result),
                    }
                )
            continue

        final_text = msg.content or ""
        break
    else:
        final_text = "I could not complete the request in time."

    parsed = parse_structured_output(final_text)

    save_message(session_id, "user", user_message)
    save_message(session_id, "assistant", json.dumps(parsed))

    return {"output": parsed, "intermediateSteps": intermediate_steps}


# --------------------------------------------------------------------------
# Format Response == "Format Response" Code node
# --------------------------------------------------------------------------

def format_response(agent_output: Any, intermediate_steps: list[dict]) -> dict:
    if isinstance(agent_output, str):
        try:
            agent_output = json.loads(agent_output)
        except json.JSONDecodeError:
            agent_output = {"response": agent_output}

    # The agent's own structured-output schema never carries a "sql" field
    # (same as the original n8n flow), so fall back to the SQL actually run
    # by the last successful database_query tool call. The frontend's
    # ApiResponse type expects this under "sql_executed".
    sql_executed = agent_output.get("sql")
    if not sql_executed:
        for step in reversed(intermediate_steps):
            result = step.get("result", {})
            if result.get("success") and result.get("sql_executed"):
                sql_executed = result["sql_executed"]
                break

    response = {
        "response": agent_output.get("response") or "I processed your request.",
        "data": agent_output.get("data"),
        "visualization": agent_output.get("visualization"),
        "sql_executed": sql_executed,
    }
    return {k: v for k, v in response.items() if v is not None}


# --------------------------------------------------------------------------
# Webhook == "Webhook" (header auth) + "Respond to Webhook" nodes
# --------------------------------------------------------------------------

@app.route("/healthz", methods=["GET"])
def healthz():
    return jsonify({"status": "ok"})


@app.route("/webhook/data-analyst-agent", methods=["POST"])
def data_analyst_agent():
    # header auth, mirrors n8n's "Header Auth account" credential (X-API-Key)
    api_key = request.headers.get("X-API-Key")
    if API_AUTH_TOKEN and api_key != API_AUTH_TOKEN:
        return jsonify({"error": "Unauthorized"}), 401

    body = request.get_json(silent=True) or {}
    user_message = body.get("message", "")
    session_id = body.get("session_id", "default")

    if not user_message:
        return jsonify({"error": "Missing 'message' in request body"}), 400

    agent_result = run_agent(user_message, session_id)
    response_body = format_response(
        agent_result["output"], agent_result["intermediateSteps"]
    )

    return jsonify(response_body)


if __name__ == "__main__":
    ensure_memory_table()
    app.run(host="0.0.0.0", port=8000)
