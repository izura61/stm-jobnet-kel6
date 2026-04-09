module.exports = (req, res, next) => {
    // 1. Jika belum login (diurus authMiddleware) atau role bukan perusahaan, lewat saja
    if (!req.user || req.user.role !== 'perusahaan') {
        return next();
    }

    // 2. Ambil path tujuan
    const currentPath = req.path; // contoh: /dashboard/perusahaan/setup

    // 3. Daftar path yang DIKECUALIKAN agar tidak looping
    const isSetupPage = currentPath === '/dashboard/perusahaan/setup' || currentPath.startsWith('/api/perusahaan/setup');
    const isStaticFile = currentPath.includes('.') || currentPath.startsWith('/css') || currentPath.startsWith('/js');

    // 4. LOGIKA UTAMA: Jika profil belum lengkap DAN bukan di halaman setup
    // Asumsi: isProfileComplete adalah field boolean di model Perusahaan
    if (!req.user.isProfileComplete && !isSetupPage && !isStaticFile) {
        console.log("⚠️ Profil belum lengkap, mengalihkan ke setup...");
        return res.redirect('/dashboard/perusahaan/setup');
    }

    next();
};