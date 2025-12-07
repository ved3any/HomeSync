
require("dotenv").config();

const dbClient = process.env.DB_CLIENT;

let db;

if (dbClient === "supabase") {
  const { createClient } = require("@supabase/supabase-js");
  db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
} else {
  const mysql = require("mysql2/promise");
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  db = pool;
}

async function getUserByEmailOrMobile(email, mobile) {
  if (dbClient === "supabase") {
    const { data, error } = await db
      .from("users")
      .select("*")
      .or(`email.eq.${email},mobile.eq.${mobile}`);
    if (error) throw error;
    return data[0];
  } else {
    const sql = "SELECT * FROM users WHERE email = ? OR mobile = ?";
    const [rows] = await db.query(sql, [email || null, mobile || null]);
    return rows[0];
  }
}

async function createUser(email, mobile, passwordHash) {
  if (dbClient === "supabase") {
    const { data, error } = await db
      .from("users")
      .insert([{ email, mobile, password_hash: passwordHash }])
      .select();
    if (error) throw error;
    return data[0].id;
  } else {
    const sql =
      "INSERT INTO users (email, mobile, password_hash) VALUES (?, ?, ?)";
    const [result] = await db.query(sql, [
      email || null,
      mobile || null,
      passwordHash,
    ]);
    return result.insertId;
  }
}

async function storeVerificationCode(userId, code) {
  if (dbClient === "supabase") {
    const { error } = await db
      .from("verifications")
      .insert([
        {
          user_id: userId,
          code,
          expires_at: new Date(Date.now() + 10 * 60 * 1000),
        },
      ]);
    if (error) throw error;
  } else {
    const sql =
      "INSERT INTO verifications (user_id, code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))";
    await db.query(sql, [userId, code]);
  }
}

async function getVerificationCode(userId, code) {
  if (dbClient === "supabase") {
    const { data, error } = await db
      .from("verifications")
      .select("*")
      .eq("user_id", userId)
      .eq("code", code)
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString());
    if (error) throw error;
    return data[0];
  } else {
    const sql =
      "SELECT * FROM verifications WHERE user_id = ? AND code = ? AND is_used = ? AND expires_at > NOW()";
    const [rows] = await db.query(sql, [userId, code, false]);
    return rows[0];
  }
}

async function markVerificationCodeAsUsed(verificationId) {
  if (dbClient === "supabase") {
    const { error } = await db
      .from("verifications")
      .update({ is_used: true })
      .eq("id", verificationId);
    if (error) throw error;
  } else {
    const sql = "UPDATE verifications SET is_used = ? WHERE id = ?";
    await db.query(sql, [true, verificationId]);
  }
}

async function markUserAsVerified(userId, verificationField) {
  if (dbClient === "supabase") {
    const { error } = await db
      .from("users")
      .update({ [verificationField]: true })
      .eq("id", userId);
    if (error) throw error;
  } else {
    const sql = `UPDATE users SET ${verificationField} = ? WHERE id = ?`;
    await db.query(sql, [true, userId]);
  }
}

async function getUserByEmail(email) {
  if (dbClient === "supabase") {
    const { data, error } = await db
      .from("users")
      .select("*")
      .eq("email", email);
    if (error) throw error;
    return data[0];
  } else {
    const sql = "SELECT * FROM users WHERE email = ?";
    const [rows] = await db.query(sql, [email]);
    return rows[0];
  }
}

module.exports = {
  getUserByEmailOrMobile,
  createUser,
  storeVerificationCode,
  getVerificationCode,
  markVerificationCodeAsUsed,
  markUserAsVerified,
  getUserByEmail,
};