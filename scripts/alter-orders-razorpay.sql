-- Razorpay checkout: pending orders + payment metadata + line size/color

ALTER TABLE orders
  MODIFY COLUMN status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled')
    NOT NULL DEFAULT 'pending';

ALTER TABLE orders
  ADD COLUMN razorpay_order_id VARCHAR(64) NULL AFTER currency,
  ADD COLUMN razorpay_payment_id VARCHAR(64) NULL AFTER razorpay_order_id,
  ADD COLUMN payment_status ENUM('created', 'paid', 'failed') NOT NULL DEFAULT 'created'
    AFTER razorpay_payment_id,
  ADD COLUMN address_snapshot JSON NULL AFTER payment_status,
  ADD COLUMN subtotal_cents INT UNSIGNED NOT NULL DEFAULT 0 AFTER address_snapshot,
  ADD COLUMN tax_cents INT UNSIGNED NOT NULL DEFAULT 0 AFTER subtotal_cents;

ALTER TABLE orders
  ADD UNIQUE KEY uq_orders_razorpay_order (razorpay_order_id);

ALTER TABLE order_items
  ADD COLUMN size VARCHAR(40) NOT NULL DEFAULT '' AFTER product_name,
  ADD COLUMN color VARCHAR(80) NOT NULL DEFAULT '' AFTER size;
