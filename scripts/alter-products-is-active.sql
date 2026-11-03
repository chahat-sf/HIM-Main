-- Catalog listing flag: inactive products are hidden from collection/home/sitemap.
ALTER TABLE products
  ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1
  AFTER pdp_layout;

UPDATE products SET is_active = 1;
UPDATE products SET is_active = 0 WHERE name IN ('THE RESERVE', 'THE OVERTURE');
