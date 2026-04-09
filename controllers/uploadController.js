const multer = require("multer");
const path = require("path");
const fs = require("fs");

const dirs = [
  "public/uploads/profile",
  "public/uploads/cv",
  "public/uploads/logos",
];

dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "public/uploads";

    if (file.fieldname === "foto") folder = "public/uploads/profile";
    else if (file.fieldname === "cv") folder = "public/uploads/cv";
    else if (file.fieldname === "logo") folder = "public/uploads/logos";

    cb(null, folder);
  },

  filename: (req, file, cb) => {

    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname).toLowerCase()
    );
  },
});


const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {

    const extName = path.extname(file.originalname).toLowerCase();
    const isImageExt = /jpeg|jpg|png/.test(extName);
    const isPdfDocExt = /pdf|docx/.test(extName);
    
   
    const mimeImage = /image\/(jpeg|jpg|png)/.test(file.mimetype);

    if (file.fieldname === "foto" || file.fieldname === "logo") {
        if (isImageExt && mimeImage) {
            return cb(null, true);
        }
     
        const fieldLabel = file.fieldname.charAt(0).toUpperCase() + file.fieldname.slice(1);
        return cb(new Error(`${fieldLabel} harus format JPG atau PNG`), false);
    }

  
    if (file.fieldname === "cv") {
        if (isPdfDocExt) {
            return cb(null, true);
        }
        return cb(new Error("CV harus format PDF atau DOCX"), false);
    }


    cb(new Error("Field upload tidak dikenal"), false);
  },
});

module.exports = upload;