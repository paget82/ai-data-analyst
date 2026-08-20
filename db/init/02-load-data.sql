-- ============================================================================
-- Loads the CSV files from db/data/ (mounted into the container at
-- /csv-data) into the tables created by 01-schema.sql.
--
-- Ships with a small SYNTHETIC sample dataset so `docker compose up` works
-- immediately after cloning. To use the real Olist dataset instead, download
-- the CSVs from https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce,
-- drop them into db/data/ using the exact same filenames (overwriting the
-- sample files), remove the postgres_data Docker volume so this script runs
-- again, and start the stack:
--
--   docker compose down -v postgres   # or: docker volume rm ai-data-analyst_postgres_data
--   docker compose up -d --build
-- ============================================================================

copy product_category_translation
  from '/csv-data/product_category_name_translation.csv'
  with (format csv, header true);

copy customers
  from '/csv-data/olist_customers_dataset.csv'
  with (format csv, header true);

copy sellers
  from '/csv-data/olist_sellers_dataset.csv'
  with (format csv, header true);

copy products
  from '/csv-data/olist_products_dataset.csv'
  with (format csv, header true);

copy orders
  from '/csv-data/olist_orders_dataset.csv'
  with (format csv, header true);

copy order_items
  from '/csv-data/olist_order_items_dataset.csv'
  with (format csv, header true);

copy order_payments
  from '/csv-data/olist_order_payments_dataset.csv'
  with (format csv, header true);

copy order_reviews
  from '/csv-data/olist_order_reviews_dataset.csv'
  with (format csv, header true);

copy geolocation
  from '/csv-data/olist_geolocation_dataset.csv'
  with (format csv, header true);
