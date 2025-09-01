const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Serve uploaded files
app.use("/uploads", express.static(uploadDir));

// Serve frontend files
const frontendDir = path.join(__dirname, "../frontend");
app.use(express.static(frontendDir));

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

// Upload endpoint
app.post("/upload", upload.single("pdf"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({
    url: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
  });
});

// List all uploaded PDFs
app.get("/files", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json({ error: "Cannot read uploads" });
    const pdfs = files
      .filter(f => f.endsWith(".pdf"))
      .map(f => `/uploads/${f}`);
    res.json(pdfs);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
