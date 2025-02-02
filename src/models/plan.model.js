const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");


const planSchema = new mongoose.Schema(
    {
        global_id: {
            type: String,
            unique: true,
            default: uuidv4, // Automatically generate a UUID
        },
        plan: {
            type: String,
            required: [true, "Plan is required"],
            validate: [
                {
                    validator: function (value) {
                        return value.length >= 3 && value.length <= 20;
                    },
                    message: "Plan must be between 3 and 20 characters long",
                },
            ],
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            validate: [
                {
                    validator: function (value) {
                        return value >= 0;
                    },
                    message: "Price must be a positive number",
                },
            ],
        },
        duration: {
            type: Number,
            required: [true, "Duration is required"],
            validate: [
                {
                    validator: function (value) {
                        return value >= 0;
                    },
                    message: "Duration must be a positive number",
                },
            ],
        },
        is_popular: {
            type: Boolean,
            default: false,
        },
        is_active: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Plan", planSchema);