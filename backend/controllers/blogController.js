const { Blog } = require('../models/index');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Get all blogs (public)
exports.getBlogs = catchAsync(async (req, res, next) => {
    const { page = 1, limit = 10, category } = req.query;

    const query = {};
    if (category) query.category = category;

    const blogs = await Blog.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Blog.countDocuments(query);

    res.status(200).json({
        status: 'success',
        results: blogs.length,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        data: {
            blogs
        }
    });
});

// Get single blog (public)
exports.getBlog = catchAsync(async (req, res, next) => {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
        return next(new AppError('No blog found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            blog
        }
    });
});

// Create new blog (admin only)
exports.createBlog = catchAsync(async (req, res, next) => {
    const { title, content, author, category } = req.body;

    if (!title || !content) {
        return next(new AppError('Title and content are required', 400));
    }

    const blog = await Blog.create({
        title,
        content,
        author: author || 'Awareness Academy',
        category
    });

    res.status(201).json({
        status: 'success',
        data: {
            blog
        }
    });
});

// Update blog (admin only)
exports.updateBlog = catchAsync(async (req, res, next) => {
    const { title, content, author, category } = req.body;

    const blog = await Blog.findByIdAndUpdate(
        req.params.id,
        { title, content, author, category },
        {
            new: true,
            runValidators: true
        }
    );

    if (!blog) {
        return next(new AppError('No blog found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            blog
        }
    });
});

// Delete blog (admin only)
exports.deleteBlog = catchAsync(async (req, res, next) => {
    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
        return next(new AppError('No blog found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});