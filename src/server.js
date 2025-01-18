const express = require("express");
const connectDB = require("./database");
const { port } = require('./config/app.config');

const app = express();

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Import Routes
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.rotues");

// Use Routes
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

console.log(port);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});