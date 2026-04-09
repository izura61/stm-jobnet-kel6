const mongoose = require("mongoose");

const lowonganSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  perusahaan: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Perusahaan", 
    required: true 
  },
  deskripsi: { type: String, required: true },
  lokasi: { type: String, required: true },
  gaji: { type: String },
  tipe: { 
    type: String, 
    enum: ["PKL", "Magang", "Kerja"], 
    required: true 
  },
  kualifikasi: { type: String },
  status: { type: String, enum: ["Aktif", "Tutup"], default: "Aktif" },
  tanggalDibuat: { type: Date, default: Date.now }
});

exports.updateStatusPelamar = async (req, res) => {
    try {
        const { pendaftaranId, statusBaru } = req.body;
        
        const pendaftaran = await Pendaftaran.findById(pendaftaranId).populate('lowongan');
        
        if (!pendaftaran || pendaftaran.lowongan.perusahaan.toString() !== req.user.id) {
            return res.status(403).send("Akses ditolak");
        }

        pendaftaran.status = statusBaru;
        await pendaftaran.save();
        
        res.redirect("back"); 
    } catch (err) {
        res.status(500).send("Error update status");
    }
};

module.exports = mongoose.model("Lowongan", lowonganSchema);