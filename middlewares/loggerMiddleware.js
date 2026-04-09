const logController = require("../controllers/logController");

module.exports = async (req, res, next) => {
    const cleanUrl = req.originalUrl.split('?')[0]; 
    
    if (
        cleanUrl.match(/\.(css|js|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf)$/i) || 
        cleanUrl.startsWith("/uploads") ||
        cleanUrl.startsWith("/images") ||
        cleanUrl.startsWith("/assets")    
    ) {
        return next();
    }

    try {
        let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
        if (ip === "::1" || ip === "Localhost") {
            ip = "127.0.0.1";
        }
        
        const deviceId = ip; 
        const userAgent = req.headers["user-agent"] || "Unknown Device"; 
        
        let currentActivity = req.originalUrl;
        
        if (currentActivity === "/") {
            currentActivity = "Halaman Home";
        } else if (currentActivity.includes("/login")) {
            currentActivity = "Halaman Login";
        } else if (currentActivity.includes("/register")) {
            currentActivity = "Halaman Register";
        } else if (currentActivity.includes("/admin/dashboard")) {
            currentActivity = "Dashboard Admin";
        } else if (currentActivity.includes("/admin/user-management")) {
            currentActivity = "Manajemen User";
        } else if (currentActivity.includes("/admin/report-management")) {
            currentActivity = "Manajemen Laporan";
        } else if (currentActivity.includes("/admin/web-monitoring")) {
            currentActivity = "Web Monitoring";
        } else if (currentActivity.includes("/form-daftar")) {
            currentActivity = "Form Pendaftaran";
        }else if (currentActivity.includes("/logout")) {
            currentActivity = "Logout";
        }

        const logData = {
            role: req.user ? req.user.role : "tamu",
            name: req.user && req.user.name ? req.user.name : "Guest",
            deviceId: deviceId,
            ip: ip,
            userAgent: userAgent,
            action: currentActivity
        };

        await logController.createLog(req, logData);
    } catch (err) {
        console.error(err);
    }
    next();
};