-- PDP layout: outfit = sticky-left zoom gallery; single = stacked images + sticky buy box
ALTER TABLE products
  ADD COLUMN pdp_layout ENUM('outfit', 'single') NOT NULL DEFAULT 'outfit'
  AFTER swatches_json;
