// middleware/checkSiswaProfile.js
const Siswa = require("../models/siswaModel");

module.exports = async (req, res, next) => {
    try {
        // 1. Pastikan user sudah login (objek req.user ada)
        if (!req.user || !req.user.id) {
            return res.redirect("/login");
        }

        const siswa = await Siswa.findById(req.user.id);

        // 2. Jika user tidak ditemukan di database
        if (!siswa) {
            return res.redirect("/login");
        }

        // 3. Cek data krusial: NIS dan KELAS
        // CV dan FOTO sengaja tidak dicek agar bersifat OPSIONAL
        if (!siswa.nis || !siswa.kelas) {
            // Jika sedang berada di route setup, jangan redirect lagi (cegah loop)
            if (req.path === "/setup-siswa") {
                return next();
            }
            return res.redirect("/setup-siswa");
        }

        // 4. Jika sudah lengkap, dan malah mencoba buka halaman setup, 
        // tendang balik ke dashboard (opsional, biar rapi)
        if (req.path === "/setup-siswa") {
            return res.redirect("/dashboard/siswa");
        }

        next(); 
    } catch (err) {
        console.error("Error in checkSiswaProfile Middleware:", err);
        res.redirect("/login");
    }
};