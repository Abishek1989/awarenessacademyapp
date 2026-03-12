const { Gallery, User } = require('../models/index');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs').promises;
const crypto = require('crypto');

const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED'
});

function sanitizeFileName(name = '') {
    return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

function normalizePublicBaseUrl(url = '') {
    const trimmed = String(url || '').trim().replace(/\/+$/, '');
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
}

function getR2KeyFromUrl(url = '') {
    const customDomain = normalizePublicBaseUrl(process.env.R2_CUSTOM_DOMAIN || '');
    const targetUrl = String(url || '').trim();

    if (!customDomain || !targetUrl) return null;

    if (targetUrl.startsWith(customDomain + '/')) {
        return targetUrl.slice(customDomain.length + 1);
    }

    try {
        const custom = new URL(customDomain);
        const parsed = new URL(/^https?:\/\//i.test(targetUrl) ? targetUrl : `https://${targetUrl}`);

        if (parsed.hostname === custom.hostname) {
            return parsed.pathname.replace(/^\/+/, '');
        }
    } catch (_) {
        return null;
    }

    return null;
}

// Upload Gallery Image (Admin Only)
exports.uploadGalleryImage = async (req, res) => {
    try {
        const { description } = req.body;

        // Validate description
        if (!description || description.length < 10 || description.length > 100) {
            return res.status(400).json({ 
                message: 'Description must be between 10 and 100 characters' 
            });
        }

        // Check if file exists
        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded' });
        }

        if (!process.env.R2_BUCKET_NAME || !process.env.R2_CUSTOM_DOMAIN || !process.env.R2_ENDPOINT) {
            return res.status(500).json({ message: 'R2 storage is not configured correctly' });
        }

        const contentHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
        const dedupeWindowMs = Number(process.env.GALLERY_UPLOAD_DEDUPE_WINDOW_MS || 120000);
        const dedupeSince = new Date(Date.now() - dedupeWindowMs);

        const duplicateImage = await Gallery.findOne({
            uploadedBy: req.user.id,
            contentHash,
            createdAt: { $gte: dedupeSince }
        }).populate('uploadedBy', 'name email');

        if (duplicateImage) {
            return res.status(200).json({
                message: 'This image was already uploaded recently',
                image: duplicateImage,
                duplicate: true
            });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({ 
                message: 'Only JPEG, JPG, and PNG images are allowed' 
            });
        }

        // Validate file size (10KB - 500KB)
        const fileSize = req.file.size;
        const minSize = 10 * 1024; // 10KB
        const maxSize = 500 * 1024; // 500KB

        if (fileSize < minSize || fileSize > maxSize) {
            return res.status(400).json({ 
                message: `Image size must be between 10KB and 500KB. Your image is ${(fileSize / 1024).toFixed(2)}KB` 
            });
        }

        const extension = req.file.originalname && req.file.originalname.includes('.')
            ? req.file.originalname.slice(req.file.originalname.lastIndexOf('.')).toLowerCase()
            : '.jpg';
        const uniqueKey = `gallery/${Date.now()}-${sanitizeFileName(req.file.originalname || 'image' + extension)}`;

        const uploadCommand = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: uniqueKey,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        });

        await s3Client.send(uploadCommand);
        const imageUrl = `${normalizePublicBaseUrl(process.env.R2_CUSTOM_DOMAIN)}/${uniqueKey}`;

        // Get max displayOrder and increment
        const maxOrderImage = await Gallery.findOne().sort({ displayOrder: -1 }).select('displayOrder');
        const nextOrder = maxOrderImage ? (maxOrderImage.displayOrder || 0) + 1 : 1;

        // Create gallery entry
        const galleryImage = new Gallery({
            imageUrl,
            description: description.trim(),
            uploadedBy: req.user.id,
            fileSize: fileSize,
            fileName: uniqueKey,
            contentHash,
            displayOrder: nextOrder
        });

        await galleryImage.save();

        // Populate uploader info
        await galleryImage.populate('uploadedBy', 'name email');

        res.status(201).json({
            message: 'Gallery image uploaded successfully',
            image: galleryImage
        });

    } catch (err) {
        res.status(500).json({ 
            message: 'Failed to upload gallery image', 
            error: err.message 
        });
    }
};

