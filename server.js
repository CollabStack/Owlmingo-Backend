const express = require("express");
const connectDB = require("./src/database");
const { port } = require('./src/config/app.config');

const app = express();

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Import Routes
const userRoutes = require("./src/routes/user.routes");
const adminRoutes = require("./src/routes/admin.rotues");

// Use Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", adminRoutes);

console.log(port);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});