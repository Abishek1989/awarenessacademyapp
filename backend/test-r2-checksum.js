require('dotenv').config();
const { S3Client, UploadPartCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED"
});

async function testSign() {
    console.log("Generating URL...");
    const command = new UploadPartCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: "videos/test",
        UploadId: "fake-upload-id",
        PartNumber: 1,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    console.log("SIGNED URL:", url);
    console.log("Contains CRC32?", url.includes('x-amz-checksum-crc32'));
}

testSign().catch(console.error);
