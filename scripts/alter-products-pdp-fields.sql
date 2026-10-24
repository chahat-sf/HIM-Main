-- Gallery + PDP buy-box fields (DB is sole product source of truth)
ALTER TABLE products
  ADD COLUMN images_json JSON NULL AFTER image_url,
  ADD COLUMN colors_json JSON NULL AFTER swatches_json,
  ADD COLUMN sizes_json JSON NULL AFTER colors_json,
  ADD COLUMN size_fit TEXT NULL AFTER sizes_json,
  ADD COLUMN shipping TEXT NULL AFTER size_fit;
