-- THE ARCHIVIST: use shot 4 as signature / first gallery image (swap with 1).
UPDATE products
SET image_url = '/products/archivist/4.webp',
    images_json = CAST('["/products/archivist/4.webp","/products/archivist/2.webp","/products/archivist/3.webp","/products/archivist/1.webp","/products/archivist/5.webp","/products/archivist/6.webp","/products/archivist/7.webp","/products/archivist/8.webp"]' AS JSON)
WHERE slug = 'textured-thermal-white-10' OR name = 'THE ARCHIVIST';
