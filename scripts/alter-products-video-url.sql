-- Product PDP gallery video (nullable; last media slot when set)
ALTER TABLE products
  ADD COLUMN video_url VARCHAR(512) NULL AFTER images_json;
