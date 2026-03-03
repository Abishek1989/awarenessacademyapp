const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const authorize = require('../middleware/auth');

// Public Routes
router.get('/all', membershipController.getAllMemberships);
router.get('/:id', membershipController.getMembership);

// Admin Routes
router.post('/create', 
    authorize(['Admin']), 
    membershipController.createMembership
);

router.get('/admin/all', 
    authorize(['Admin']), 
    membershipController.getAllMembershipsAdmin
);

router.put('/update/:id', 
    authorize(['Admin']), 
    membershipController.updateMembership
);

router.put('/toggle-popular/:id', 
    authorize(['Admin']), 
    membershipController.toggleMostPopular
);

router.delete('/delete/:id', 
    authorize(['Admin']), 
    membershipController.deleteMembership
);

module.exports = router;
