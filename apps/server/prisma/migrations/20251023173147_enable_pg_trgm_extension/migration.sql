-- Enable PostgreSQL trigram extension for fuzzy search
-- This provides the similarity() function used in fuzzy text matching

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index on commonly searched text fields for performance
-- Add more indexes here as needed for your specific use cases

-- Example: CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_name_trgm ON "Company" USING gin (name gin_trgm_ops);
-- Example: CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_name_trgm ON "Contact" USING gin ("firstName" gin_trgm_ops, "lastName" gin_trgm_ops);
