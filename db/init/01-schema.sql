-- ============================================================================
-- AI Data Analyst — database schema
-- Dataset: Olist Brazilian E-Commerce (2016–2018)
-- https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce
--
-- Runs automatically the FIRST time the Postgres container starts with an
-- empty data volume (Postgres's docker-entrypoint-initdb.d convention runs
-- every *.sql/*.sh in this folder, in filename order). It never re-runs
-- against an existing volume — see README.md if you need to reset.
-- ============================================================================

create table if not exists product_category_translation (
  product_category_name          text primary key,
  product_category_name_english  text
);

create table if not exists customers (
  customer_id                text primary key,
  customer_unique_id          text,
  customer_zip_code_prefix    bigint,
  customer_city                text,
  customer_state               text
);

create table if not exists sellers (
  seller_id                text primary key,
  seller_zip_code_prefix    bigint,
  seller_city                text,
  seller_state               text
);

create table if not exists products (
  product_id                     text primary key,
  product_category_name          text references product_category_translation(product_category_name),
  product_name_length             bigint,
  product_description_length      bigint,
  product_photos_qty              bigint,
  product_weight_g                bigint,
  product_length_cm               bigint,
  product_height_cm               bigint,
  product_width_cm                bigint
);

create table if not exists orders (
  order_id                          text primary key,
  customer_id                       text references customers(customer_id),
  order_status                      text,
  order_purchase_timestamp          text,
  order_approved_at                 text,
  order_delivered_carrier_date      text,
  order_delivered_customer_date     text,
  order_estimated_delivery_date     text
);

create table if not exists order_items (
  order_id              text references orders(order_id),
  order_item_id         bigint,
  product_id            text references products(product_id),
  seller_id             text references sellers(seller_id),
  shipping_limit_date   text,
  price                 double precision,
  freight_value         double precision,
  primary key (order_id, order_item_id)
);

create table if not exists order_payments (
  order_id                text references orders(order_id),
  payment_sequential      bigint,
  payment_type            text,
  payment_installments    bigint,
  payment_value           double precision,
  primary key (order_id, payment_sequential)
);

create table if not exists order_reviews (
  review_id                  text,
  order_id                   text references orders(order_id),
  review_score                bigint,
  review_comment_title        text,
  review_comment_message      text,
  review_creation_date        text,
  review_answer_timestamp     text
);

create table if not exists geolocation (
  geolocation_zip_code_prefix   bigint,
  geolocation_lat                double precision,
  geolocation_lng                double precision,
  geolocation_city               text,
  geolocation_state              text
);

-- ----------------------------------------------------------------------------
-- Indexes to keep the AI-generated SQL queries fast on the common join paths
-- ----------------------------------------------------------------------------
create index if not exists idx_orders_customer_id        on orders (customer_id);
create index if not exists idx_orders_status              on orders (order_status);
create index if not exists idx_order_items_order_id        on order_items (order_id);
create index if not exists idx_order_items_product_id      on order_items (product_id);
create index if not exists idx_order_items_seller_id       on order_items (seller_id);
create index if not exists idx_order_payments_order_id     on order_payments (order_id);
create index if not exists idx_order_reviews_order_id      on order_reviews (order_id);
create index if not exists idx_products_category           on products (product_category_name);
create index if not exists idx_geolocation_zip             on geolocation (geolocation_zip_code_prefix);
create index if not exists idx_customers_unique_id         on customers (customer_unique_id);
