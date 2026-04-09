const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  role: {
    type: String,
    enum: ["siswa", "perusahaan", "admin", "tamu"],
    required: true
  },
  token: {
    type: String,
    required: true
  },
  loginAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Session", sessionSchema);