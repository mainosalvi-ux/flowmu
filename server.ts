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

  // Ensure and expose uploads directory
  const uploadsDir = path.join(__dirname, 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Multer config for both audio and cover images
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const suffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${suffix}-${file.fieldname}${path.extname(file.originalname)}`);
    }
  });

  const upload = multer({ 
    storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB total
  });

  // Dual purpose upload endpoint
  app.post('/api/upload', upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), (req, res) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files?.audio?.[0]) {
      return res.status(400).json({ error: 'Falta el archivo de audio' });
    }

    const response = {
      audioUrl: `/uploads/${files.audio[0].filename}`,
      coverUrl: files.cover?.[0] ? `/uploads/${files.cover[0].filename}` : null
    };

    console.log("Upload completed:", response);
    res.json(response);
  });

  app.use('/uploads', express.static(uploadsDir));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Local uploads monitored at: ${uploadsDir}`);
  });
}

startServer();
