-- Set iii/ signature shots as card + PDP first image (prepend; keep gallery after).

UPDATE products
SET image_url = '/products/nocturne/signature.webp',
    images_json = CAST('["/products/nocturne/signature.webp","/products/nocturne/3.webp","/products/nocturne/2.webp","/products/nocturne/1.webp","/products/nocturne/4.webp","/products/nocturne/5.webp","/products/nocturne/6.webp"]' AS JSON)
WHERE name = 'THE NOCTURNE' OR slug = 'the-nocturne-black-velvet-jacket';

UPDATE products
SET image_url = '/products/last-word/signature.webp',
    images_json = CAST('["/products/last-word/signature.webp","/products/last-word/3.webp","/products/last-word/2.webp","/products/last-word/1.webp","/products/last-word/4.webp","/products/last-word/5.webp","/products/last-word/6.webp"]' AS JSON)
WHERE name = 'THE LAST WORD' OR slug = 'the-last-word-black-evening-tuxedo';

UPDATE products
SET image_url = '/products/composure/signature.webp',
    images_json = CAST('["/products/composure/signature.webp","/products/composure/1.webp","/products/composure/2.webp","/products/composure/3.webp","/products/composure/4.webp","/products/composure/5.webp","/products/composure/6.webp","/products/composure/7.webp","/products/composure/8.webp"]' AS JSON)
WHERE name = 'THE COMPOSURE' OR slug = 'the-composure-black-cotton-velvet-jacket';

UPDATE products
SET image_url = '/products/archivist/signature.webp',
    images_json = CAST('["/products/archivist/signature.webp","/products/archivist/4.webp","/products/archivist/2.webp","/products/archivist/3.webp","/products/archivist/1.webp","/products/archivist/5.webp","/products/archivist/6.webp","/products/archivist/7.webp","/products/archivist/8.webp"]' AS JSON)
WHERE name = 'THE ARCHIVIST' OR slug = 'the-archivist-houndstooth-wool-overcoat';

UPDATE products
SET image_url = '/products/exception/signature.webp',
    images_json = CAST('["/products/exception/signature.webp","/products/exception/1.webp","/products/exception/2.webp","/products/exception/3.webp","/products/exception/4.webp"]' AS JSON)
WHERE name = 'THE EXCEPTION' OR slug = 'the-exception-double-breasted-denim-suit';

UPDATE products
SET image_url = '/products/attache/signature.webp',
    images_json = CAST('["/products/attache/signature.webp","/products/man-image-100.webp","/products/inner-images/man-image-100-1.webp","/products/inner-images/man-image-100-2.webp"]' AS JSON)
WHERE name = 'THE ATTACHÉ' OR slug = 'the-attache-double-breasted-blazer';

UPDATE products
SET image_url = '/products/afterglow/signature.webp',
    images_json = CAST('["/products/afterglow/signature.webp","/products/afterglow/1.webp","/products/afterglow/2.webp","/products/afterglow/3.webp","/products/afterglow/4.webp","/products/afterglow/5.webp"]' AS JSON)
WHERE name = 'THE AFTERGLOW' OR slug = 'the-afterglow';

UPDATE products
SET image_url = '/products/encore/signature.webp',
    images_json = CAST('["/products/encore/signature.webp","/products/encore/1.webp","/products/encore/2.webp","/products/encore/3.webp","/products/encore/4.webp"]' AS JSON)
WHERE name = 'THE ENCORE' OR slug = 'the-encore';
