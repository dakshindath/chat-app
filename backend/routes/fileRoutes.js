const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper function to optimize images
const optimizeImage = async (inputPath, outputPath) => {
  try {
    const metadata = await sharp(inputPath).metadata();
    
    if (metadata.size < 100 * 1024 || metadata.format === 'gif') {
      fs.copyFileSync(inputPath, outputPath);
      return outputPath;
    }
    
    if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
      await sharp(inputPath)
        .jpeg({ quality: 80, progressive: true })
        .toFile(outputPath);
    } else if (metadata.format === 'png') {
      await sharp(inputPath)
        .png({ quality: 80, progressive: true })
        .toFile(outputPath);
    } else if (metadata.format === 'webp') {
      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(outputPath);
    } else {
      fs.copyFileSync(inputPath, outputPath);
    }
    
    return outputPath;
  } catch (error) {
    console.error('Image optimization error:', error);
    fs.copyFileSync(inputPath, outputPath);
    return outputPath;
  }
};

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// For smaller files, use memory storage for faster processing
const memoryStorage = multer.memoryStorage();

// File filter to restrict file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/mpeg',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'application/zip'
  ];

  // More permissive check for video files
  if (file.mimetype.startsWith('video/') || allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.log('Rejected file type:', file.mimetype);
    cb(new Error('Invalid file type'), false);
  }
};

// Configure upload limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

// Fast upload for smaller files (less than 5MB)
const fastUpload = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Optimized upload for mid-sized files (5-15MB)
const optimizedUpload = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB max file size
  }
});

// Detect file size and use appropriate upload middleware
const smartUpload = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  
  if (contentLength <= 5 * 1024 * 1024) {
    return fastUpload.single('file')(req, res, next);
  } else if (contentLength <= 15 * 1024 * 1024) {
    return optimizedUpload.single('file')(req, res, next);
  } else {
    return upload.single('file')(req, res, next);
  }
};

// Route to upload a file
router.post('/upload', smartUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    let filePath = '';
    
    if (req.file.buffer) {
      const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(req.file.originalname);
      filePath = path.join(uploadsDir, filename);
      
      fs.writeFileSync(filePath, req.file.buffer);
      req.file.filename = filename;
    }// Optimize image if applicable
    if (req.file.mimetype.startsWith('image/')) {
      const optimizedPath = path.join(uploadsDir, `optimized-${req.file.filename}`);
      await optimizeImage(filePath, optimizedPath);
      filePath = optimizedPath;
    }
    
    // Determine file type
    let attachmentType = 'file';
    if (req.file.mimetype.startsWith('image/')) {
      attachmentType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      attachmentType = 'video';
    }
    
    // Return file information
    res.status(200).json({
      success: true,
      file: {
        attachmentType,
        attachmentUrl: `/uploads/${req.file.filename}`,
        attachmentName: req.file.originalname,
        attachmentSize: req.file.size
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ success: false, message: 'File upload failed: ' + error.message });
  }
});

// Route to get a file
router.get('/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params.filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    console.error('File not found:', filePath);
    res.status(404).json({ success: false, message: 'File not found' });
  }
});

// Route to handle chunked file uploads
router.post('/upload-chunked', (req, res) => {
  const { chunk, totalChunks, fileName, chunkIndex } = req.body;
  const tempDir = path.join(uploadsDir, 'temp');
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const tempFilePath = path.join(tempDir, `${fileName}.part${chunkIndex}`);
  const fileId = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(fileName)}`;
  
  try {
    const chunkBuffer = Buffer.from(chunk, 'base64');
    fs.writeFileSync(tempFilePath, chunkBuffer);
      if (parseInt(chunkIndex) === parseInt(totalChunks) - 1) {
      const finalFilePath = path.join(uploadsDir, fileId);
      const writeStream = fs.createWriteStream(finalFilePath);
      
      for (let i = 0; i < parseInt(totalChunks); i++) {
        const chunkPath = path.join(tempDir, `${fileName}.part${i}`);
        if (fs.existsSync(chunkPath)) {
          const chunkData = fs.readFileSync(chunkPath);
          writeStream.write(chunkData);
          fs.unlinkSync(chunkPath);
        }
      }
        writeStream.end();
      
      let attachmentType = 'file';
      const mimeType = req.body.mimeType || '';
      
      if (mimeType.startsWith('image/')) {
        attachmentType = 'image';
      } else if (mimeType.startsWith('video/')) {
        attachmentType = 'video';
      }
      
      // Return file info for the combined file
      return res.status(200).json({
        success: true,
        file: {
          attachmentType,
          attachmentUrl: `/uploads/${fileId}`,
          attachmentName: fileName,
          attachmentSize: req.body.totalSize || 0
        }
      });
    } else {
      // Return success for this chunk
      return res.status(200).json({
        success: true,
        message: `Chunk ${chunkIndex} received`,
        received: parseInt(chunkIndex) + 1,
        total: parseInt(totalChunks)
      });
    }
  } catch (error) {
    console.error('Chunk upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Chunk upload failed: ' + error.message
    });
  }
});

// Route for streaming uploads (more efficient for very large files)
router.post('/stream-upload', (req, res) => {
  const { fileName, fileType, fileSize } = req.query;
  
  if (!fileName) {
    return res.status(400).json({ success: false, message: 'File name is required' });
  }
  
  const fileId = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(fileName)}`;
  const filePath = path.join(uploadsDir, fileId);
  const writeStream = fs.createWriteStream(filePath);
  
  console.log(`Starting streaming upload for file: ${fileName}, size: ${fileSize ? (parseInt(fileSize) / (1024 * 1024)).toFixed(2) + 'MB' : 'unknown'}`);
  
  let uploadedBytes = 0;
    // Handle errors
  req.on('error', (err) => {
    console.error('Stream upload error:', err);
    writeStream.end();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return res.status(500).json({ success: false, message: 'Upload failed: ' + err.message });
  });
    // Stream the request body directly to disk
  req.pipe(writeStream);
  
  // Track progress for very large files
  req.on('data', (chunk) => {
    uploadedBytes += chunk.length;
    if (fileSize && uploadedBytes % (5 * 1024 * 1024) === 0) {
      console.log(`Upload progress: ${(uploadedBytes / parseInt(fileSize) * 100).toFixed(1)}%`);
    }
  });
    writeStream.on('finish', () => {
    let attachmentType = 'file';
    const mimeType = fileType || '';
    
    if (mimeType.startsWith('image/')) {
      attachmentType = 'image';
    } else if (mimeType.startsWith('video/')) {
      attachmentType = 'video';
    }
    
    return res.status(200).json({
      success: true,
      file: {
        attachmentType,
        attachmentUrl: `/uploads/${fileId}`,
        attachmentName: fileName,
        attachmentSize: fs.statSync(filePath).size
      }
    });
  });
    writeStream.on('error', (err) => {
    console.error('Write stream error:', err);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return res.status(500).json({ success: false, message: 'File write failed: ' + err.message });
  });
});

module.exports = router;
