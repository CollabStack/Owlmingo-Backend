const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema(
  {
    global_id: {
      type: String,
      unique: true,
      default: uuidv4, // Automatically generate a UUID
    },
    role: {
      type: String,
      enum: {
        values: ["user", "admin"],
        message: "Role must be either 'user' or 'admin'",
      },
      default: "user",
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      validate: [
        {
          validator: function (value) {
            return /^[A-Za-z]+$/.test(value);
          },
          message: "Username must contain only letters",
        },
        {
          validator: function (value) {
            return value.length >= 3 && value.length <= 20;
          },
          message: "Username must be between 3 and 20 characters long",
        },
      ],
    },
    email: {
      type: String,
      required: false,
      unique: true,
      validate: [
        {
          validator: function (value) {
            return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value);
          },
          message: "Please provide a valid email address",
        }
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      validate: [
        {
          validator: function (value) {
            return value.length >= 6;
          },
          message: "Password must be at least 6 characters long",
        },
      ],
    },
    google_id: {
      type: String,
      required: false,
      unique: true,
    },
    telegram_id: {
      type: String,
      required: false,
      unique: true
    },
    github_id: {
      type: String,
      required: false,
      unique: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("User", userSchema);
