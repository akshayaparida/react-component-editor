-- Initialize database for React Component Editor
-- This script runs when the PostgreSQL container starts for the first time

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS public;

-- Set default privileges
GRANT ALL ON SCHEMA public TO reacteditor;
GRANT ALL ON SCHEMA public TO public;

-- Enable extensions that might be useful
-- Note: Some extensions might not be available in Alpine version
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For better text search

-- Set timezone
SET timezone TO 'UTC';
