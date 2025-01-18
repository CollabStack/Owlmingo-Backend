const express = require("express");
const connectDB = require("./database");
const {port} = require('./config/app.config');

const app = express();

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
// app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/user", require("./routes/user.routes"));
console.log(port)
// // Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});