const mongoose = require('mongoose');

const perusahaanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "perusahaan" },
  isProfileComplete: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  alamat: { type: String },
  telepon: { type: String }, 
  deskripsi: { type: String },
  logo: { type: String, default: "default-logo.png" },
  website: { type: String },
  bidangIndustri: [String],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Perusahaan", perusahaanSchema);