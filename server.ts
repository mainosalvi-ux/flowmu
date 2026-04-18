import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure Multer for local storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
  const upload = multer({ 
    storage,
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
  });

  // API Route for audio upload
  app.post('/api/upload/audio', upload.single('audio'), (req, res) => {
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: 'No se subió ningún archivo de audio' });
    }
    const fileUrl = `/uploads/${file.filename}`;
    res.json({ url: fileUrl });
  });

  // API Route for cover upload
  app.post('/api/upload/cover', upload.single('cover'), (req, res) => {
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: 'No se subió ninguna imagen' });
    }
    const fileUrl = `/uploads/${file.filename}`;
    res.json({ url: fileUrl });
  });

  // Static serving of uploads
  app.use('/uploads', express.static(uploadsDir));

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Local uploads directory: ${uploadsDir}`);
  });
}

startServer();
