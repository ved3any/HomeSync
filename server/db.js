const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, '.env') });

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// General purpose query function
async function runQuery(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

// Function to get a user by email or mobile
async function getUserByEmailOrMobile(email, mobile) {
  const sql = "SELECT * FROM users WHERE email = ? OR mobile = ?";
  const rows = await runQuery(sql, [email || null, mobile || null]);
  return rows[0];
}

// Function to create a new user
async function createUser(email, mobile, passwordHash) {
  const sql = "INSERT INTO users (email, mobile, password_hash) VALUES (?, ?, ?)";
  const result = await runQuery(sql, [email || null, mobile || null, passwordHash]);
  return result.insertId;
}

// Function to store a verification code
async function storeVerificationCode(userId, code) {
  const sql = "INSERT INTO verifications (user_id, code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))";
  await runQuery(sql, [userId, code]);
}

// Function to get a verification code
async function getVerificationCode(userId, code) {
  const sql = "SELECT * FROM verifications WHERE user_id = ? AND code = ? AND is_used = ? AND expires_at > NOW()";
  const rows = await runQuery(sql, [userId, code, false]);
  return rows[0];
}

// Function to mark a verification code as used
async function markVerificationCodeAsUsed(verificationId) {
  const sql = "UPDATE verifications SET is_used = ? WHERE id = ?";
  await runQuery(sql, [true, verificationId]);
}

// Function to mark a user as verified
async function markUserAsVerified(userId, verificationField) {
  const sql = `UPDATE users SET ${verificationField} = ? WHERE id = ?`;
  await runQuery(sql, [true, userId]);
}

// Function to get a user by email
async function getUserByEmail(email) {
    const sql = "SELECT * FROM users WHERE email = ?";
    const rows = await runQuery(sql, [email]);
    return rows[0];
}

module.exports = {
  runQuery,
  getUserByEmailOrMobile,
  createUser,
  storeVerificationCode,
  getVerificationCode,
  markVerificationCodeAsUsed,
  markUserAsVerified,
  getUserByEmail
};