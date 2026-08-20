# AI Data Analyst

A dark-mode chat interface for querying an e-commerce database in plain
language. Built with React, TypeScript, Tailwind CSS, and Chart.js. Talks
directly to an n8n webhook — no custom backend required.

## Features

- Chat-style querying with markdown-formatted AI responses
- Bar / line / pie chart rendering, or a data table when a chart doesn't fit
- CSV export for table results
- Collapsible query history (last 20 queries), persisted in `localStorage`
- Session tracking per browser, with a "New Session" reset
- Sample question chips on first load
- Fully keyboard-navigable, dark mode only

## Requirements

- Node.js 18+
- An n8n workflow with a **published** webhook that accepts
  `{ "message": string, "session_id": string }` and returns:

  ```json
  {
    "response": "Natural language answer",
    "data": { "headers": ["col1", "col2"], "rows": [["a", 1]] },
    "visualization": {
      "type": "bar",
      "x_label": "Category",
      "y_label": "Count",
      "labels": ["A", "B"],
      "values": [10, 20]
    }
  }
  ```

  `data` and `visualization` are optional — omit either when not relevant.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example env file and fill in your webhook details:

   ```bash
   cp .env.local.example .env.local
   ```

   Then edit `.env.local`:

   ```
   VITE_N8N_WEBHOOK_URL=http://localhost:5678/webhook/data-analyst-agent
   VITE_N8N_AUTH_TOKEN=your-header-auth-secret
   ```

   - `VITE_N8N_WEBHOOK_URL` — the **production** webhook URL from your n8n
     Webhook node (only works once the workflow is published/active).
   - `VITE_N8N_AUTH_TOKEN` — the value your n8n "Header Auth" credential
     expects. It's sent as the `X-API-Key` header on every request.

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open the printed local URL (typically `http://localhost:5173`).

4. Build for production:

   ```bash
   npm run build
   npm run preview
   ```

## Project structure

```
src/
  components/
    Chat/            Chat window, message bubbles, input, empty state
    Visualizations/  Bar/Line/Pie charts, data table, chart error boundary
    Sidebar/          Query history panel
    Layout/           Header, footer
  hooks/
    useChat.ts        Message flow, sending, retry, error state
    useHistory.ts      Query history persistence
    useSession.ts     session_id generation/storage
  utils/
    api.ts            Webhook client with 30s timeout + error handling
    csv.ts            CSV export for table data
    time.ts           Relative timestamps, text truncation
  types/index.ts       Shared TypeScript interfaces
```

## Notes

- History is read-only: clicking a past query shows a snapshot of that
  exchange without re-calling the webhook.
- If the webhook doesn't respond within 30 seconds, the chat shows a timeout
  message; failed requests show a "Try again" button that resends the last
  message.
- If a visualization fails to render, the app falls back to a plain table
  (when data is available) instead of crashing the message.
