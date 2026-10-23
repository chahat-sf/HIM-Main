-- Add catalog product_id to saved_items (wishlist)
ALTER TABLE saved_items
  ADD COLUMN product_id INT UNSIGNED NULL AFTER user_id;

ALTER TABLE saved_items
  ADD CONSTRAINT fk_saved_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT;

ALTER TABLE saved_items
  ADD KEY idx_saved_product (product_id);
