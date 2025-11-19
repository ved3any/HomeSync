const express = require("express");
const path = require("path");
const mysql = require("mysql2/promise"); // Using the promise-based API
require("dotenv").config({ path: path.join(__dirname, '.env') });
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const session = require("express-session");
const fs = require("fs");

// Create a connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(session({
    secret: process.env.SESSION_SECRET || 'a-very-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Middleware to protect routes
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    } else {
        res.redirect('/');
    }
};

// Serve static files for routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/register.html"));
});

app.get("/verify", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/verify.html"));
});

app.get("/dashboard", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "../public/dashboard.html"));
});

// API endpoint for user registration
app.post("/register", async (req, res) => {
  const { email, mobile, password } = req.body;

  if ((!email && !mobile) || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email/mobile and password are required." });
  }

  try {
    // Check if user already exists
    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ? OR mobile = ?",
      [email || null, mobile || null]
    );

    if (users.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user
    const [result] = await db.query(
      "INSERT INTO users (email, mobile, password_hash, is_email_verified, is_mobile_verified) VALUES (?, ?, ?, ?, ?)",
      [email || null, mobile || null, hashedPassword, false, false]
    );

    const userId = result.insertId;
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store the verification code
    await db.query(
      "INSERT INTO verifications (user_id, type, code, expires_at, is_used) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), ?)",
      [userId, email ? "email" : "mobile", verificationCode, false]
    );

    // Send verification code via email
    if (email) {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Read the email template
        const emailTemplate = fs.readFileSync(path.join(__dirname, "otp-email.html"), "utf-8");
        const html = emailTemplate.replace("{{OTP}}", verificationCode);

        // Send mail with defined transport object
        const info = await transporter.sendMail({
            from: '"HomeSync" <noreply@homesync.com>',
            to: email,
            subject: "HomeSync Email Verification",
            html: html
        });

        console.log("Message sent: %s", info.messageId);
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully. A verification code has been sent.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// API endpoint for verifying the code
app.post("/api/verify", async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    
    return res
      .status(400)
      .json({ success: false, message: "Email and code are required." });
  }

  try {
    const userIdentifier = email;
    const queryField = "email";

    // Find the user
    const [users] = await db.query(`SELECT id FROM users WHERE ${queryField} = ?`, [
      userIdentifier,
    ]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const userId = users[0].id;

    // Check the verification code
    const [verifications] = await db.query(
      "SELECT * FROM verifications WHERE user_id = ? AND code = ? AND is_used = ? AND expires_at > NOW()",
      [userId, code, false]
    );

    if (verifications.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired code." });
    }

    // Mark the code as used
    await db.query("UPDATE verifications SET is_used = ? WHERE id = ?", [
      true,
      verifications[0].id,
    ]);

    // Mark the user as verified
    const verificationField = "is_email_verified";
    await db.query(`UPDATE users SET ${verificationField} = ? WHERE id = ?`, [
      true,
      userId,
    ]);

    res.json({ success: true, message: "Verification successful." });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// API endpoint for resending the code
app.post("/resend-otp", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required." });
    }

    try {
        const [users] = await db.query("SELECT id FROM users WHERE email = ?", [email]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const userId = users[0].id;
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Read the email template
        const emailTemplate = fs.readFileSync(path.join(__dirname, "otp-email.html"), "utf-8");
        const html = emailTemplate.replace("{{OTP}}", verificationCode);

        await db.query(
            "INSERT INTO verifications (user_id, type, code, expires_at, is_used) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), ?)",
            [userId, "email", verificationCode, false]
        );

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: '"HomeSync" <noreply@homesync.com>',
            to: email,
            subject: "HomeSync Email Verification",
            html: html
        });

        console.log("Message sent: %s", info.messageId);

        res.json({ success: true, message: "A new verification code has been sent." });
    } catch (error) {
        console.error("Resend OTP error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

// API endpoint for user login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    try {
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid credentials." });
        }

        const user = users[0];

        if (!user.is_email_verified) {
            return res.status(401).json({ success: false, message: "Please verify your email before logging in." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid credentials." });
        }

        req.session.userId = user.id;
        res.json({ success: true, message: "Login successful." });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

// API endpoint for user logout
app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: "Could not log out, please try again." });
        }
        res.redirect('/');
    });
});

// Test DB connection endpoint
app.get("/api/db-test", async (req, res) => {
  try {
    const [results] = await db.query("SELECT 1 + 1 AS result");
    res.json({
      success: true,
      message: "DB connected!",
      result: results[0].result,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "DB connection failed", error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});