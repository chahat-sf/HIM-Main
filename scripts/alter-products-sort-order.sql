-- Merchandising order for collection / home / API / related listings.
-- Lower sort_order appears first. Gaps of 10 leave room for inserts.

ALTER TABLE products
  ADD COLUMN sort_order INT UNSIGNED NOT NULL DEFAULT 0 AFTER is_active,
  ADD INDEX idx_products_sort_order (sort_order);

UPDATE products SET sort_order = 10 WHERE slug = 'the-nocturne-black-velvet-jacket';
UPDATE products SET sort_order = 20 WHERE slug = 'the-encore';
UPDATE products SET sort_order = 30 WHERE slug = 'the-last-word-black-evening-tuxedo';
UPDATE products SET sort_order = 40 WHERE slug = 'the-composure-black-cotton-velvet-jacket';
UPDATE products SET sort_order = 50 WHERE slug = 'the-archivist-houndstooth-wool-overcoat';
UPDATE products SET sort_order = 60 WHERE slug = 'the-exception-double-breasted-denim-suit';
UPDATE products SET sort_order = 70 WHERE slug = 'the-attache-double-breasted-blazer';
UPDATE products SET sort_order = 80 WHERE slug = 'the-afterglow';
UPDATE products SET sort_order = 90 WHERE slug = 'the-overture';
UPDATE products SET sort_order = 100 WHERE slug = 'the-signal';
UPDATE products SET sort_order = 110 WHERE slug = 'the-offset';
UPDATE products SET sort_order = 120 WHERE slug = 'the-operator';
UPDATE products SET sort_order = 130 WHERE slug = 'the-diplomat';
UPDATE products SET sort_order = 140 WHERE slug = 'the-reserve';
UPDATE products SET sort_order = 150 WHERE slug = 'the-majesty';
