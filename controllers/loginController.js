const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Siswa = require("../models/siswaModel");
const Perusahaan = require("../models/perusahaanModel");
const Admin = require("../models/adminModel");

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body; 
        const admin = await Admin.findOne({ username: email });
        if (admin) {
            const isMatch = await bcrypt.compare(password, admin.password);
            if (isMatch) {
                req.session.adminId = admin._id; 
                req.session.adminVerified = true; 
                return res.redirect("/admin/dashboard"); 
            } else {
                return res.render("login", { error: "Password Admin Salah!" });
            }
        }

        let user = await Siswa.findOne({ email });
        let role = "siswa";

        if (!user) {
            user = await Perusahaan.findOne({ email });
            role = "perusahaan";
        }

        if (!user) {
            return res.render("login", { success: false, message: "Email atau Username tidak terdaftar" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render("login", { success: false, message: "Password salah" });
        }

        if (role === "perusahaan" && user.isVerified === false) {
            return res.render("login", {
                success: false,
                message: "Akun perusahaan anda sedang menunggu verifikasi"
            });
        }

        const token = jwt.sign(
            { id: user._id, role: role, isVerified: user.isVerified, name: user.name }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.cookie("token", token, { httpOnly: true });
        return res.json({ success: true, role: role, token: token })

    } catch (error) {
        console.error(error); 
        res.render("login", { error: "Terjadi kesalahan pada server" });
    }
};