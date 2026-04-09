const Perusahaan = require('../models/perusahaanModel');
const Lowongan = require('../models/lowonganModel');
const Pendaftaran = require('../models/pendaftaranModel'); 
const path = require('path');
const fs = require('fs');

exports.updateProfilPerusahaan = async (req, res) => {
    try {
        const { alamat, telepon, phone, deskripsi, name, email, bidangIndustri, website } = req.body;
        const phoneUpdate = telepon || phone;

        const oldData = await Perusahaan.findById(req.user.id);
        if (!oldData) return res.status(404).send("Perusahaan tidak ditemukan");

        const updateData = {
            name: name || oldData.name,
            email: email || oldData.email,
            alamat: alamat || oldData.alamat,
            telepon: phoneUpdate || oldData.telepon,
            deskripsi: deskripsi || oldData.deskripsi,
            website: website || oldData.website,
            bidangIndustri: bidangIndustri ? bidangIndustri.split(",").map(s => s.trim()) : oldData.bidangIndustri,
            isProfileComplete: true,
            isVerified: true
        };

        if (req.file) {
            if (oldData.logo && oldData.logo !== 'default-logo.png') {
                const oldPath = path.join(__dirname, '../public/uploads/logos/', oldData.logo);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            updateData.logo = req.file.filename;
        }

        await Perusahaan.findByIdAndUpdate(req.user.id, { $set: updateData });

        console.log(`✅ Profil Perusahaan ${req.user.id} berhasil diperbarui.`);
        res.redirect("/perusahaan/profil?status=success");
        
    } catch (err) {
        console.error("❌ Error Update Profil:", err);
        res.status(500).json({ success: false, message: "Gagal memperbarui profil" });
    }
};

exports.getKelolaLoker = async (req, res) => {
    try {
        const perusahaanId = req.user.id;
        const listLoker = await Lowongan.find({ perusahaan: perusahaanId }).sort({ createdAt: -1 }).lean();

      
        const lokerWithCount = await Promise.all(listLoker.map(async (loker) => {
          
            const jumlahPelamar = await Pendaftaran.countDocuments({ lowongan: loker._id });
            return { 
                ...loker, 
                jumlahPelamar 
            };
        }));

        res.render("perusahaan/kelola_loker", { 
            listLoker: lokerWithCount,
            currentPage: 'manage',
            user: req.user 
        });
    } catch (err) {
        console.error("❌ Error Get Kelola Loker:", err);
        res.status(500).send("Gagal memuat daftar lowongan");
    }
};

exports.getPelamarByLoker = async (req, res) => {
    try {
        const { id } = req.params; 
      
        const listPelamar = await Pendaftaran.find({ lowongan: id })
            .populate('pendaftar') 
            .populate('tamu')     
            .sort({ createdAt: -1 });

        const loker = await Lowongan.findById(id);

        res.render("perusahaan/list_pelamar", {
            pelamar: listPelamar,
            loker: loker,
            currentPage: 'manage'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Gagal memuat list pelamar");
    }
};