-- THE EXCEPTION gallery → /products/exception/*.png
UPDATE products
SET image_url = '/products/exception/1.png',
    images_json = CAST('["/products/exception/1.png","/products/exception/2.png","/products/exception/3.png","/products/exception/4.png"]' AS JSON)
WHERE slug = 'textured-thermal-white-8' OR name = 'THE EXCEPTION';
