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
                // DIUBAH: Mengirim respons JSON sukses untuk admin
                return res.json({ success: true, role: "admin" }); 
            } else {
                // DIUBAH: Mengirim JSON error
                return res.json({ success: false, message: "Password Admin Salah!" });
            }
        }

        let user = await Siswa.findOne({ email });
        let role = "siswa";

        if (!user) {
            user = await Perusahaan.findOne({ email });
            role = "perusahaan";
        }

        if (!user) {
            // DIUBAH: Mengirim JSON error
            return res.json({ success: false, message: "Email atau Username tidak terdaftar" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // DIUBAH: Mengirim JSON error
            return res.json({ success: false, message: "Password salah" });
        }

        if (role === "perusahaan" && user.isVerified === false) {
            // DIUBAH: Mengirim JSON pesan belum verifikasi agar ditangkap jadi pop-up di HTML
            return res.json({ 
                success: false, 
                message: "Akun perusahaan Anda sedang menunggu verifikasi admin. Silakan tunggu." 
            });
        }

        const token = jwt.sign(
            { id: user._id, role: role, isVerified: user.isVerified, name: user.name }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.cookie("token", token, { httpOnly: true });
        
        // DIUBAH: Mengirim JSON sukses untuk siswa/perusahaan
        return res.json({ success: true, role: role, token: token });

    } catch (error) {
        console.error(error); 
        // DIUBAH: Mengirim JSON error
        return res.json({ success: false, message: "Terjadi kesalahan pada server" });
    }
};