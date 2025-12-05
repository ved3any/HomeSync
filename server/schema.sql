-- Create the database 
 CREATE DATABASE homesync_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; 
 
 -- Use the database 
 USE homesync_db; 
 
 -- Create the users table 
 CREATE TABLE users ( 
     id INT AUTO_INCREMENT PRIMARY KEY, 
     email VARCHAR(255) UNIQUE, 
     mobile VARCHAR(20) UNIQUE, 
     password_hash VARCHAR(255), 
     is_email_verified BOOLEAN DEFAULT FALSE, 
     google_id VARCHAR(255) UNIQUE, 
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
 ); 
 
 -- Create the verifications table 
 CREATE TABLE verifications ( 
     id INT AUTO_INCREMENT PRIMARY KEY, 
     user_id INT, 
     code VARCHAR(10), 
     expires_at DATETIME, 
     is_used BOOLEAN DEFAULT FALSE, 
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE 
 );