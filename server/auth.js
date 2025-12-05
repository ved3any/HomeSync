const express = require("express");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const db = require("./db");
const jwt = require("./jwtverification");

const router = express.Router();

async function sendVerificationEmail(email, verificationCode) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const emailTemplate = fs.readFileSync(
      path.join(__dirname, "otp-email.html"),
      "utf-8"
    );
    const html = emailTemplate.replace("{{OTP}}", verificationCode);

    const info = await transporter.sendMail({
      from: '"HomeSync" <noreply@homesync.com>',
      to: email,
      subject: "HomeSync Email Verification",
      html: html,
    });

    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
}

// API endpoint for user registration
router.post("/register", async (req, res) => {
  const { email, mobile, password } = req.body;

  if ((!email && !mobile) || !password) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Email/mobile and password are required.",
      });
  }

  try {
    // Check if user already exists
    const user = await db.getUserByEmailOrMobile(email, mobile);

    if (user) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user
    const userId = await db.createUser(email, mobile, hashedPassword);

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Store the verification code
    await db.storeVerificationCode(userId, verificationCode);

    // Send verification code via email
    if (email) {
      await sendVerificationEmail(email, verificationCode);
    }

    res.status(201).json({
      success: true,
      message:
        "User registered successfully. A verification code has been sent.",
      userId: userId,
      token: jwt.generateToken(userId),
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// API endpoint for verifying the code
router.post("/verify", async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res
      .status(400)
      .json({ success: false, message: "Email and code are required." });
  }

  try {
    const user = await db.getUserByEmail(email);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const verification = await db.getVerificationCode(user.id, code);

    if (!verification) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired code." });
    }

    // Mark the code as used
    await db.markVerificationCodeAsUsed(verification.id);

    // Mark the user as verified
    await db.markUserAsVerified(user.id, "is_email_verified");

    res.cookie("token", jwt.generateToken(user.id));
    res.cookie("userId", user.id);
    res.json({ success: true, message: "Verification successful.", token: jwt.generateToken(user.id), userId: user.id });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// API endpoint for resending the code
router.post("/resend-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required." });
  }

  try {
    const user = await db.getUserByEmail(email);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    await db.storeVerificationCode(user.id, verificationCode);

    await sendVerificationEmail(email, verificationCode);

    res.json({
      success: true,
      message: "A new verification code has been sent.",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// API endpoint for user login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required." });
  }

  try {
    const user = await db.getUserByEmail(email);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    if (!user.is_email_verified) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Please verify your email before logging in.",
        });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    res.cookie("token", jwt.generateToken(user.id));
    res.cookie("userId", user.id);
    res.json({
      success: true,
      message: "Login successful.",
      userId: user.id,
      token: jwt.generateToken(user.id),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// API endpoint for user logout
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Could not log out, please try again.",
        });
    }
    res.redirect("/");
  });
});

module.exports = router;