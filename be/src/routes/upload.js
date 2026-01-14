// src/routes/upload.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Azure Storage configuration
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'images';
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

let blobServiceClient;
let sharedKeyCredential;

if (connectionString) {
  blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  // Extract account name and key from connection string for SAS generation
  const connStrParts = connectionString.split(';');
  const accountNamePart = connStrParts.find(part => part.startsWith('AccountName='));
  const accountKeyPart = connStrParts.find(part => part.startsWith('AccountKey='));
  if (accountNamePart && accountKeyPart) {
    const extractedAccountName = accountNamePart.split('=')[1];
    const extractedAccountKey = accountKeyPart.split('=')[1];
    sharedKeyCredential = new StorageSharedKeyCredential(extractedAccountName, extractedAccountKey);
  }
} else if (accountName && accountKey) {
  sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, sharedKeyCredential);
} else {
  console.warn('Azure Storage credentials not set, uploads will fail');
}

// Function to generate SAS token for blob access
function generateBlobSASUrl(containerName, blobName) {
  if (!sharedKeyCredential) {
    throw new Error('Storage credentials not available for SAS generation');
  }

  const sasOptions = {
    containerName,
    blobName,
    permissions: BlobSASPermissions.parse('r'), // Read permission
    startsOn: new Date(),
    expiresOn: new Date(new Date().valueOf() + 24 * 60 * 60 * 1000), // 24 hours
  };

  const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
  return `https://${sharedKeyCredential.accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
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

  req.on('end', async () => {
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

          if (!blobServiceClient) {
            req.fileError = 'Azure Storage not configured';
            return next();
          }

          try {
            // Upload to Azure Blob Storage (private)
            const containerClient = blobServiceClient.getContainerClient(containerName);
            
            // Ensure container exists
            await containerClient.createIfNotExists({
              access: 'blob' // Private access
            });

            const blockBlobClient = containerClient.getBlockBlobClient(uniqueName);

            await blockBlobClient.upload(data, data.length, {
              blobHTTPHeaders: {
                blobContentType: contentType,
              },
              // Remove public access - blob will be private
            });

            req.uploadedFile = {
              filename: uniqueName,
              originalname: filename,
              size: data.length,
              blobName: uniqueName // Store blob name instead of URL
            };
            console.log('File uploaded to Azure:', uniqueName);
          } catch (error) {
            console.error('Error uploading to Azure:', error);
            req.fileError = 'Erreur lors de l\'upload vers Azure';
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

<<<<<<< HEAD
export default router;

=======
>>>>>>> bf15c7f9a9b78643414660ce3683ccfbae528691
// --- Azure Blob proxy to serve images via API (avoids browser CORS) ---
// Note: This route relies on configured Azure credentials and the container name.
// It streams the blob content with the original content type.
router.get('/blob/:blobName', async (req, res) => {
  try {
    const { blobName } = req.params;
    if (!blobServiceClient) {
      return res.status(500).json({ status: 'error', message: 'Azure Storage not configured' });
    }

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Check existence and get properties
    const props = await blockBlobClient.getProperties();
    const contentType = props.contentType || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    const downloadResponse = await blockBlobClient.download(0);
    const stream = downloadResponse.readableStreamBody;
    if (!stream) {
      return res.status(404).json({ status: 'error', message: 'Blob stream not available' });
    }
    stream.pipe(res);
  } catch (error) {
    console.error('Erreur proxy blob:', error);
    res.status(404).json({ status: 'error', message: 'Blob introuvable' });
  }
<<<<<<< HEAD
});
=======
});


export default router;
>>>>>>> bf15c7f9a9b78643414660ce3683ccfbae528691
