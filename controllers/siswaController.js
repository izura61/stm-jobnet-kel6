const Siswa = require("../models/siswaModel");
const fs = require('fs');
const path = require('path');

exports.setupProfil = async (req, res) => {
    try {
        const { nis, kelas, skill, name } = req.body;
        const userId = req.user.id;
        const errors = [];

        if (!nis || nis.length < 5) errors.push("NIS tidak valid (minimal 5 karakter)");
        if (!kelas) errors.push("Pilih jurusan terlebih dahulu");

        if (errors.length > 0) {
            return res.render("dashboard/siswa/setup_profil", { 
                error_messages: errors, 
                user: req.user, 
                old_data: req.body 
            });
        }

        const updateData = {
            name: name || req.user.name,
            nis,
            kelas,
            skill: skill ? skill.split(",").map(s => s.trim()).filter(s => s !== "") : [],
            isProfileComplete: true 
        };

        if (req.files && req.files['foto']) {
            updateData.foto = req.files['foto'][0].filename;
        } 

        if (req.files && req.files['cv']) {
            updateData.cv = req.files['cv'][0].filename;
        }

        await Siswa.findByIdAndUpdate(userId, { $set: updateData });

        res.redirect("/dashboard/siswa?status=setup_success");

    } catch (err) {
        console.error("Setup Error:", err);
        const errorMsg = err.code === 11000 ? "NIS sudah terdaftar oleh siswa lain" : "Gagal menyimpan profil";
        res.render("dashboard/siswa/setup_profil", { 
            error_messages: [errorMsg], 
            user: req.user, 
            old_data: req.body 
        });
    }
};


exports.updateProfil = async (req, res) => {
    try {
        const { name, email, skill, bio } = req.body;
        const userId = req.user.id;
        
        const userLama = await Siswa.findById(userId);
        if (!userLama) return res.redirect("/login");

        const updateData = {};
        let isChanged = false;

      
        if (name && name !== userLama.name) { updateData.name = name; isChanged = true; }
        if (email && email !== userLama.email) { updateData.email = email; isChanged = true; }
        if (bio !== undefined && bio !== userLama.bio) { updateData.bio = bio; isChanged = true; }

      
        const newSkills = skill ? skill.split(",").map(s => s.trim()).filter(s => s !== "") : [];
        if (JSON.stringify(newSkills) !== JSON.stringify(userLama.skill || [])) {
            updateData.skill = newSkills;
            isChanged = true;
        }

        if (req.files && req.files['foto']) {
         
            if (userLama.foto && userLama.foto !== 'default-user.png') {
                const pathFotoLama = path.join(__dirname, '../public/uploads/profile/', userLama.foto);
                if (fs.existsSync(pathFotoLama)) fs.unlinkSync(pathFotoLama);
            }
            updateData.foto = req.files['foto'][0].filename;
            isChanged = true;
        }

  
        if (req.files && req.files['cv']) {
   
            if (userLama.cv) {
                const pathCvLama = path.join(__dirname, '../public/uploads/cv/', userLama.cv);
                if (fs.existsSync(pathCvLama)) fs.unlinkSync(pathCvLama);
            }
            updateData.cv = req.files['cv'][0].filename;
            isChanged = true;
        }

        if (isChanged) {
            await Siswa.findByIdAndUpdate(userId, { $set: updateData });
            return res.redirect("/profil-siswa?status=success");
        } else {
            return res.redirect("/profil-siswa?status=no_change");
        }

    } catch (err) {
        console.error("Update Error:", err);
        res.redirect("/profil-siswa?status=error");
    }
};