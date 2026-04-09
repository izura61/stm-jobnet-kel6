const express = require('express');
const router = express.Router();

const Siswa = require("../models/siswaModel");
const Perusahaan = require("../models/perusahaanModel");
const Lowongan = require("../models/lowonganModel");
const Pendaftaran = require("../models/pendaftaranModel");

const auth = require('../middlewares/authMiddleware'); 
const checkProfile = require('../middlewares/checkSiswaProfile');
const siswaCtrl = require('../controllers/siswaController'); 
const upload = require('../controllers/uploadController'); 

router.get('/setup-siswa', auth, async (req, res) => {
    try {
        const user = await Siswa.findById(req.user.id);
        res.render('dashboard/siswa/setup_profil', { 
            user, 
            error_messages: [], 
            old_data: {} 
        });
    } catch (err) {
        res.redirect('/login');
    }
});

router.post('/api/siswa/setup', auth, (req, res, next) => {
    upload.fields([
        { name: 'foto', maxCount: 1 },
        { name: 'cv', maxCount: 1 }
    ])(req, res, function (err) {
        if (err) {
            return res.render('dashboard/siswa/setup_profil', { 
                user: req.user,
                error_messages: [err.message],
                old_data: req.body 
            });
        }
        next();
    });
}, siswaCtrl.setupProfil);

router.get('/dashboard/siswa', auth, checkProfile, async (req, res) => {
    try {
        const user = await Siswa.findById(req.user.id);

        const topPerusahaan = await Lowongan.aggregate([
            { $match: { status: "Aktif" } },
            { 
                $group: { 
                    _id: "$perusahaan", 
                    totalLowongan: { $sum: 1 } 
                } 
            },
            { $sort: { totalLowongan: -1 } },
            { $limit: 15 },
            { 
                $lookup: { 
                    from: "perusahaans", 
                    localField: "_id", 
                    foreignField: "_id", 
                    as: "details" 
                } 
            },
            { $unwind: "$details" },
            { $match: { "details.isProfileComplete": true } },
            { 
                $lookup: {
                    from: "pendaftarans",
                    localField: "_id",
                    foreignField: "lowongan",
                    as: "lamaranMasuk"
                }
            },
            {
                $addFields: {
                    totalSkor: { $add: ["$totalLowongan", { $size: "$lamaranMasuk" }] }
                }
            },
            { $sort: { totalSkor: -1 } },
            { $limit: 8 }
        ]);

        const listPerusahaan = await Perusahaan.find({ isProfileComplete: true })
            .sort({ createdAt: -1 })
            .limit(8);

        res.render('dashboard/siswa/index', {
            user,
            topPerusahaan,
            listPerusahaan,
            currentPage: 'dashboard'
        });
    } catch (err) {
        res.status(500).send("Error loading dashboard");
    }
});

router.get("/career-siswa", auth, checkProfile, async (req, res) => {
    try {
        const user = await Siswa.findById(req.user.id);
        const listPerusahaan = await Perusahaan.find({ isProfileComplete: true }).sort({ name: 1 });
        const listLoker = await Lowongan.find({ status: "Aktif" })
            .populate({
                path: "perusahaan",
                match: { isProfileComplete: true }
            });
        
        const filteredLoker = listLoker.filter(loker => loker.perusahaan !== null);

        res.render("dashboard/siswa/career", { 
            user, 
            listLoker: filteredLoker, 
            listPerusahaan,
            currentPage: 'career' 
        });
    } catch (err) { 
        console.error(err);
        res.status(500).send("Gagal memuat halaman career"); 
    }
});

router.get("/dashboard/siswa/company/:id", auth, checkProfile, async (req, res) => {
    try {
        const perusahaan = await Perusahaan.findOne({ _id: req.params.id, isProfileComplete: true });
        if (!perusahaan) return res.status(404).send("Perusahaan tidak ditemukan atau belum lengkap");

        const listLoker = await Lowongan.find({ perusahaan: req.params.id, status: "Aktif" }); 

        res.render("dashboard/siswa/company_detail", { 
            perusahaan, 
            listLoker, 
            user: req.user,
            currentPage: 'company'
        });
    } catch (err) { res.status(500).send("Error Detail Perusahaan"); }
});

router.get("/dashboard/siswa/lamaran", auth, checkProfile, async (req, res) => {
    try {
        const lamaranRaw = await Pendaftaran.find({ pendaftar: req.user.id })
            .populate({ 
                path: 'lowongan', 
                populate: { path: 'perusahaan' }
            })
            .sort({ createdAt: -1 });

        const lamaran = lamaranRaw.filter(item => item.lowongan && item.lowongan.perusahaan);

        res.render("dashboard/siswa/status_lamaran", { 
            user: req.user, 
            lamaran, 
            currentPage: 'status' 
        });
    } catch (err) { 
        console.error(err);
        res.status(500).send("Gagal memuat status"); 
    }
});

router.get("/profil-siswa", auth, checkProfile, async (req, res) => {
    try {
        const user = await Siswa.findById(req.user.id);
        res.render("dashboard/siswa/profil_siswa", { user, query: req.query });
    } catch (err) {
        res.redirect('/dashboard/siswa');
    }
});

router.post('/api/siswa/update-profil', auth, (req, res, next) => {
    const uploadProses = upload.fields([
        { name: 'foto', maxCount: 1 },
        { name: 'cv', maxCount: 1 }
    ]);

    uploadProses(req, res, function (err) {
        if (err) {

            console.error("Menangkap Error Upload:", err.message);
            return res.redirect(`/profil-siswa?error=${encodeURIComponent(err.message)}`);
        }
        siswaCtrl.updateProfil(req, res, next);
    });
});

const helpPages = ['help', 'fya', 'formal_tech', 'guide_book', 'report_penalty', 'suggestion', 'acc_setting'];

helpPages.forEach(page => {
    router.get(`/dashboard/siswa/${page}`, auth, async (req, res) => {
        try {
            const user = await Siswa.findById(req.user.id);
            res.render(`dashboard/siswa/${page}`, { user });
        } catch (err) {
            res.redirect('/dashboard/siswa');
        }
    });
});

module.exports = router;