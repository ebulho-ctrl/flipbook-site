const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors({ origin: "*" })); // Allow any frontend
app.use(express.json());

// ===== 1. Ensure uploads folder exists =====
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("✅ Created uploads folder:", uploadDir);
} else {
  console.log("ℹ️ Uploads folder exists:", uploadDir);
}

// ===== 2. Multer setup =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("📂 Saving file to:", uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + path.extname(file.originalname);
    console.log("📄 Received file:", file.originalname, "=> Saved as:", filename);
    cb(null, filename);
  }
});
const upload = multer({ storage });

// ===== 3. Serve uploaded PDFs =====
app.use("/uploads", express.static(uploadDir));

// ===== 4. Serve frontend files =====
const frontendDir = path.join(__dirname, "../frontend");
app.use(express.static(frontendDir));

// ===== 5. Root route =====
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

// ===== 6. Upload endpoint =====
app.post("/upload", upload.single("file"), (req, res) => {
  console.log("➡️ Upload endpoint hit");
  if (!req.file) {
    console.log("❌ No file uploaded");
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  console.log("✅ File uploaded successfully:", fileUrl);
  res.json({ url: fileUrl });
});

// ===== 7. List PDFs =====
app.get("/files", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.log("❌ Cannot read uploads:", err);
      return res.status(500).json({ error: "Cannot read uploads" });
    }

    const pdfs = files.filter(f => f.toLowerCase().endsWith(".pdf"))
                      .map(f => `/uploads/${f}`);
    console.log("📄 PDF list:", pdfs);
    res.json(pdfs);
  });
});

// ===== 8. Start server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
