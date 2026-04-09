const mongoose = require('mongoose');

const siswaSchema = new mongoose.Schema({

  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'siswa' },

  nis: { type: String, unique: true, sparse: true }, 
  kelas: String,
  programKeahlianId: { type: mongoose.Schema.Types.ObjectId, ref: "ProgramKeahlian" },
  konsentrasiKeahlianId: { type: mongoose.Schema.Types.ObjectId, ref: "KonsentrasiKeahlian" },
  skill: [String],
  cv: String,
  foto: { type: String, default: "default-user.png" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Siswa', siswaSchema);