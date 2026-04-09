const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Siswa = require("../models/siswaModel");
const Perusahaan = require("../models/perusahaanModel");

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        let user = await Siswa.findOne({ email });
        let role = "siswa";

        if (!user) {
            user = await Perusahaan.findOne({ email });
            role = "perusahaan";
        }

        if (!user) {
            return res.render("login", { error: "Email atau Username tidak terdaftar" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render("login", { error: "Password salah" });
        }

        if (role === "perusahaan" && user.isVerified === false) {
            return res.render("login", {
                error: "Akun perusahaan anda sedang menunggu verifikasi admin"
            });
        }

        const token = jwt.sign(
            { id: user._id, role: role, isVerified: user.isVerified, name: user.name }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.cookie("token", token, { httpOnly: true });
        
        if (role === "siswa") return res.redirect("/siswa/dashboard");
        if (role === "perusahaan") return res.redirect("/perusahaan/dashboard");

    } catch (error) {
        console.error(error); 
        res.render("login", { error: "Terjadi kesalahan pada server" });
    }
};