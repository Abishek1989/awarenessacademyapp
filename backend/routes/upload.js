const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");
const r2Controller = require("../controllers/r2Controller");
const authorize = require("../middleware/auth");

// Upload route - protected
// POST /api/uploads/content
// Content upload for Quill editor (images/videos)
router.post(
  "/content",
  authorize(["Staff", "Admin"]),
  uploadController.uploadMiddleware,
  uploadController.uploadFile,
);

// Course Thumbnail Upload Route
router.post(
  "/thumbnail",
  authorize(["Staff", "Admin"]),
  uploadController.thumbnailUploadMiddleware,
  r2Controller.uploadThumbnail
);

// Cloudflare R2 Direct Multipart Upload Routes
router.post(
  "/video/init",
  authorize(["Staff", "Admin"]),
  r2Controller.initUpload,
);

router.post(
  "/video/sign",
  authorize(["Staff", "Admin"]),
  r2Controller.signParts,
);

router.post(
  "/video/complete",
  authorize(["Staff", "Admin"]),
  r2Controller.completeUpload,
);

router.post(
  "/video/direct",
  authorize(["Staff", "Admin"]),
  uploadController.videoDirectUploadMiddleware,
  r2Controller.uploadVideoDirect
);

// PDF upload for module content
router.post(
  "/pdf",
  authorize(["Staff", "Admin"]),
  uploadController.pdfUploadMiddleware,
  uploadController.uploadPDF,
);

module.exports = router;
