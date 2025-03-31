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
        total_price: {
            type: Number,
            required: [true, "Total price is required"],
            validate: [
                {
                    validator: function (value) {
                        return value >= 0;
                    },
                    message: "Total price must be a positive number",
                },
            ],
        },
        is_annual: {
            type: Boolean,
            default: false,
        },
        description: {
            type: [String],
            required: [true, "Description is required"],
            validate: [
                {
                    validator: function (arr) {
                        return Array.isArray(arr) && arr.every(str => typeof str === "string" && str.length >= 10 && str.length <= 200);
                    },
                    message: "Each description must be between 10 and 200 characters long",
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