const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET;

function generateToken(userId) {
  // Generate JWT token with user ID embedded
  const token = jwt.sign(
    { userId: parseInt(userId) },
    SECRET_KEY
  );
  return token;
}

// Middleware to verify token on protected routes
function verifyToken(token, userId) {
  if (!token) return "0x0FFD: No Authorization Token Provided";
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (parseInt(decoded.userId) !== parseInt(userId)) return "0x0FFF: Authorization Token Has Been Altered. Access Denied!";
    return true;
  } catch (err) {
    return "0x0FFE: Invalid Authorization Token. Access Denied!";
  }
}

module.exports = { generateToken, verifyToken }; // Export functions