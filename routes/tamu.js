const express = require("express");
const router = express.Router();
const Perusahaan = require("../models/perusahaanModel");
const Lowongan = require("../models/lowonganModel");
const Pendaftaran = require("../models/pendaftaranModel");
const upload = require('../controllers/uploadController');

router.get("/dashboard/tamu", async (req, res) => {
    try {
        const listPerusahaan = await Perusahaan.find({ isProfileComplete: true })
            .sort({ createdAt: -1 })
            .limit(8);

        const topPerusahaan = await Lowongan.aggregate([
            { $match: { status: "Aktif" } },
            { $group: { _id: "$perusahaan", totalLowongan: { $sum: 1 } } },
            { $sort: { totalLowongan: -1 } },
            { $limit: 8 },
            { 
                $lookup: { 
                    from: "perusahaans", 
                    localField: "_id", 
                    foreignField: "_id", 
                    as: "details" 
                } 
            },
            { $unwind: "$details" },
            { $match: { "details.isProfileComplete": true } }
        ]);

        res.render("dashboard/tamu/index", { 
            user: null, 
            listPerusahaan, 
            topPerusahaan,
            query: req.query,
            currentPage: 'dashboard'
        });
    } catch (err) {
        console.error("Error Dashboard Tamu:", err);
        res.status(500).send("Gagal memuat dashboard");
    }
});

router.get("/tamu/mitra", async (req, res) => {
    try {
        const listPerusahaan = await Perusahaan.find({ isProfileComplete: true })
            .sort({ name: 1 });

        res.render("dashboard/tamu/career", { 
            user: null, 
            listPerusahaan, 
            currentPage: 'company' 
        });
    } catch (err) {
        res.status(500).send("Gagal memuat daftar mitra");
    }
});

router.get("/jelajah-loker", async (req, res) => {
    try {
        const { search, lokasi } = req.query;
        let filter = { status: "Aktif" };

        if (search) filter.judul = { $regex: search, $options: "i" };
        if (lokasi) filter.lokasi = { $regex: lokasi, $options: "i" };

        const listLoker = await Lowongan.find(filter)
            .populate({
                path: "perusahaan",
                match: { isProfileComplete: true }
            })
            .sort({ createdAt: -1 });

        const filteredLoker = listLoker.filter(loker => loker.perusahaan !== null);
        const listPerusahaan = await Perusahaan.find({ isProfileComplete: true }).limit(4);

        res.render("dashboard/tamu/career", { 
            user: null, 
            listLoker: filteredLoker,
            listPerusahaan: listPerusahaan, 
            query: req.query,
            currentPage: 'explore'
        });
    } catch (err) {
        res.status(500).send("Gagal memuat halaman jelajah");
    }
});

router.get("/tamu/company/:id", async (req, res) => {
    try {
        const perusahaan = await Perusahaan.findOne({ 
            _id: req.params.id, 
            isProfileComplete: true 
        });
        
        if (!perusahaan) return res.status(404).send("Perusahaan tidak ditemukan");

        const listLoker = await Lowongan.find({ 
            perusahaan: req.params.id, 
            status: "Aktif" 
        });

        res.render("dashboard/tamu/company_detail", { 
            perusahaan, 
            listLoker, 
            user: null,
            currentPage: 'company'
        });
    } catch (err) {
        res.status(500).send("Error memuat detail perusahaan");
    }
});

router.get('/apply-lowongan/:id', async (req, res) => {
    try {
        const lokerId = req.params.id;
        const loker = await Lowongan.findById(lokerId).populate('perusahaan');

        if (!loker) {
            return res.status(404).send('Lowongan tidak ditemukan');
        }

        res.render('dashboard/tamu/form_apply', { 
            loker: loker, 
            user: null, 
            currentPage: 'explore'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Terjadi kesalahan server');
    }
});


router.get('/apply/:id', async (req, res) => {
    try {
        const loker = await Lowongan.findById(req.params.id).populate('perusahaan');
        if (!loker) return res.status(404).send("Lowongan tidak ditemukan");

        res.render("dashboard/tamu/form_apply", { 
            loker, 
            user: null, 
            currentPage: 'explore' 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error memuat form");
    }
});

router.post("/tamu/apply", upload.single('cv'), async (req, res) => {
    try {
        const { lowonganId, nama, email, whatsapp } = req.body;

        const lamaranBaru = new Pendaftaran({
            lowongan: lowonganId,
            pendaftar: null, 
            status: "Pending",
            tamu: {
                nama: nama,
                email: email,
                whatsapp: whatsapp,
                isGuest: true
            },
       
            cv_tamu: req.file ? req.file.filename : null 
        });

        await lamaranBaru.save();

        res.render("dashboard/tamu/sukses_daftar", { 
            id: lamaranBaru._id,
            nama: nama,
            currentPage: 'explore'
        });
    } catch (err) {
        console.error("Gagal Simpan:", err);
        res.status(500).send("Sistem sedang sibuk.");
    }
});

router.get("/status-lamaran-tamu", (req, res) => {
    res.render("dashboard/tamu/cek_status", { 
        user: null, 
        hasil: null, 
        query: req.query,
        currentPage: 'status_tamu' 
    });
});

router.post("/status-lamaran-tamu/cari", async (req, res) => {
    try {
        const { pendaftaranId } = req.body;
        
        const hasil = await Pendaftaran.findById(pendaftaranId)
            .populate({
                path: 'lowongan',
                populate: { path: 'perusahaan' }
            });

        res.render("dashboard/tamu/cek_status", { 
            user: null, 
            hasil: hasil, 
            query: req.query,
            currentPage: 'status_tamu' 
        });
    } catch (err) {
        res.render("dashboard/tamu/cek_status", { 
            user: null, 
            hasil: "not_found", 
            query: req.query,
            currentPage: 'status_tamu' 
        });
    }
});

const guestHelpPages = ['help', 'fya', 'formal_tech', 'guide_book', 'report_penalty', 'suggestion', 'acc_setting'];

guestHelpPages.forEach(page => {
    router.get(`/dashboard/tamu/${page}`, async (req, res) => {
        try {
          
            res.render(`dashboard/tamu/${page}`, { 
                user: null, 
                currentPage: 'help' 
            });
        } catch (err) {
            console.error(`Gagal memuat halaman: ${page}`, err);
            res.status(404).redirect('/dashboard/tamu');
        }
    });
});
module.exports = router;