const { Membership } = require('../models/index');

// Get All Active Memberships (Public)
exports.getAllMemberships = async (req, res) => {
    try {
        const memberships = await Membership.find({ active: true })
            .sort({ isMostPopular: -1, createdAt: -1 })
            .select('-__v');

        res.status(200).json({
            success: true,
            count: memberships.length,
            memberships
        });
    } catch (error) {
        console.error('Error fetching memberships:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching memberships'
        });
    }
};

// Get Single Membership (Public)
exports.getMembership = async (req, res) => {
    try {
        const membership = await Membership.findById(req.params.id);

        if (!membership) {
            return res.status(404).json({
                success: false,
                message: 'Membership not found'
            });
        }

        res.status(200).json({
            success: true,
            membership
        });
    } catch (error) {
        console.error('Error fetching membership:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching membership'
        });
    }
};

// Create Membership (Admin Only)
exports.createMembership = async (req, res) => {
    try {
        const {
            packageName,
            originalPrice,
            offeredPrice,
            offerEndsAt,
            description,
            features,
            duration,
            classTime,
            isMostPopular
        } = req.body;

        // Validation
        if (!packageName || !originalPrice || !offeredPrice || !offerEndsAt || !duration) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Validate features array or description (one is required)
        if (!features && !description) {
            return res.status(400).json({
                success: false,
                message: 'Please provide either features array or description'
            });
        }

        // Validate features array if provided
        if (features) {
            if (!Array.isArray(features)) {
                return res.status(400).json({
                    success: false,
                    message: 'Features must be an array'
                });
            }

            if (features.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one feature is required'
                });
            }

            if (features.length > 20) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum 20 features allowed'
                });
            }

            // Validate each feature length
            const invalidFeature = features.find(f => !f || f.trim().length === 0 || f.length > 100);
            if (invalidFeature !== undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Each feature must be between 1 and 100 characters'
                });
            }
        }

        // Validate duration
        if (!duration.startDate || !duration.endDate) {
            return res.status(400).json({
                success: false,
                message: 'Duration must include start and end date'
            });
        }

        // Validate prices
        if (originalPrice <= 0 || offeredPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Prices must be greater than 0'
            });
        }

        if (offeredPrice >= originalPrice) {
            return res.status(400).json({
                success: false,
                message: 'Offered price must be less than original price'
            });
        }

        // Check for duplicate package name
        const existingMembership = await Membership.findOne({ 
            packageName: { $regex: new RegExp(`^${packageName}$`, 'i') }
        });

        if (existingMembership) {
            return res.status(400).json({
                success: false,
                message: 'A membership with this package name already exists'
            });
        }

        // If marking as most popular, unmark all others
        if (isMostPopular) {
            await Membership.updateMany(
                { isMostPopular: true },
                { $set: { isMostPopular: false } }
            );
        }

        // Create membership
        const membership = new Membership({
            packageName,
            originalPrice,
            offeredPrice,
            offerEndsAt,
            description: description || null,
            features: features || null,
            duration: {
                startDate: duration.startDate,
                endDate: duration.endDate
            },
            classTime: classTime || null,
            isMostPopular: isMostPopular || false,
            createdBy: req.user.id
        });

        await membership.save();

        res.status(201).json({
            success: true,
            message: 'Membership created successfully',
            membership
        });
    } catch (error) {
        console.error('Error creating membership:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating membership'
        });
    }
};

