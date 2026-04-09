const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Session = require("../models/sessionModel");
const Siswa = require("../models/siswaModel");
const Perusahaan = require("../models/perusahaanModel");

router.post("/register", async (req, res) => {
    const { email, password, role, name } = req.body;

    try {
        if (!email || !password || !role || !name) {
            return res.status(400).json({ success: false, message: "Semua field wajib diisi" });
        }

        const Model = role === "siswa" ? Siswa : Perusahaan;

        const exist = await Model.findOne({ email });
        if (exist) {
            return res.status(400).json({ success: false, message: "Email sudah terdaftar" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await Model.create({
            name,
            email,
            password: hashedPassword,
            role
        });

        return res.status(201).json({
            success: true,
            message: "Registrasi Berhasil! Silakan Login."
        });

    } catch (err) {
        console.error("REGISTER ERROR:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

router.post("/login", async (req, res) => {
    const { email, password, role: guestRole } = req.body;

    try {

        console.log("==== LOGIN ATTEMPT ====");
        console.log("Input:", { email, guestRole });

        if (guestRole === "tamu") {
            const token = jwt.sign({ role: "tamu" }, process.env.JWT_SECRET, { expiresIn: "1h" });
            res.cookie("token", token, { httpOnly: true, maxAge: 3600000 });
            return res.json({ success: true, role: "tamu", redirect: "/index" });
        }

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email/Username dan Password wajib diisi" });
        }

        let user = null;
        let roleFound = null;

        user = await Siswa.findOne({ $or: [{ email: email }, { name: email }] });
        if (user) roleFound = "siswa";

        if (!user) {
            user = await Perusahaan.findOne({ $or: [{ email: email }, { name: email }] });
            if (user) roleFound = "perusahaan";
        }

        if (email === process.env.SUPERADMIN_USERNAME) {
            if (password === process.env.SUPERADMIN_PASSWORD) {
                const token = jwt.sign(
                    { id: "superadmin", role: "admin" },
                    process.env.JWT_SECRET,
                    { expiresIn: "1d" }
                );

                req.session.adminVerified = true; 

                res.cookie("token", token, {
                    httpOnly: true,
                    sameSite: "lax",
                    secure: false,
                    path: "/",
                    maxAge: 86400000
                });

                console.log("==== LOGIN ADMIN SUCCESS ====");
                return res.json({
                    success: true,
                    message: "Login Admin Berhasil",
                    role: "admin",
                    token,
                    redirect: "/admin/dashboard",
                    data: { id: "superadmin", name: process.env.SUPERADMIN_USERNAME }
                });
            } else {
                return res.status(400).json({ success: false, message: "Password Admin Salah!" });
            }
        }

        console.log("User ditemukan:", user ? user._id : null);
        console.log("Role ditemukan:", roleFound);

        if (!user) {
            return res.status(404).json({ success: false, message: "Akun tidak ditemukan" });
        }

        console.log("Password dari DB:", user.password);

        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password match result:", isMatch);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Password salah" });
        }

        if (roleFound === "admin") {
            console.log("Setting session adminVerified");
            req.session.adminVerified = false;
        }

        console.log("JWT_SECRET:", process.env.JWT_SECRET);

        const token = jwt.sign(
            { id: user._id, role: roleFound },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        console.log("Token berhasil dibuat");

        await Session.create({ userId: user._id, role: roleFound, token });

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            path: "/",
            maxAge: 86400000
        });

        let targetUrl = "/";

        if (roleFound === "siswa") {
            targetUrl = !user.nis ? "/setup-siswa" : "/dashboard/siswa";
        } 
        else if (roleFound === "perusahaan") {
            targetUrl = !user.deskripsi ? "/setup-perusahaan" : "/dashboard/perusahaan";
        }
        else if (roleFound === "admin") {
            targetUrl = "/admin/verify";
        }

        console.log("Redirect ke:", targetUrl);
        console.log("==== LOGIN SUCCESS ====");

        return res.json({
            success: true,
            message: "Login Berhasil",
            role: roleFound,
            token,
            redirect: targetUrl,
            data: { id: user._id, name: user.name || user.username }
        });

    } catch (err) {
        console.error("LOGIN ERROR ASLI:");
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;