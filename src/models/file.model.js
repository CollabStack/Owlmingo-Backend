const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const fileSchema = new mongoose.Schema(
  {
    global_id: {
      type: String,
      unique: true,
      default: uuidv4, // Automatically generate a UUID
    },
    url: {
      type: String,
      required: true,
      required: false,
    },
    data: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "doc",
        "docx",
        "txt",
        "rtf",
        "odt",
        "md",
        "pdf",
        "jpg",
        "jpeg",
        "png",
        "gif",
        "bmp",
        "tiff",
        "tif",
        "webp",
        "svg",
      ],
      required: true,
    },
    user_id: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("File", fileSchema);