// Update Membership (Admin Only)
exports.updateMembership = async (req, res) => {
    try {
        const {
            packageName,
            originalPrice,
            offeredPrice,
            offerEndsAt,
            description,
            features,
            duration,
            classTime,
            isMostPopular,
            active
        } = req.body;

        const membership = await Membership.findById(req.params.id);

        if (!membership) {
            return res.status(404).json({
                success: false,
                message: 'Membership not found'
            });
        }

        // Validate features array if provided
        if (features) {
            if (!Array.isArray(features)) {
                return res.status(400).json({
                    success: false,
                    message: 'Features must be an array'
                });
            }

            if (features.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one feature is required'
                });
            }

            if (features.length > 20) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum 20 features allowed'
                });
            }

            // Validate each feature length
            const invalidFeature = features.find(f => !f || f.trim().length === 0 || f.length > 100);
            if (invalidFeature !== undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Each feature must be between 1 and 100 characters'
                });
            }
        }

        // Check for duplicate package name (if changing name)
        if (packageName && packageName !== membership.packageName) {
            const existingMembership = await Membership.findOne({ 
                packageName: { $regex: new RegExp(`^${packageName}$`, 'i') },
                _id: { $ne: req.params.id }
            });

            if (existingMembership) {
                return res.status(400).json({
                    success: false,
                    message: 'A membership with this package name already exists'
                });
            }
        }

        // Validate prices if provided
        if (originalPrice !== undefined && originalPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Original price must be greater than 0'
            });
        }

        if (offeredPrice !== undefined && offeredPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Offered price must be greater than 0'
            });
        }

        const finalOriginalPrice = originalPrice !== undefined ? originalPrice : membership.originalPrice;
        const finalOfferedPrice = offeredPrice !== undefined ? offeredPrice : membership.offeredPrice;

        if (finalOfferedPrice >= finalOriginalPrice) {
            return res.status(400).json({
                success: false,
                message: 'Offered price must be less than original price'
            });
        }

        // If marking as most popular, unmark all others
        if (isMostPopular && !membership.isMostPopular) {
            await Membership.updateMany(
                { isMostPopular: true, _id: { $ne: req.params.id } },
                { $set: { isMostPopular: false } }
            );
        }

        // Update fields
        if (packageName) membership.packageName = packageName;
        if (originalPrice !== undefined) membership.originalPrice = originalPrice;
        if (offeredPrice !== undefined) membership.offeredPrice = offeredPrice;
        if (offerEndsAt) membership.offerEndsAt = offerEndsAt;
        if (description !== undefined) membership.description = description;
        if (features !== undefined) membership.features = features;
        if (duration) {
            if (duration.startDate) membership.duration.startDate = duration.startDate;
            if (duration.endDate) membership.duration.endDate = duration.endDate;
        }
        if (classTime !== undefined) membership.classTime = classTime;
        if (isMostPopular !== undefined) membership.isMostPopular = isMostPopular;
        if (active !== undefined) membership.active = active;

        await membership.save();

        res.status(200).json({
            success: true,
            message: 'Membership updated successfully',
            membership
        });
    } catch (error) {
        console.error('Error updating membership:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating membership'
        });
    }
};

// Toggle Most Popular (Admin Only)
exports.toggleMostPopular = async (req, res) => {
    try {
        const membership = await Membership.findById(req.params.id);

        if (!membership) {
            return res.status(404).json({
                success: false,
                message: 'Membership not found'
            });
        }

        // If setting as most popular, unmark all others
        if (!membership.isMostPopular) {
            await Membership.updateMany(
                { isMostPopular: true },
                { $set: { isMostPopular: false } }
            );
            membership.isMostPopular = true;
        } else {
            membership.isMostPopular = false;
        }

        await membership.save();

        res.status(200).json({
            success: true,
            message: `Membership ${membership.isMostPopular ? 'marked' : 'unmarked'} as most popular`,
            membership
        });
    } catch (error) {
        console.error('Error toggling most popular:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating membership'
        });
    }
};

// Delete Membership (Admin Only)
exports.deleteMembership = async (req, res) => {
    try {
        const membership = await Membership.findById(req.params.id);

        if (!membership) {
            return res.status(404).json({
                success: false,
                message: 'Membership not found'
            });
        }

        await membership.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Membership deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting membership:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting membership'
        });
    }
};

// Get All Memberships for Admin (Including inactive)
exports.getAllMembershipsAdmin = async (req, res) => {
    try {
        const memberships = await Membership.find()
            .sort({ isMostPopular: -1, createdAt: -1 })
            .populate('createdBy', 'name email')
            .select('-__v');

        res.status(200).json({
            success: true,
            count: memberships.length,
            memberships
        });
    } catch (error) {
        console.error('Error fetching memberships:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching memberships'
        });
    }
};
