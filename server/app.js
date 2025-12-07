const express = require("express");
const path = require("path");
const session = require("express-session");
const db = require("./db");
const setupRedirects = require("./redirects");


const cookieParser = require("cookie-parser");
const app = express();
app.use(cookieParser());
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true } // Set to true if using HTTPS
}));

setupRedirects(app);

// API endpoint for user registration
const authRoutes = require("./auth");

app.use("/api/auth", authRoutes);

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

// 404 handler
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, "../public/404.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});