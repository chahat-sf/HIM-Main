ALTER TABLE waitlist_subscribers
  ADD COLUMN instagram_username VARCHAR(64) NULL
  AFTER email;
