const mongoose = require("mongoose");

const webLogSchema = new mongoose.Schema({
    name: {
        type: String,
        default: "Guest"
    },
    role: {
        type: String,
        default: "guest"
    },
    deviceId: {
        type: String
    },
    ip: {
        type: String
    },
    userAgent: { 
        type: String 
    },
    action: {             
        type: String,
        default: "/"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("WebLog", webLogSchema);