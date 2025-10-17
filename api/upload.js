import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const app = express();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

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
    url: `${req.protocol}://${req.get('host')}/api/i/${id}`
  });
});

app.get('/i/:id', (req, res) => {
  const files = fs.readdirSync(uploadDir);
  const file = files.find(f => path.parse(f).name === req.params.id);
  if (!file) return res.status(404).send('Image non trouvée');
  res.sendFile(path.join(uploadDir, file));
});

// ✅ au lieu de app.listen(), on exporte l’app
export default app;
