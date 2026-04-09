const Pendaftaran = require("../models/pendaftaranModel");
const Lowongan = require("../models/lowonganModel");

exports.daftarLoker = async (req, res) => {
    try {
        
        console.log("=== DEBUG PENDAFTARAN ===");
        console.log("BODY DATA:", req.body); 
        console.log("FILE DATA:", req.file); 
        console.log("=========================");

        const { lowonganId, nama, email, whatsapp } = req.body;

        if (req.user && req.user.role === 'siswa') {
            const cekLamaran = await Pendaftaran.findOne({ 
                lowongan: lowonganId, 
                pendaftar: req.user.id 
            });

            if (cekLamaran) {
                return res.redirect(`/tamu/apply/${lowonganId}?status=already_applied`);
            }

            await Pendaftaran.create({
                lowongan: lowonganId,
                pendaftar: req.user.id,
                status: "Pending"
            });

            return res.redirect("/dashboard/siswa/lamaran?status=success");

        } else {
        
            if (!nama || !email) {
                return res.status(400).send("Nama dan Email wajib diisi.");
            }

            const fileCV = req.file ? req.file.filename : null;

            const lamaranTamu = await Pendaftaran.create({
                lowongan: lowonganId,
                pendaftar: null,
                tamu: { 
                    nama: nama, 
                    email: email, 
                    whatsapp: whatsapp,
                    isGuest: true 
                },
                cv_tamu: fileCV,
                status: "Pending"
            });

            return res.render("dashboard/tamu/sukses_daftar", { 
                id: lamaranTamu._id,
                nama: nama,
                currentPage: 'explore'
            });
        }
    } catch (err) {
        console.error("❌ Error pada daftarLoker:", err);
        res.status(500).send("Terjadi kesalahan pada sistem saat mendaftar.");
    }
};


exports.daftarLowongan = async (req, res) => {
    try {
        const { lowonganId } = req.body;
        const siswaId = req.user._id;

        const sudahMelamar = await Pendaftaran.findOne({ 
            lowongan: lowonganId, 
            pendaftar: siswaId 
        });

        if (sudahMelamar) {
            return res.redirect(`/dashboard/siswa/lowongan/${lowonganId}?status=already_applied`);
        }

        await Pendaftaran.create({
            lowongan: lowonganId,
            pendaftar: siswaId,
            status: "Pending"
        });

        res.redirect(`/dashboard/siswa/lowongan/${lowonganId}?status=applied`);

    } catch (error) {
        console.error(error);
        res.status(500).send("Terjadi kesalahan server");
    }
};