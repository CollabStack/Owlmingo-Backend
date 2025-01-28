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
const adminRoutes = require("./routes/admin.routes");

// Use Routes
app.get('/', (req, res) => {res.send('Welcome to Owlmingo 🦉 Bro Jeat King of the Lok 😂');});
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", adminRoutes);

const PORT = process.env.PORT || port;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});