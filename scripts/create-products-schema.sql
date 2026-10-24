CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED NOT NULL PRIMARY KEY,
  slug VARCHAR(160) NOT NULL,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  fabric VARCHAR(255) NULL,
  description TEXT NULL,
  marketing_line VARCHAR(512) NULL,
  alternatives_json JSON NULL,
  details_json JSON NULL,
  category VARCHAR(80) NULL,
  image_url VARCHAR(512) NOT NULL,
  images_json JSON NULL,
  video_url VARCHAR(512) NULL,
  price_cents INT UNSIGNED NOT NULL DEFAULT 0,
  swatches_json JSON NULL,
  colors_json JSON NULL,
  sizes_json JSON NULL,
  size_fit TEXT NULL,
  shipping TEXT NULL,
  pdp_layout ENUM('outfit', 'single') NOT NULL DEFAULT 'outfit',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_products_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Link cart lines to catalog products (clear existing test rows first)
DELETE FROM cart_items;

ALTER TABLE cart_items
  ADD COLUMN product_id INT UNSIGNED NULL AFTER user_id;

ALTER TABLE cart_items
  ADD CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT;

ALTER TABLE cart_items
  DROP INDEX uq_cart_line;

ALTER TABLE cart_items
  ADD UNIQUE KEY uq_cart_line (user_id, product_id, size, color);

-- Link order line items to catalog products
ALTER TABLE order_items
  ADD COLUMN product_id INT UNSIGNED NULL AFTER order_id;

ALTER TABLE order_items
  ADD CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT;
