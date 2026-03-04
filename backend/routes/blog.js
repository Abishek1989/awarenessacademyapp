const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const authorize = require('../middleware/auth');

// Public routes
router.get('/', blogController.getBlogs);
router.get('/:id', blogController.getBlog);

// Admin routes
router.use(authorize(['Admin']));
router.post('/', blogController.createBlog);
router.put('/:id', blogController.updateBlog);
router.delete('/:id', blogController.deleteBlog);

module.exports = router;