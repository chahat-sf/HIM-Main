-- What’s included with each product (shown in PDP About)
ALTER TABLE products
  ADD COLUMN includes VARCHAR(255) NULL AFTER details_json;

-- Garment only (no trousers)
UPDATE products SET includes = 'Jacket' WHERE name = 'THE NOCTURNE';
UPDATE products SET includes = 'Overcoat' WHERE name = 'THE ARCHIVIST';
UPDATE products SET includes = 'Blazer' WHERE name IN ('THE ATTACHÉ', 'THE ATTACHE');
UPDATE products SET includes = 'Jacket' WHERE name IN (
  'THE RESERVE',
  'THE OFFSET',
  'THE SIGNAL',
  'THE AFTERGLOW'
);

-- Known sets with trousers
UPDATE products SET includes = 'Tuxedo jacket and trousers' WHERE name = 'THE LAST WORD';
UPDATE products SET includes = 'Suit jacket and trousers' WHERE name = 'THE EXCEPTION';
UPDATE products SET includes = 'Jacket and trousers' WHERE name IN (
  'THE COMPOSURE',
  'THE ENCORE',
  'THE OVERTURE'
);

-- Remaining products: title-based garment noun + trousers
UPDATE products
SET includes = CASE
  WHEN LOWER(COALESCE(title, '')) LIKE '%overcoat%' THEN 'Overcoat and trousers'
  WHEN LOWER(COALESCE(title, '')) LIKE '%blazer%' THEN 'Blazer and trousers'
  WHEN LOWER(COALESCE(title, '')) LIKE '%tuxedo%' THEN 'Tuxedo jacket and trousers'
  WHEN LOWER(COALESCE(title, '')) LIKE '%suit%' THEN 'Suit jacket and trousers'
  ELSE 'Jacket and trousers'
END
WHERE includes IS NULL;
