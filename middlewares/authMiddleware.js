const jwt = require('jsonwebtoken');
const Siswa = require("../models/siswaModel");
const Perusahaan = require("../models/perusahaanModel");

module.exports = async (req, res, next) => {
    let token = (req.cookies && req.cookies.token) ? req.cookies.token : null;
    
    if (!token && req.headers['authorization']) {
        token = req.headers['authorization'].split(' ')[1];
    }

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        let userData;

        if (decoded.role === 'siswa') {
            userData = await Siswa.findById(decoded.id);
            
        } else if (decoded.role === 'perusahaan') {
            userData = await Perusahaan.findById(decoded.id);
            if (userData && userData.isVerified === false) {
                res.clearCookie("token");
                return res.redirect("/login?error=awaiting_verification");
            }
            
        } else if (decoded.role === 'admin') {
            userData = {
                _id: "superadmin",
                name: process.env.SUPERADMIN_USERNAME || "Admin Utama",
                role: "admin"
            };
        }

        if (userData) {
            req.user = userData.toObject ? userData.toObject() : userData;
            req.user.id = userData._id ? userData._id.toString() : "superadmin"; 
            req.user.role = decoded.role;
        } else {
            req.user = null;
        }
        
        next();
        
    } catch (err) {
        res.clearCookie("token");
        req.user = null;
        next();
    }
};