const { S3Client, CreateMultipartUploadCommand, CompleteMultipartUploadCommand, UploadPartCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const DeveloperSettings = require('../models/DeveloperSettings');
const User = require('../models/index').User; // Fallback to get admin email
const emailService = require('../utils/emailService');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    }
});

const getAdminEmail = async () => {
    try {
        const admin = await User.findOne({ role: 'Admin' });
        return admin ? admin.email : process.env.SMTP_USER;
    } catch (e) {
        return process.env.SMTP_USER;
    }
};

const checkClassALimits = async (estimatedOperations) => {
    let settings = await DeveloperSettings.findOne();
    if (!settings) settings = await DeveloperSettings.create({});

    const newCount = settings.r2ClassACount + estimatedOperations;

    if (newCount >= settings.r2ClassAStop) {
        throw new AppError('R2 Write Limit (Class A) Reached. Uploads are temporarily blocked.', 429);
    }

    // Warnings
    const adminEmail = await getAdminEmail();
    if (newCount >= settings.r2ClassAWarning2 && settings.r2ClassACount < settings.r2ClassAWarning2) {
        await emailService.sendAdminR2Warning(adminEmail, 'Class A', newCount, settings.r2ClassAWarning2);
    } else if (newCount >= settings.r2ClassAWarning1 && settings.r2ClassACount < settings.r2ClassAWarning1) {
        await emailService.sendAdminR2Warning(adminEmail, 'Class A', newCount, settings.r2ClassAWarning1);
    }

    settings.r2ClassACount = newCount;
    await settings.save();

    return settings;
};

exports.initUpload = catchAsync(async (req, res, next) => {
    const { filename, contentType, fileSize, chunksCount } = req.body;

    if (!filename || !contentType || !fileSize || !chunksCount) {
        return next(new AppError('Missing required upload parameters.', 400));
    }

    // Ensure valid estimated operations: 1 (Init) + N (Chunks) + 1 (Complete)
    const estimatedOps = chunksCount + 2;
    const settings = await checkClassALimits(estimatedOps);

    if (fileSize > settings.r2MaxVideoSizeBytes) {
        return next(new AppError(`File exceeds maximum size limit of ${Math.round(settings.r2MaxVideoSizeBytes / (1024 * 1024))}MB.`, 400));
    }

    const uniqueKey = `videos/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const command = new CreateMultipartUploadCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: uniqueKey,
        ContentType: contentType,
    });

    const response = await s3Client.send(command);

    res.status(200).json({
        status: 'success',
        uploadId: response.UploadId,
        key: uniqueKey,
        chunkSize: settings.r2ChunkSizeBytes // Send config back to client
    });
});

exports.signParts = catchAsync(async (req, res, next) => {
    const { key, uploadId, parts } = req.body;
    // parts is an array of part numbers: [1, 2, 3, ...]

    if (!key || !uploadId || !parts || !Array.isArray(parts)) {
        return next(new AppError('Missing required parameters for signing.', 400));
    }

    const signedUrls = [];

    for (const partNumber of parts) {
        const command = new UploadPartCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            UploadId: uploadId,
            PartNumber: partNumber,
        });

        // URL expires in 1 hour
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        signedUrls.push({ partNumber, url });
    }

    res.status(200).json({
        status: 'success',
        signedUrls
    });
});

exports.completeUpload = catchAsync(async (req, res, next) => {
    const { key, uploadId, parts } = req.body;
    // parts format: [{ PartNumber: 1, ETag: '"..."' }, ...]

    if (!key || !uploadId || !parts) {
        return next(new AppError('Missing required completion parameters.', 400));
    }

    const command = new CompleteMultipartUploadCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
            Parts: parts
        }
    });

    await s3Client.send(command);

    // Build the final Custom Domain URL
    const fileUrl = `${process.env.R2_CUSTOM_DOMAIN}/${key}`;

    res.status(200).json({
        status: 'success',
        fileUrl
    });
});
