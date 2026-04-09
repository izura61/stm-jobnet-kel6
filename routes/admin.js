const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const adminAuth = require("../middlewares/adminAuth");
const Session = require("../models/sessionModel");

const Admin = require("../models/adminModel");
const Perusahaan = require("../models/perusahaanModel");
const Siswa = require("../models/siswaModel");
const Lowongan = require("../models/lowonganModel");
const Pendaftaran = require("../models/pendaftaranModel");
const Log = require("../models/logModel");

router.get("/verify", (req, res) => {
  if (!req.session.adminId) {
    return res.render("dashboard/admin/verify");
  }
  return res.redirect("/admin/dashboard");
});

router.post("/verify", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.json({ success: false, message: "Username dan Password wajib diisi" });
    }

    const admin = await Admin.findOne({ username: username });
    if (!admin) {
        return res.json({ success: false, message: "Kredensial tidak valid" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
        return res.json({ success: false, message: "Kredensial tidak valid" });
    }

    req.session.adminId = admin._id;
    return res.json({ success: true });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false });
  }
});

router.get("/dashboard", adminAuth, async (req, res) => {
  try {
    const notifications = await Perusahaan.find({ isVerified: false }).sort({ createdAt: -1 });
    const totalCompanies = await Perusahaan.countDocuments();
    const totalSiswa = await Siswa.countDocuments();
    const totalLowongan = await Lowongan.countDocuments();

    res.render("dashboard/admin/dashboard", {
      notifications,
      totalCompanies,
      totalSiswa,
      totalLowongan,
      currentPage: "dashboard"
    });
  } catch (err) {
    res.status(500).send("Internal server error");
  }
});

router.get("/user-management", adminAuth, async (req, res) => {
  try {
    if (!req.session.adminVerified) return res.redirect("/admin/verify");

    const perusahaanUsers = await Perusahaan.find();
    const siswaUsers = await Siswa.find();
    const tamuUsers = await Session.find();

    res.render("dashboard/admin/user-management", {
      perusahaanUsers,
      siswaUsers,
      tamuUsers,
      currentPage: "user-management"
    });
  } catch (err) {
    console.error(err);
    res.redirect("/admin/dashboard");
  }
});

router.get('/user-profile/:role/:id', adminAuth, async (req, res) => {
    try {
        if (!req.session.adminVerified) return res.redirect('/admin/verify');

        const { role, id } = req.params;
        let userData;

        if (role === 'siswa') {
            userData = await Siswa.findById(id).lean();
        } else if (role === 'perusahaan') {
            userData = await Perusahaan.findById(id).lean();
            if (userData && userData.logo && !userData.foto) {
                userData.foto = userData.logo;
            }
        }

        if (!userData) return res.redirect('/admin/user-management');

        res.render('dashboard/admin/user_profile', {
            user: userData,
            role: role,
            currentPage: 'user-management'
        });
    } catch (err) {
        res.redirect('/admin/user-management');
    }
});

router.post("/delete-foto/:role/:id", adminAuth, async (req, res) => {
    try {
        const { role, id } = req.params;
        
        if (role === 'siswa') {
      
            await Siswa.findByIdAndUpdate(id, { $unset: { foto: 1 } }, { strict: false });
        } else if (role === 'perusahaan') {
   
            await Perusahaan.findByIdAndUpdate(id, { $unset: { foto: 1, logo: 1, image: 1 } }, { strict: false });
        }

        res.redirect(req.get("Referrer") || "/admin/user-management");
    } catch (err) {
        console.error("Error saat menghapus foto:", err);
        res.redirect("/admin/user-management");
    }
});

router.post("/delete-:type/:id", adminAuth, async (req, res) => {
    try {
        const { type, id } = req.params;

        if (type === 'siswa') {
            await Pendaftaran.deleteMany({ siswa: id });
            await Siswa.findByIdAndDelete(id);
        } else if (type === 'perusahaan') {
            await Lowongan.deleteMany({ perusahaan: id });
            await Pendaftaran.deleteMany({ perusahaan: id });
            await Perusahaan.findByIdAndDelete(id);
        } else if (type === 'tamu') {
            await Session.findByIdAndDelete(id);
        }
        
        res.redirect("/admin/user-management");
    } catch (err) {
        res.redirect("/admin/user-management");
    }
});

router.post("/blacklist-siswa/:id", adminAuth, (req, res) => {
    res.redirect("/admin/user-management"); 
});

router.post("/blacklist-perusahaan/:id", adminAuth, (req, res) => {
    res.redirect("/admin/user-management");
});

router.post("/company/approve/:id", adminAuth, async (req, res) => {
  try {
    await Perusahaan.findByIdAndUpdate(req.params.id, { isVerified: true });
    res.redirect("/admin/dashboard");
  } catch (err) {
    res.status(500).send("Internal server error");
  }
});

router.post("/company/reject/:id", adminAuth, async (req, res) => {
  try {
    await Perusahaan.findByIdAndDelete(req.params.id);
    res.redirect("/admin/dashboard");
  } catch (err) {
    res.status(500).send("Internal server error");
  }
});

router.get("/report-management", adminAuth, async (req, res) => {
  try {
    res.render("dashboard/admin/report-management", {
      title: "Report Management",
      currentPage: "report-management"
    });
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

router.get("/web-monitoring", adminAuth, async (req, res) => {
  try {

    const logs = await Log.find().sort({ createdAt: -1 });

    res.render("dashboard/admin/web-monitoring", {
      title: "Web Monitoring",
      currentPage: "web-monitoring",
      logs: logs 
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/verify"); 
  });
});

module.exports = router;