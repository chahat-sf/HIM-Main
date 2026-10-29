-- THE NOCTURNE: use shot 3 as signature / first gallery image (swap with 1).
UPDATE products
SET image_url = '/products/nocturne/3.webp',
    images_json = CAST('["/products/nocturne/3.webp","/products/nocturne/2.webp","/products/nocturne/1.webp","/products/nocturne/4.webp","/products/nocturne/5.webp","/products/nocturne/6.webp"]' AS JSON)
WHERE slug = 'textured-thermal-white-9' OR name = 'THE NOCTURNE';
