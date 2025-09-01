const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors({ origin: "*" })); // allow frontend on Netlify
app.use(express.json());

// ===== 1. Ensure uploads folder exists =====
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ===== 2. Multer setup =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ===== 3. Serve uploaded PDFs =====
app.use("/uploads", express.static(uploadDir));

// ===== 4. Serve frontend files =====
const frontendDir = path.join(__dirname, "../frontend");
app.use(express.static(frontendDir));

// ===== 5. Root route =====
app.get("/", (req, res) => res.sendFile(path.join(frontendDir, "index.html")));

// ===== 6. Upload endpoint =====
app.post("/upload", upload.single("pdf"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ url: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` });
});

// ===== 7. List PDFs =====
app.get("/files", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json({ error: "Cannot read uploads" });
    const pdfs = files.filter(f => f.endsWith(".pdf")).map(f => `/uploads/${f}`);
    res.json(pdfs);
  });
});
const cors = require("cors");
app.use(cors());

// ===== 8. Start server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

