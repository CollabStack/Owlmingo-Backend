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
app.get('/', (req, res) => {res.send('Hello, World!');});
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", adminRoutes);

console.log(port);
const PORT = process.env.PORT || 3001;

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});