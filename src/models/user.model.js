// src/models/user.model.js
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema(
  {
    global_id: {
      type: String,
      default: uuidv4, // Automatically generate a UUID
      unique: true, // Ensure uniqueness
    },
    username: {
      type: String,
      required: [true, "Username is required"], // Custom error message
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [20, "Username cannot exceed 20 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // Ensure email is unique
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    role: {
      type: String,
      enum: ["user", "admin"], // Only 'user' or 'admin' allowed
      default: "user",
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Create an index for the email field to optimize queries
// userSchema.index({ email: 1 });

// Export the model
module.exports = mongoose.model("User", userSchema);
