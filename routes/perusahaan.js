const express = require("express");
const router = express.Router();

const Perusahaan = require("../models/perusahaanModel");
const Lowongan = require("../models/lowonganModel");
const Pendaftaran = require("../models/pendaftaranModel");

const auth = require("../middlewares/authMiddleware");
const checkProfile = require("../middlewares/checkProfile");
const upload = require("../controllers/uploadController");

const path = require("path");
const fs = require("fs");

router.get("/dashboard/perusahaan", auth, checkProfile, async (req, res) => {
  try {
    const userData = await Perusahaan.findById(req.user.id);
    if (!userData) return res.redirect("/logout");

    const myLoker = await Lowongan.find({ perusahaan: req.user.id });

    const stats = {
      totalLoker: myLoker.length,
      lokerAktif: myLoker.filter((l) => l.status === "Aktif").length,
      totalPelamar: await Pendaftaran.countDocuments({
        lowongan: { $in: myLoker.map((l) => l._id) },
      }),
    };

    res.render("dashboard/perusahaan/index", {
      user: userData,
      companyName: userData.name,
      stats,
      currentPage: "dashboard",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error memuat dashboard");
  }
});

router.get("/perusahaan/profil", auth, async (req, res) => {
  try {
    const dataPerusahaan = await Perusahaan.findById(req.user.id);
    res.render("dashboard/perusahaan/profil", {
      user: dataPerusahaan,
      perusahaan: dataPerusahaan,
      currentPage: "profile",
    });
  } catch (err) {
    res.status(500).send("Gagal memuat profil");
  }
});

router.get("/dashboard/perusahaan/setup", auth, async (req, res) => {
  try {
    const userData = await Perusahaan.findById(req.user.id);
    res.render("dashboard/perusahaan/setup_profil", {
      user: userData,
      currentPage: "profile",
    });
  } catch (err) {
    res.status(500).send("Gagal memuat halaman setup");
  }
});

router.post(
  "/api/perusahaan/update-profil",
  auth,
  (req, res, next) => {
    const uploadAction = upload.fields([
      { name: "logo", maxCount: 1 },
      { name: "cv", maxCount: 1 },
    ]);

    uploadAction(req, res, function (err) {
      if (err) {
        console.error("Upload Error:", err.message);
        return res.redirect(
          `/perusahaan/profil?error=${encodeURIComponent(err.message)}`
        );
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const {
        name,
        email,
        alamat,
        telepon,
        deskripsi,
        bidangIndustri,
        website,
      } = req.body;

      const userId = req.user.id;

      const oldData = await Perusahaan.findById(userId);
      if (!oldData) return res.status(404).send("User tidak ditemukan");

      const industriArr = bidangIndustri
        ? bidangIndustri.split(",").map((i) => i.trim())
        : [];

      const updateData = {
        name,
        email,
        alamat,
        telepon,
        deskripsi,
        bidangIndustri: industriArr,
        website: website || "",
        isProfileComplete: true,
      };

      if (req.files && req.files.logo && req.files.logo.length > 0) {
        if (oldData.logo && oldData.logo !== "default-logo.png") {
          const oldLogoPath = path.join(
            process.cwd(),
            "public/uploads/logos",
            oldData.logo
          );
          if (fs.existsSync(oldLogoPath)) fs.unlinkSync(oldLogoPath);
        }
        updateData.logo = req.files.logo[0].filename;
      }

      if (req.files && req.files.cv && req.files.cv.length > 0) {
        updateData.cv = req.files.cv[0].filename;
      }

      await Perusahaan.findByIdAndUpdate(userId, { $set: updateData });

      res.redirect("/perusahaan/profil?status=success");
    } catch (err) {
      console.error("Update Profil Error:", err);
      res.status(500).send("Gagal update profil");
    }
  }
);

router.get("/kelola-loker", auth, checkProfile, async (req, res) => {
  try {
    const userData = await Perusahaan.findById(req.user.id);

    const myLoker = await Lowongan.find({
      perusahaan: req.user.id,
    }).sort({ createdAt: -1 });

    const lokerWithCount = await Promise.all(
      myLoker.map(async (loker) => {
        const count = await Pendaftaran.countDocuments({
          lowongan: loker._id,
        });
        return { ...loker._doc, jumlahPelamar: count };
      })
    );

    res.render("dashboard/perusahaan/kelola_loker", {
      user: userData,
      listLoker: lokerWithCount,
      currentPage: "manage",
    });
  } catch (err) {
    res.status(500).send("Gagal memuat loker");
  }
});

router.get("/career-perusahaan", auth, checkProfile, async (req, res) => {
  try {
    const userData = await Perusahaan.findById(req.user.id);
    const listLoker = await Lowongan.find({
      perusahaan: req.user.id,
    }).sort({ createdAt: -1 });

    res.render("dashboard/perusahaan/career_perusahaan", {
      user: userData,
      listLoker,
      currentPage: "career",
    });
  } catch (err) {
    res.status(500).send("Gagal memuat halaman karir");
  }
});

router.get("/help-perusahaan", auth, async (req, res) => {
  const userData = await Perusahaan.findById(req.user.id);
  res.render("dashboard/perusahaan/help", {
    user: userData,
    currentPage: "help",
  });
});

const helpPages = [
  "help",
  "fya",
  "formal_tech",
  "guide_book",
  "report_penalty",
  "suggestion",
  "acc_setting",
];

helpPages.forEach((page) => {
  router.get(`/dashboard/perusahaan/${page}`, auth, async (req, res) => {
    try {
      const user = await Perusahaan.findById(req.user.id);
      res.render(`dashboard/perusahaan/${page}`, {
        user,
        currentPage: "help",
      });
    } catch (err) {
      res.redirect("/dashboard/perusahaan");
    }
  });
});

router.get("/dashboard/perusahaan/*", (req, res) => {
  res.redirect("/dashboard/perusahaan");
});

module.exports = router;