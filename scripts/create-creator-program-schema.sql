CREATE TABLE IF NOT EXISTS creator_program_applications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  city VARCHAR(120) NOT NULL,
  country VARCHAR(120) NOT NULL,
  mobile VARCHAR(32) NULL,
  primary_platform VARCHAR(64) NOT NULL,
  social_url VARCHAR(500) NOT NULL,
  audience_size VARCHAR(64) NOT NULL,
  content_category VARCHAR(64) NOT NULL,
  portfolio_url VARCHAR(500) NULL,
  about TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_cpa_created (created_at),
  KEY idx_cpa_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