// Get All Gallery Images (Public)
exports.getAllGalleryImages = async (req, res) => {
    try {
        const { page = 1, limit = 20, active = true } = req.query;

        const query = { active: active === 'true' };

        const images = await Gallery.find(query)
            .populate('uploadedBy', 'name')
            .sort({ displayOrder: 1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Gallery.countDocuments(query);

        res.status(200).json({
            images,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (err) {
        res.status(500).json({ 
            message: 'Failed to fetch gallery images', 
            error: err.message 
        });
    }
};

// Get Gallery Statistics (Admin Only)
exports.getGalleryStats = async (req, res) => {
    try {
        const totalImages = await Gallery.countDocuments({ active: true });
        const totalLikes = await Gallery.aggregate([
            { $match: { active: true } },
            { $group: { _id: null, totalLikes: { $sum: '$likes' } } }
        ]);

        const mostLiked = await Gallery.findOne({ active: true })
            .sort({ likes: -1 })
            .populate('uploadedBy', 'name');

        const recentUploads = await Gallery.find({ active: true })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('uploadedBy', 'name');

        res.status(200).json({
            totalImages,
            totalLikes: totalLikes.length > 0 ? totalLikes[0].totalLikes : 0,
            mostLiked,
            recentUploads
        });

    } catch (err) {
        res.status(500).json({ 
            message: 'Failed to fetch gallery statistics', 
            error: err.message 
        });
    }
};

// Like/Unlike Image (Public)
exports.toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const { identifier } = req.body; // IP address or session ID from frontend

        if (!identifier) {
            return res.status(400).json({ message: 'Identifier required' });
        }

        const image = await Gallery.findById(id);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        const hasLiked = image.likedBy.includes(identifier);

        if (hasLiked) {
            // Unlike
            image.likedBy = image.likedBy.filter(id => id !== identifier);
            image.likes = Math.max(0, image.likes - 1);
        } else {
            // Like
            image.likedBy.push(identifier);
            image.likes += 1;
        }

        await image.save();

        res.status(200).json({
            message: hasLiked ? 'Image unliked' : 'Image liked',
            liked: !hasLiked,
            likes: image.likes
        });

    } catch (err) {
        res.status(500).json({ 
            message: 'Failed to toggle like', 
            error: err.message 
        });
    }
};

// Update Image Description (Admin Only)
exports.updateImageDescription = async (req, res) => {
    try {
        const { id } = req.params;
        const { description } = req.body;

        if (!description || description.length < 10 || description.length > 100) {
            return res.status(400).json({ 
                message: 'Description must be between 10 and 100 characters' 
            });
        }

        const image = await Gallery.findByIdAndUpdate(
            id,
            { description: description.trim() },
            { new: true }
        ).populate('uploadedBy', 'name email');

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        res.status(200).json({
            message: 'Description updated successfully',
            image
        });

    } catch (err) {
        res.status(500).json({ 
            message: 'Failed to update description', 
            error: err.message 
        });
    }
};

// Delete Gallery Image (Admin Only)
exports.deleteGalleryImage = async (req, res) => {
    try {
        const { id } = req.params;

        const image = await Gallery.findById(id);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        const r2Key = getR2KeyFromUrl(image.imageUrl);

        if (r2Key) {
            try {
                const deleteCommand = new DeleteObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: r2Key
                });
                await s3Client.send(deleteCommand);
            } catch (fileErr) {
                console.error('Error deleting R2 file:', fileErr);
            }
        } else if (image.imageUrl && !image.imageUrl.startsWith('http')) {
            // Backward compatibility for legacy local-file records
            try {
                await fs.unlink(image.imageUrl);
            } catch (fileErr) {
                console.error('Error deleting local file:', fileErr);
            }
        }

        // Delete from database
        await Gallery.findByIdAndDelete(id);

        res.status(200).json({
            message: 'Gallery image deleted successfully'
        });

    } catch (err) {
        res.status(500).json({ 
            message: 'Failed to delete gallery image', 
            error: err.message 
        });
    }
};

// Soft Delete (Set inactive) (Admin Only)
exports.deactivateGalleryImage = async (req, res) => {
    try {
        const { id } = req.params;

        const image = await Gallery.findByIdAndUpdate(
            id,
            { active: false },
            { new: true }
        );

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        res.status(200).json({
            message: 'Gallery image deactivated successfully',
            image
        });

    } catch (err) {
        res.status(500).json({ 
            message: 'Failed to deactivate gallery image', 
            error: err.message 
        });
    }
};

// Reactivate Image (Admin Only)
exports.reactivateGalleryImage = async (req, res) => {
    try {
        const { id } = req.params;

        const image = await Gallery.findByIdAndUpdate(
            id,
            { active: true },
            { new: true }
        );

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        res.status(200).json({
            message: 'Gallery image reactivated successfully',
            image
        });

    } catch (err) {
        res.status(500).json({ 
            message: 'Failed to reactivate gallery image', 
            error: err.message 
        });
    }
};

// Get Single Image Details
exports.getImageById = async (req, res) => {
    try {
        const { id } = req.params;

        const image = await Gallery.findById(id)
            .populate('uploadedBy', 'name email profilePic');

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        res.status(200).json({ image });

    } catch (err) {
        res.status(500).json({ 
            message: 'Failed to fetch image details', 
            error: err.message 
        });
    }
};

// Update Display Order (Admin Only)
exports.updateDisplayOrder = async (req, res) => {
    try {
        const { orderedIds } = req.body;

        if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
            return res.status(400).json({ message: 'orderedIds must be a non-empty array' });
        }

        // Update each image's displayOrder
        const updatePromises = orderedIds.map((id, index) => 
            Gallery.findByIdAndUpdate(id, { displayOrder: index + 1 })
        );

        await Promise.all(updatePromises);

        res.status(200).json({
            message: 'Display order updated successfully'
        });

    } catch (err) {
        res.status(500).json({ 
            message: 'Failed to update display order', 
            error: err.message 
        });
    }
};
