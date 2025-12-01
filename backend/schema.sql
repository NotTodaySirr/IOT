-- Database setup script for ECS (Environment Control System)
-- This script creates the necessary tables for the backend

-- Create sensor_data table
CREATE TABLE IF NOT EXISTS sensor_data (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    temperature FLOAT NOT NULL,
    humidity FLOAT NOT NULL,
    co_level FLOAT NOT NULL,
    is_hazardous BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create users table (for future authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

-- Create index on timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data(timestamp DESC);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Optional: Insert sample data for testing
-- INSERT INTO sensor_data (temperature, humidity, co_level, is_hazardous)
-- VALUES 
--     (24.5, 60.0, 12.5, FALSE),
--     (25.0, 58.0, 45.0, FALSE),
--     (26.5, 62.0, 55.0, TRUE);

COMMENT ON TABLE sensor_data IS 'Stores environmental sensor readings from ESP32';
COMMENT ON TABLE users IS 'User accounts for web authentication';
