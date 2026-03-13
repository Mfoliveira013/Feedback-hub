-- Feedback Hub - MySQL 8+
-- Migration: 001_create_schema.down.sql

USE feedback_hub;

DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS report_imports;
DROP TABLE IF EXISTS periodic_survey_responses;
DROP TABLE IF EXISTS periodic_surveys;
DROP TABLE IF EXISTS feedbacks;
DROP TABLE IF EXISTS user_gestores;
DROP TABLE IF EXISTS users;

