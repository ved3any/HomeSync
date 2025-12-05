const path = require("path");
const jwt = require("./jwtverification");

const setupRedirects = (app) => {
  // Middleware to protect routes
  const isAuthenticated = (req, res, next) => {
    try {
      if (jwt.verifyToken(req.cookies.token, req.cookies.userId) === true) {
        return next();
      } else {
        res.redirect("/");
      }
    } catch (error) {
        res.redirect("/");
    }
  };

  const isNotAuthenticated = (req, res, next) => {
    try {
      if (jwt.verifyToken(req.cookies.token, req.cookies.userId) !== true) {
        return next();
      } else {
        res.redirect("/dashboard");
      }
    } catch (error) {
        res.redirect("/dashboard");
    }
  };

  const clearCookiesAndRedirect = (req, res) => {
    res.clearCookie('token');
    res.clearCookie('userId');
    res.redirect('/');
  };

  // Serve static files for routes
  app.get("/api/register", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/404.html"));
  });

  app.get("/api/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/404.html"));
  });

  app.get("/api/verify", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/404.html"));
  });

  app.get("/api/resend-otp", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/404.html"));
  });

  app.get("/api/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/404.html"));
  });

  app.get("/", isNotAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "../public/login.html"));
  });

  app.get("/register", isNotAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "../public/register.html"));
  });

  app.get("/verify", isNotAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "../public/verify.html"));
  });

  app.get("/dashboard", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "../public/dashboard.html"));
  });

  app.get("/logout", (req, res) => {
    clearCookiesAndRedirect(req, res);
  });
};

module.exports = setupRedirects;