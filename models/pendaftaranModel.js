const mongoose = require("mongoose");

const pendaftaranSchema = new mongoose.Schema({
    lowongan: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Lowongan', 
        required: true 
    },
    pendaftar: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Siswa' 
    },
    nama: {
        type: String
    },
    email: {
        type: String
    },
    whatsapp: {
        type: String
    },
    tamu: {
        nama: String,
        email: String,
        whatsapp: String,
        isGuest: { type: Boolean, default: false }
    },

    cv_tamu: { 
        type: String 
    },

    status: { 
        type: String, 
        enum: ["Pending", "Diterima", "Ditolak"], 
        default: "Pending" 
    }

}, { 
    timestamps: true 
});

module.exports = mongoose.model("Pendaftaran", pendaftaranSchema);