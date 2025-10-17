import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3000;

// --- Upload setup ---
const uploadDir = process.env.UPLOAD_DIR || path.join('/tmp', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const id = crypto.randomBytes(4).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${id}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Fichier non valide'));
    cb(null, true);
  }
});

app.use(express.static('public'));

app.post('/upload', upload.single('image'), (req, res) => {
  const filename = req.file.filename;
  const id = path.parse(filename).name;
  res.json({
    success: true,
    id,
    url: `${req.protocol}://${req.get('host')}/i/${id}`
  });
});

app.get('/i/:id', (req, res) => {
  const files = fs.readdirSync(uploadDir);
  const file = files.find(f => path.parse(f).name === req.params.id);
  if (!file) return res.status(404).send('Image non trouvée');
  res.sendFile(path.join(uploadDir, file));
});

// --- Ping automatique toutes les 5 minutes ---
const pingSelf = async () => {
  try {
    const url = `${process.env.SELF_URL || `http://localhost:${PORT}`}`;
    const res = await fetch(url); // Node 18+ : fetch est natif
    console.log(`✅ Ping auto à ${new Date().toLocaleTimeString()} - Status: ${res.status}`);
  } catch (err) {
    console.error('❌ Ping auto échoué:', err.message);
  }
};


// Ping toutes les 5 minutes
setInterval(pingSelf, 5 * 60 * 1000);

// Ping immédiat au démarrage
pingSelf();

// --- Start server ---
app.listen(PORT, () => console.log(`Start on http://localhost:${PORT}`));
