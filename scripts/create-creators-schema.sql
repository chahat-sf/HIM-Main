CREATE TABLE IF NOT EXISTS creator_applications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  city_country VARCHAR(160) NOT NULL,
  mobile VARCHAR(32) NULL,
  primary_platform VARCHAR(64) NOT NULL,
  social_url VARCHAR(500) NOT NULL,
  audience_size VARCHAR(64) NOT NULL,
  content_category VARCHAR(64) NOT NULL,
  portfolio_url VARCHAR(500) NULL,
  about TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_creator_created (created_at),
  KEY idx_creator_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
