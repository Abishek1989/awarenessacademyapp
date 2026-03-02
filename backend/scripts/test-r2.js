const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { User } = require('../models/index');

async function testR2Upload() {
    console.log('--- Starting R2 Multipart Upload Test ---');
    console.log(`Endpoint: ${process.env.R2_ENDPOINT}`);
    console.log(`Bucket: ${process.env.R2_BUCKET_NAME}`);
    console.log(`Custom Domain: ${process.env.R2_CUSTOM_DOMAIN}`);

    let serverProcess;

    try {
        // 1. Connect to DB to get an admin token
        await mongoose.connect(process.env.MONGODB_URL);
        const admin = await User.findOne({ role: 'Admin' });
        if (!admin) throw new Error('No Admin user found to generate token.');

        const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const authHeaders = { Authorization: `Bearer ${token}` };

        // 2. Create a dummy file (15MB to ensure it creates at least 1 chunk if we override chunk size, but we'll simulate an 8MB chunk test)
        const dummyFileSize = 15 * 1024 * 1024; // 15MB
        const dummyBuffer = Buffer.alloc(dummyFileSize, 'A');
        const filename = 'r2-test-video.mp4';

        console.log(`\n1. Initializing upload for ${filename} (${dummyFileSize / 1024 / 1024}MB)...`);

        // Let's force a smaller chunk size just for this test so we test the stitching logic quickly
        // The controller calculates estimatedOps based on chunksCount
        const testChunkSize = 8 * 1024 * 1024; // 8MB
        const chunksCount = Math.ceil(dummyFileSize / testChunkSize);

        const initRes = await axios.post('http://localhost:5001/api/uploads/video/init', {
            filename: filename,
            contentType: 'video/mp4',
            fileSize: dummyFileSize,
            chunksCount: chunksCount
        }, { headers: authHeaders });

        const { uploadId, key } = initRes.data;
        console.log(`✅ Init successful. UploadId: ${uploadId}`);
        console.log(`Key: ${key}`);

        console.log(`\n2. Requesting signed URLs for ${chunksCount} parts...`);
        const parts = Array.from({ length: chunksCount }, (_, i) => i + 1);

        const signRes = await axios.post('http://localhost:5001/api/uploads/video/sign', {
            key,
            uploadId,
            parts
        }, { headers: authHeaders });

        const signedUrls = signRes.data.signedUrls;
        console.log(`✅ Received ${signedUrls.length} signed URLs.`);

        console.log(`\n3. Uploading chunks directly to R2...`);
        const uploadedParts = [];
        for (let i = 0; i < chunksCount; i++) {
            const start = i * testChunkSize;
            const end = Math.min(start + testChunkSize, dummyFileSize);
            const chunk = dummyBuffer.slice(start, end);
            const partNumber = i + 1;
            const signedUrlObj = signedUrls.find(s => s.partNumber === partNumber);

            console.log(`   Uploading part ${partNumber} (${chunk.length} bytes)...`);
            const uploadRes = await axios.put(signedUrlObj.url, chunk, {
                headers: { 'Content-Type': 'application/octet-stream' } // R2 expects octet-stream for presigned PUT unless exactly specified
            });

            // Axios returns headers in lowercase
            const etag = uploadRes.headers['etag'];
            uploadedParts.push({ PartNumber: partNumber, ETag: etag });
            console.log(`   ✅ Part ${partNumber} uploaded. ETag: ${etag}`);
        }

        console.log(`\n4. Completing multipart upload...`);
        const completeRes = await axios.post('http://localhost:5001/api/uploads/video/complete', {
            key,
            uploadId,
            parts: uploadedParts
        }, { headers: authHeaders });

        console.log(`\n🎉 SUCCESS! File uploaded to: ${completeRes.data.fileUrl}`);

    } catch (error) {
        console.error('\n❌ TEST FAILED');
        if (error.response) {
            console.error('API Error:', error.response.data);
        } else {
            console.error(error.message || error);
        }
    } finally {
        await mongoose.disconnect();
        console.log('--- Test Finished ---');
        process.exit(0);
    }
}

testR2Upload();
