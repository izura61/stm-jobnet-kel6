module.exports = (req, res, next) => {
    if (req.session && req.session.adminId) {
        return next();
    }
    res.redirect("/admin/verify");
};