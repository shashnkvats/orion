-- Migration: Add anonymous usage tracking for rate limiting
-- Run this in your PostgreSQL database

-- Table to track anonymous user usage by IP address
CREATE TABLE IF NOT EXISTS orion.anonymous_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address VARCHAR(45) NOT NULL,  -- Supports IPv6 addresses
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    request_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint to ensure one row per IP per day
    CONSTRAINT unique_ip_date UNIQUE (ip_address, usage_date)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_ip_date 
    ON orion.anonymous_usage(ip_address, usage_date);

-- Function to clean up old records (run periodically)
-- Records older than 7 days can be safely deleted
CREATE OR REPLACE FUNCTION orion.cleanup_anonymous_usage()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM orion.anonymous_usage
    WHERE usage_date < CURRENT_DATE - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

