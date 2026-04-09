const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { role } = require("../middleware/roleMiddleware");
const lamaranController = require("../proses/lamaran/lamaranController");

router.post("/kirim", protect, role("siswa"), lamaranController.kirimLamaran);

module.exports = router;
