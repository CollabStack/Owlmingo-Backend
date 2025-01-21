const express = require("express");
const session = require("express-session"); // Import express-session
const passport = require("./config/passport.config"); // Import Passport config
const connectDB = require("./database");
const { port,  } = require("./config/app.config");
const crypto = require("crypto");
const sessionSecret = crypto.randomBytes(32).toString("hex");

// Initialize Express App
const app = express();

// Middleware
app.use(express.json());

// Initialize session middleware
app.use(
  session({
    secret: sessionSecret, // Replace with a strong secret
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session()); // Enable session support

// Database Connection
connectDB();

// Import Routes
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");

// API Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", adminRoutes);

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
