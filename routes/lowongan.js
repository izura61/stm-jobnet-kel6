const express = require("express");
const router = express.Router();
const Lowongan = require("../models/lowonganModel");
const Pendaftaran = require("../models/pendaftaranModel");
const auth = require("../middlewares/authMiddleware");

router.get('/jelajah-loker', async (req, res) => {
    try {
        const listLowongan = await Lowongan.find({ status: "Aktif" })
            .populate('perusahaan', 'name logo lokasi')
            .sort({ createdAt: -1 });

        res.render('public/daftar_lowongan', { 
            listLowongan,
            user: req.user || null,
            query: req.query 
        });
    } catch (err) {
        res.status(500).send("Gagal memuat lowongan");
    }
});

router.post("/daftar", auth, async (req, res) => {
    try {
        const { lowonganId, namaTamu, emailTamu, whatsapp } = req.body;
        const userId = req.user ? (req.user.id || req.user._id) : null;

        if (req.user && req.user.role === 'siswa') {
            const sudahDaftar = await Pendaftaran.findOne({ 
                lowongan: lowonganId, 
                pendaftar: userId 
            });

            if (sudahDaftar) {
                return res.redirect(`/api/lowongan/form-daftar?id=${lowonganId}&status=already_applied`);
            }

            await Pendaftaran.create({
                lowongan: lowonganId,
                pendaftar: userId,
                nama: req.user.name,
                email: req.user.email,
                whatsapp: req.user.whatsapp || null,
                status: "Pending"
            });
            
            return res.redirect(`/api/lowongan/form-daftar?id=${lowonganId}&status=applied`);
        } 
        
        if (!namaTamu || !emailTamu) {
            return res.redirect(`/api/lowongan/form-daftar?id=${lowonganId}&status=missing_fields`);
        }

        const pendaftaranBaru = await Pendaftaran.create({
            lowongan: lowonganId,
            nama: namaTamu,
            email: emailTamu,
            whatsapp: whatsapp || null,
            tamu: { 
                nama: namaTamu, 
                email: emailTamu, 
                whatsapp: whatsapp,
                isGuest: true 
            },
            cv_tamu: req.body.cv_tamu || null,
            status: "Pending"
        });
        
        return res.redirect(`/jelajah-loker?status=success_tamu&id_lamaran=${pendaftaranBaru._id}`);

    } catch (err) {
        console.error("Error Daftar:", err);
        res.status(500).send("Terjadi kesalahan server.");
    }
});

router.get("/form-daftar", auth, async (req, res) => {
    try {
        const lowonganId = req.query.id;
        if (!lowonganId) return res.redirect("/jelajah-loker");

        const loker = await Lowongan.findById(lowonganId).populate('perusahaan');
        
        let sudahDaftar = false;
        if (req.user && req.user.role === 'siswa') {
            const cek = await Pendaftaran.findOne({ 
                lowongan: lowonganId, 
                pendaftar: req.user.id || req.user._id 
            });
            if (cek) sudahDaftar = true;
        }

        res.render("dashboard/siswa/form_daftar", { 
            loker, 
            user: req.user || null,
            sudahDaftar,
            query: req.query 
        });
    } catch (err) {
        res.status(500).send("Gagal memuat form");
    }
});

router.post("/create", auth, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'perusahaan') return res.status(403).send("Akses Ditolak");
        
        const { judul, deskripsi, lokasi, gaji, tipe, kualifikasi } = req.body;
        await Lowongan.create({
            judul,
            perusahaan: req.user.id || req.user._id,
            deskripsi,
            lokasi: lokasi || "Cimahi / On-site",
            gaji: gaji || "Kompetitif",
            tipe,
            kualifikasi,
            status: "Aktif"
        });
        res.redirect("/kelola-loker");
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

router.post("/pendaftaran/status", auth, async (req, res) => {
    try {
        const { pendaftaranId, statusBaru } = req.body;
        const userId = req.user.id || req.user._id;

        const pendaftaran = await Pendaftaran.findById(pendaftaranId).populate('lowongan');
        if (!pendaftaran || pendaftaran.lowongan.perusahaan.toString() !== userId.toString()) {
            return res.status(403).send("Akses dilarang!");
        }

        pendaftaran.status = statusBaru; 
        await pendaftaran.save();
        res.redirect("back");
    } catch (err) {
        res.status(500).send("Gagal update status");
    }
});

router.get("/:id/pelamar", auth, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const loker = await Lowongan.findOne({ _id: req.params.id, perusahaan: userId });
        
        if (!loker) return res.status(404).send("Akses Ditolak");

        const pendaftaran = await Pendaftaran.find({ lowongan: req.params.id })
            .populate("pendaftar")
            .sort({ createdAt: -1 });

        res.render("dashboard/perusahaan/pelamar_masuk", { 
            pendaftaran, 
            loker,
            user: req.user,
            currentPage: 'manage' 
        });
    } catch (err) {
        res.status(500).send("Gagal memuat daftar pelamar");
    }
});

router.get("/pendaftaran/detail/:id", auth, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const p = await Pendaftaran.findById(req.params.id)
            .populate("pendaftar")
            .populate("lowongan");

        if (!p || p.lowongan.perusahaan.toString() !== userId.toString()) {
            return res.status(403).send("Akses dilarang!");
        }

        res.render("dashboard/perusahaan/detail_pelamar", { 
            p, 
            user: req.user,
            currentPage: 'manage' 
        });
    } catch (err) {
        res.status(500).send("Error");
    }
});

router.post('/toggle-status/:id', async (req, res) => {
    try {
        const loker = await Lowongan.findById(req.params.id);
        if (!loker) return res.status(404).send("Lowongan tidak ditemukan");

        loker.status = (loker.status === 'Aktif') ? 'Tutup' : 'Aktif';
        await loker.save();
        
        res.redirect('back'); 
    } catch (err) {
        console.error(err);
        res.status(500).send("Gagal mengubah status");
    }
});

router.post('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await Lowongan.findByIdAndDelete(id);
        res.redirect('back');
    } catch (err) {
        console.error(err);
        res.status(500).send("Gagal menghapus data");
    }
});

module.exports = router;