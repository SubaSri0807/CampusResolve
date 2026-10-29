
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Check required authentication settings
if (
  !process.env.ADMIN_USERNAME ||
  !process.env.ADMIN_PASSWORD ||
  !process.env.SESSION_SECRET ||
  process.env.SESSION_SECRET === "change-this-to-a-long-random-secret"
) {
  console.error(
    "Please set ADMIN_USERNAME, ADMIN_PASSWORD, and a unique SESSION_SECRET in .env"
  );
  process.exit(1);
}

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store admin sessions in MongoDB
app.use(
  session({
    name: "campusresolve.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl:
        process.env.MONGODB_URI ||
        "mongodb://127.0.0.1:27017/campusresolve",
      collectionName: "admin_sessions",
      ttl: 60 * 60 * 2
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 2 * 60 * 60 * 1000
    }
  })
);

// Admin authentication middleware
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin === true) {
    return next();
  }

  return res.status(401).json({
    message: "Admin login required"
  });
}

// Admin login
app.post("/api/admin/login", (req, res, next) => {
  const { username, password } = req.body;

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      message: "Invalid username or password"
    });
  }

  req.session.regenerate((error) => {
    if (error) return next(error);

    req.session.isAdmin = true;
    req.session.adminUsername = username;

    req.session.save((saveError) => {
      if (saveError) return next(saveError);

      res.json({
        message: "Admin login successful"
      });
    });
  });
});

// Check admin session
app.get("/api/admin/session", (req, res) => {
  res.json({
    authenticated: req.session?.isAdmin === true
  });
});

// Admin logout
app.post("/api/admin/logout", requireAdmin, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie("campusresolve.sid", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });

    res.json({
      message: "Logged out successfully"
    });
  });
});

// Serve HTML, CSS and JavaScript files
app.use(express.static(path.join(__dirname, "public")));

// Complaint routes

 // Complaint routes
const complaintRoutes = require("./routes/complaints");

app.use(
  "/api/complaints",
  (req, res, next) => {
    const isPublicRequest =
      req.method === "GET" &&
      (
        req.path === "/public/recent" ||
        req.path === "/public/summary" ||
        /^\/[^/]+\/track\/?$/.test(req.path)
      );

    const isAdminOnlyRequest =
      req.method === "GET" ||
      (
        req.method === "PATCH" &&
        /^\/[^/]+\/status\/?$/.test(req.path)
      );

    if (isPublicRequest) {
      return next();
    }

    if (isAdminOnlyRequest) {
      return requireAdmin(req, res, next);
    }

    // Allow student complaint submissions.
    next();
  },
  complaintRoutes
);


// Health check
app.get("/api/health", (req, res) => {
  res.json({
    app: "CampusResolve",
    server: "Running",
    database:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected"
  });
});

// Start server after connecting to MongoDB
async function startServer() {
  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      "mongodb://127.0.0.1:27017/campusresolve";

    await mongoose.connect(mongoUri);

    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`CampusResolve: http://localhost:${PORT}`);
      console.log(
        `Admin login: http://localhost:${PORT}/admin-login.html`
      );
      console.log(
        `Health check: http://localhost:${PORT}/api/health`
      );
      console.log(
        `Complaints API: http://localhost:${PORT}/api/complaints`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start CampusResolve:",
      error.message
    );
    process.exit(1);
  }
}

startServer();
