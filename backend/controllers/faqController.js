const mongoose = require('mongoose');
const { Schema } = mongoose;
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const { FAQ } = require('../models/index');

// Get all FAQs (public)
exports.getFAQs = catchAsync(async (req, res, next) => {
    const { category, active = true } = req.query;

    const query = {};
    if (category) query.category = category;
    if (active === 'true') query.isActive = true;

    const faqs = await FAQ.find(query).sort({ order: 1, createdAt: 1 });

    // Sort faqs so that manually explicitly ordered items (> 0) come first, and unordered (0) come last
    const orderedFaqs = faqs.filter(f => f.order > 0);
    const unorderedFaqs = faqs.filter(f => !f.order || f.order === 0);
    const finalFaqs = [...orderedFaqs, ...unorderedFaqs];

    res.status(200).json({
        status: 'success',
        results: finalFaqs.length,
        data: {
            faqs: finalFaqs
        }
    });
});

// Get single FAQ (public)
exports.getFAQ = catchAsync(async (req, res, next) => {
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
        return next(new AppError('No FAQ found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            faq
        }
    });
});

// Create new FAQ (admin only)
exports.createFAQ = catchAsync(async (req, res, next) => {
    const { question, answer, category, adminRemarks, isActive, order } = req.body;

    if (!question || !answer) {
        return next(new AppError('Question and answer are required', 400));
    }

    const faq = await FAQ.create({
        question,
        answer,
        category: category || 'General',
        adminRemarks,
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0
    });

    res.status(201).json({
        status: 'success',
        data: {
            faq
        }
    });
});

// Update FAQ (admin only)
exports.updateFAQ = catchAsync(async (req, res, next) => {
    const { question, answer, category, adminRemarks, isActive, order } = req.body;

    const faq = await FAQ.findByIdAndUpdate(
        req.params.id,
        { question, answer, category, adminRemarks, isActive, order },
        {
            new: true,
            runValidators: true
        }
    );

    if (!faq) {
        return next(new AppError('No FAQ found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            faq
        }
    });
});

// Delete FAQ (admin only)
exports.deleteFAQ = catchAsync(async (req, res, next) => {
    const faq = await FAQ.findByIdAndDelete(req.params.id);

    if (!faq) {
        return next(new AppError('No FAQ found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});