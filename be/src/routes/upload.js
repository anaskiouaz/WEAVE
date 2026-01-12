// src/routes/upload.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Fonction pour traiter l'upload sans dépendances externes
function processFileUpload(req, res, next) {
  if (req.method !== 'POST' || !req.headers['content-type']?.includes('multipart/form-data')) {
    return next();
  }

  let body = [];
  req.on('data', chunk => {
    body.push(chunk);
  });

  req.on('end', () => {
    try {
      console.log('Upload: processing multipart');
      const boundary = req.headers['content-type'].split('boundary=')[1];
      console.log('Boundary:', boundary);
      if (!boundary) {
        req.fileError = 'Boundary manquant';
        return next();
      }

      const boundaryBuffer = Buffer.from('--' + boundary + '\r\n');
      const endBoundaryBuffer = Buffer.from('--' + boundary + '--\r\n');
      const fullBody = Buffer.concat(body);
      console.log('Full body length:', fullBody.length);

      // Trouver les parties
      const parts = [];
      let start = 0;

      while (true) {
        const boundaryIndex = fullBody.indexOf(boundaryBuffer, start);
        console.log('Boundary index:', boundaryIndex);
        if (boundaryIndex === -1) break;

        const nextBoundaryIndex = fullBody.indexOf(boundaryBuffer, boundaryIndex + boundaryBuffer.length);
        const endBoundaryIndex = fullBody.indexOf(endBoundaryBuffer, boundaryIndex + boundaryBuffer.length);

        let endIndex;
        if (nextBoundaryIndex !== -1 && (endBoundaryIndex === -1 || nextBoundaryIndex < endBoundaryIndex)) {
          endIndex = nextBoundaryIndex;
        } else if (endBoundaryIndex !== -1) {
          endIndex = endBoundaryIndex + endBoundaryBuffer.length;
        } else {
          break;
        }

        const part = fullBody.slice(boundaryIndex + boundaryBuffer.length, endIndex);
        parts.push(part);
        console.log('Part length:', part.length);
        start = endIndex;
      }

      console.log('Number of parts:', parts.length);

      // Traiter chaque partie
      for (const part of parts) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;

        const headers = part.slice(0, headerEnd).toString();
        console.log('Headers:', headers);
        const data = part.slice(headerEnd + 4, part.lastIndexOf('\r\n'));

        if (headers.includes('name="image"') && headers.includes('filename=')) {
          console.log('Found image part');
          // Extraire le nom du fichier
          const filenameMatch = headers.match(/filename="([^"]+)"/);
          const filename = filenameMatch ? filenameMatch[1] : 'unknown.jpg';

          // Extraire le type MIME
          const contentTypeMatch = headers.match(/Content-Type: ([^\r\n]+)/);
          const contentType = contentTypeMatch ? contentTypeMatch[1] : 'image/jpeg';

          // Vérifier que c'est une image
          if (!contentType.startsWith('image/')) {
            req.fileError = 'Seules les images sont autorisées';
            return next();
          }

          // Vérifier la taille (max 5MB)
          if (data.length > 5 * 1024 * 1024) {
            req.fileError = 'Fichier trop volumineux (max 5MB)';
            return next();
          }

          // Générer un nom unique
          const ext = path.extname(filename) || '.jpg';
          const uniqueName = crypto.randomBytes(16).toString('hex') + ext;
          const filePath = path.join(uploadsDir, uniqueName);

          // Sauvegarder le fichier
          try {
            fs.writeFileSync(filePath, data);
            req.uploadedFile = {
              filename: uniqueName,
              originalname: filename,
              size: data.length,
              url: `/uploads/${uniqueName}`
            };
            console.log('File saved:', filePath);
          } catch (error) {
            console.error('Error saving file:', error);
            req.fileError = 'Erreur lors de la sauvegarde du fichier';
          }
          break;
        }
      }
    } catch (error) {
      console.error('Erreur parsing multipart:', error);
      req.fileError = 'Erreur de traitement du fichier';
    }
    next();
  });
}

// Route d'upload d'image
router.post('/image', processFileUpload, (req, res) => {
  try {
    if (req.fileError) {
      return res.status(400).json({
        status: 'error',
        message: req.fileError
      });
    }

    if (!req.uploadedFile) {
      return res.status(400).json({
        status: 'error',
        message: 'Aucun fichier uploadé'
      });
    }

    res.json({
      status: 'ok',
      message: 'Image uploadée avec succès',
      data: req.uploadedFile
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'upload'
    });
  }
});

export default router;