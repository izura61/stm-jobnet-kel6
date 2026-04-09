require("./utils/cleanupLogs");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const path = require("path");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const connectDB = require("./database/db");
const bcrypt = require("bcryptjs");

const app = express();
connectDB();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method"));

let MongoStore = require("connect-mongo");
if (MongoStore.default) {
    MongoStore = MongoStore.default;
}

app.use(session({
    secret: process.env.SESSION_SECRET || "stm-job-secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/stmjob",
        dbName: "stmjob", 
        collectionName: "sessions"
    }),
    cookie: {
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

app.use(express.static(path.join(__dirname, "public")));

app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

const loginRoutes = require("./routes/login");
const tamuRoutes = require("./routes/tamu");

app.use("/api/login", loginRoutes);
app.use("/", tamuRoutes);

app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/login", (_req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/register", (_req, res) => res.sendFile(path.join(__dirname, "public", "register.html")));

const auth = require("./middlewares/authMiddleware");
const loggerMiddleware = require("./middlewares/loggerMiddleware");

app.use(auth);            
app.use(loggerMiddleware); 

const adminRoutes = require("./routes/admin");
const lowonganRoutes = require("./routes/lowongan");
const perusahaanRoutes = require("./routes/perusahaan");
const siswaRoutes = require("./routes/siswa");

app.use("/admin", adminRoutes);
app.use("/api/lowongan", lowonganRoutes);
app.use("/api/perusahaan", perusahaanRoutes);
app.use("/api/siswa", siswaRoutes);
app.use("/", perusahaanRoutes);
app.use("/", siswaRoutes);

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.clearCookie("token");
    res.redirect("/login");
});

app.get("/form-daftar", async (req, res) => {
    try {
        const Lowongan = require("./models/lowonganModel");
        const Siswa = require("./models/siswaModel");
        const { id } = req.query;
        const loker = await Lowongan.findById(id).populate("perusahaan");
        if (!loker) return res.status(404).send("Lowongan tidak ditemukan");

        const user = req.user && req.user.role === "siswa"
            ? await Siswa.findById(req.user.id)
            : null;

        res.render("dashboard/siswa/form_daftar", { user, loker, query: req.query });
    } catch (err) {
        res.status(500).send("Gagal memuat form");
    }
});

app.use((req, res) => {
    res.status(404).render("404", { user: req.user || null });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
