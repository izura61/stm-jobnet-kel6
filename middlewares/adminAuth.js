module.exports = (req, res, next) => {
    if (req.session && req.session.adminVerified) {
        return next();
    }
    res.redirect("/admin/verify");
};