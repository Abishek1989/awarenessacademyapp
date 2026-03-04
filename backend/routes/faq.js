const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');
const authorize = require('../middleware/auth');

// Public routes
router.get('/', faqController.getFAQs);
router.get('/:id', faqController.getFAQ);

// Admin routes
router.use(authorize(['Admin']));
router.post('/', faqController.createFAQ);
router.put('/:id', faqController.updateFAQ);
router.delete('/:id', faqController.deleteFAQ);

module.exports = router;