-- CollegeSafe Database Schema
-- Initial migration to create all tables

-- Create enums
CREATE TYPE role AS ENUM ('student', 'counsellor', 'admin');
CREATE TYPE session_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE session_type AS ENUM ('individual', 'group');
CREATE TYPE resource_type AS ENUM ('worksheet', 'video', 'audio', 'interactive');
CREATE TYPE message_status AS ENUM ('sent', 'read');

-- Create sessions table for session storage
CREATE TABLE sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Create index on expire column for efficient cleanup
CREATE INDEX IDX_session_expire ON sessions(expire);

-- Create users table
CREATE TABLE users (
    id VARCHAR PRIMARY KEY NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    role role NOT NULL DEFAULT 'student',
    password_hash VARCHAR NOT NULL,
    password_salt VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes on users table
CREATE INDEX email_idx ON users(email);
CREATE INDEX role_idx ON users(role);

-- Create resources table
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    type VARCHAR NOT NULL,
    url VARCHAR NOT NULL,
    created_by VARCHAR REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes on resources table
CREATE INDEX type_idx ON resources(type);
CREATE INDEX created_by_idx ON resources(created_by);

-- Create counselling_sessions table
CREATE TABLE counselling_sessions (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR REFERENCES users(id) NOT NULL,
    counsellor_id VARCHAR REFERENCES users(id) NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending',
    scheduled_at TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes on counselling_sessions table
CREATE INDEX student_idx ON counselling_sessions(student_id);
CREATE INDEX counsellor_idx ON counselling_sessions(counsellor_id);
CREATE INDEX status_idx ON counselling_sessions(status);
CREATE INDEX scheduled_at_idx ON counselling_sessions(scheduled_at);

-- Create messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id VARCHAR REFERENCES users(id) NOT NULL,
    receiver_id VARCHAR REFERENCES users(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes on messages table
CREATE INDEX sender_idx ON messages(sender_id);
CREATE INDEX receiver_idx ON messages(receiver_id);
CREATE INDEX messages_created_at_idx ON messages(created_at);

-- Create user_progress table
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    resource_id INTEGER REFERENCES resources(id) NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    last_accessed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes on user_progress table
CREATE INDEX progress_user_idx ON user_progress(user_id);
CREATE INDEX progress_resource_idx ON user_progress(resource_id);
CREATE INDEX completed_idx ON user_progress(completed);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_counselling_sessions_updated_at BEFORE UPDATE ON counselling_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user
INSERT INTO users (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    password_hash, 
    password_salt
) VALUES (
    'admin-001',
    'admin@collegesafe.com',
    'System',
    'Administrator',
    'admin',
    -- Hash of 'admin123' with salt 'collegesafe_salt'
    '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    'collegesafe_salt'
);

-- Insert sample counsellor user
INSERT INTO users (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    password_hash, 
    password_salt
) VALUES (
    'counsellor-001',
    'counsellor@collegesafe.com',
    'Jane',
    'Smith',
    'counsellor',
    -- Hash of 'counsellor123' with salt 'collegesafe_salt'
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'collegesafe_salt'
);

-- Insert sample resources
INSERT INTO resources (title, description, type, url, created_by) VALUES
    ('Stress Management Worksheet', 'A comprehensive worksheet to help students manage stress and anxiety', 'worksheet', '/resources/stress-management.pdf', 'counsellor-001'),
    ('Meditation Video', 'A 10-minute guided meditation video for relaxation', 'video', '/resources/meditation-video.mp4', 'counsellor-001'),
    ('Breathing Exercise Audio', 'Audio guide for breathing exercises', 'audio', '/resources/breathing-exercise.mp3', 'counsellor-001'),
    ('Interactive Mood Tracker', 'An interactive tool to track daily mood and emotions', 'interactive', '/resources/mood-tracker', 'counsellor-001');
