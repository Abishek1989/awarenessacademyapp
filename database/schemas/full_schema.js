/**
 * Awareness Academy Database Schemas (Mongoose)
 * Version: 3.1 - Updated March 2026
 * Complete schema reference for all 31 collections
 *
 * Collections:
 *  1. Users               2. Courses             3. Schedules
 *  4. Attendance          5. Payments            6. Content
 *  7. Modules             8. Impressions         9. Progress
 * 10. Exams              11. Certificates       12. ExamAttempts
 * 13. Feedback           14. Results            15. Notifications
 * 16. FAQs               17. Enrollments        18. Tickets
 * 19. Forum              20. Broadcasts         21. Banners
 * 22. Blogs              23. Newsletter         24. ContactMessages
 * 25. CourseSubscribers  26. Gallery            27. Memberships
 * 28. Events             29. Coupons            30. Settings
 * 31. DeveloperSettings
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Users Collection
// ─────────────────────────────────────────────────────────────────────────────
const userSchema = new Schema({
    studentID: { type: String, unique: true, sparse: true }, // IS-YYYY-XXXX
    role: { type: String, enum: ['Student', 'Staff', 'Admin'], required: true },
    name: { type: String, required: true }, // Enforce Caps in frontend
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    additionalPhone: { type: String },
    profilePic: { type: String },
    active: { type: Boolean, default: true },
    isDefaultAdmin: { type: Boolean, default: false },

    // Verification & Security
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    lastLogin: { type: Date },

    // OTP for registration
    registrationOTP: { type: String },
    registrationOTPExpires: { type: Date },
    registrationOTPAttempts: { type: Number, default: 0 },

    // Extended Profile
    initial: { type: String },
    fatherName: { type: String },
    motherName: { type: String },
    dob: { type: Date }, // Frontend calculates age
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    maritalStatus: { type: String, enum: ['Single', 'Married'] },
    spouseName: { type: String },
    spouseContact: { type: String },
    whatsappNumber: { type: String },

    address: {
        doorNumber: { type: String },
        streetName: { type: String },
        town: { type: String },
        district: { type: String },
        pincode: { type: String },
        state: { type: String, default: 'Tamil Nadu' }
    },

    workDetails: {
        type: { type: String, enum: ['Salaried', 'Business', 'Daily Wages', 'Unemployed', 'Student'] },
        name: { type: String }, // Company/Business name
        description: { type: String }
    },

    bankDetails: {
        accountHolderName: { type: String },
        accountNumber: { type: String },
        bankName: { type: String },
        ifscCode: { type: String },
        branchName: { type: String }
    },

    enrolledCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    enrolledMemberships: [{ type: Schema.Types.ObjectId, ref: 'Membership' }],

    // Audit Trail
    lastEditedBy: { type: String, default: 'System' },
    lastEditedAt: { type: Date, default: Date.now },
    auditHistory: [{
        action: { type: String, enum: ['Create', 'Edit', 'Deactivate', 'Activate', 'Delete-Attempt'], required: true },
        performedBy: { type: String, required: true },
        reason: { type: String, required: true }, // Mandatory 100 chars
        timestamp: { type: Date, default: Date.now }
    }],

    createdAt: { type: Date, default: Date.now }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Courses Collection
// ─────────────────────────────────────────────────────────────────────────────
const courseSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true }, // Meditation/Motivation/etc.
    price: { type: Number, required: true }, // In Rupees
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
    duration: { type: String, required: true }, // e.g., "10 Hours"
    mentors: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Multiple, optional for Draft
    thumbnail: { type: String },
    introVideoUrl: { type: String },
    introText: { type: String }, // Rich text description
    previewDuration: { type: Number, default: 60 }, // Seconds
    whatsappGroupLink: { type: String },
    validityType: { type: String, enum: ['Lifetime', 'Limited'], default: 'Lifetime' },
    validityDays: { type: Number, default: 0 }, // Days from enrollment if Limited
    status: {
        type: String,
        enum: ['Draft', 'Pending', 'Approved', 'Published', 'Inactive'],
        default: 'Draft'
        // Draft: Initial creation
        // Pending: Submitted for approval
        // Approved: Approved by Admin (Upcoming)
        // Published: Live (Current)
        // Inactive: Soft deleted / Hidden
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Schedules Collection
// ─────────────────────────────────────────────────────────────────────────────
const scheduleSchema = new Schema({
    courseID: { type: Schema.Types.ObjectId, ref: 'Course' },       // Optional – for course schedules
    membershipID: { type: Schema.Types.ObjectId, ref: 'Membership' }, // Optional – for membership schedules
    staffID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    expectedDuration: { type: Number }, // in minutes
    meetingLink: { type: String },
    type: { type: String, enum: ['Live', 'Recorded Release'], required: true },
    approvalStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
});
// Note: at least one of courseID or membershipID must be provided (validated in app layer)

// ─────────────────────────────────────────────────────────────────────────────
// 4. Attendance Collection
// ─────────────────────────────────────────────────────────────────────────────
const attendanceSchema = new Schema({
    studentID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseID: { type: Schema.Types.ObjectId, ref: 'Course' },       // Optional – for course attendance
    membershipID: { type: Schema.Types.ObjectId, ref: 'Membership' }, // Optional – for membership attendance
    scheduleID: { type: Schema.Types.ObjectId, ref: 'Schedule', required: true },
    status: { type: String, enum: ['Present', 'Absent'], required: true },
    timestamp: { type: Date, default: Date.now }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Payments Collection
// ─────────────────────────────────────────────────────────────────────────────
const paymentSchema = new Schema({
    // Razorpay specific fields
    razorpayOrderId: { type: String, unique: true, sparse: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    razorpaySignature: { type: String },

    // Internal transaction ID
    transactionID: { type: String, unique: true },
    studentID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseID: { type: Schema.Types.ObjectId, ref: 'Course' },       // Optional – for course payments
    membershipID: { type: Schema.Types.ObjectId, ref: 'Membership' }, // Optional – for membership payments

    // Payment details
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    paymentMethod: {
        type: String,
        enum: ['UPI', 'Card', 'NetBanking', 'Wallet', 'Manual'],
        required: true
    },

    // Status tracking with Razorpay-specific statuses
    status: {
        type: String,
        enum: ['initiated', 'pending', 'authorized', 'captured', 'completed', 'failed', 'refunded'],
        default: 'initiated'
    },

    // Timestamps
    initiatedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    date: { type: Date, default: Date.now },

    // Additional tracking
    failureReason: { type: String },
    receiptId: { type: String },
    emailSent: { type: Boolean, default: false },

    // Audit trail
    ipAddress: { type: String },
    userAgent: { type: String }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Content Collection  (legacy upload system, co-exists with Module)
// ─────────────────────────────────────────────────────────────────────────────
const contentSchema = new Schema({
    courseID: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['Video', 'PDF', 'Note'], required: true },
    fileUrl: { type: String, required: true },
    previewDuration: { type: Number, default: 0 }, // Seconds
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    adminRemarks: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Modules Collection  (new modular content system)
//    Source of truth: backend/models/Module.js
// ─────────────────────────────────────────────────────────────────────────────
const moduleSchema = new Schema({
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course ID is required'],
        index: true
    },
    title: {
        type: String,
        required: [true, 'Module title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters'],
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    content: { type: String, default: '' },
    contentType: {
        type: String,
        enum: ['rich-content', 'video', 'pdf'],
        default: 'rich-content',
        required: true
    },
    fileUrl: { type: String }, // Relative path for video/pdf; null for rich-content
    fileMetadata: {
        originalName: String,
        fileSize: Number,   // in bytes
        mimeType: String,
        duration: Number,   // for videos, in seconds (optional)
        uploadedAt: Date
    },
    minDuration: {
        type: Number,
        default: 10, // Required minimum viewing time in minutes (not video duration)
        min: [1, 'Duration must be at least 1 minute']
    },
    order: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Order must be a positive number']
    },
    status: {
        type: String,
        enum: ['Draft', 'Pending', 'Approved', 'Rejected', 'Inactive'],
        default: 'Draft'
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    adminRemarks: { type: String },
    rejectionReason: { type: String }
}, {
    timestamps: true, // createdAt + updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Indexes: { courseId: 1, order: 1 }, { createdBy: 1 }, { contentType: 1 }

// ─────────────────────────────────────────────────────────────────────────────
// 8. Marketing Analytics / Impressions
// ─────────────────────────────────────────────────────────────────────────────
const impressionSchema = new Schema({
    courseID: { type: Schema.Types.ObjectId, ref: 'Course' },
    studentID: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['View', 'Click', 'VideoSkip'], default: 'View' },
    metadata: { type: String }, // e.g., "From Search", "Direct"
    timestamp: { type: Date, default: Date.now }
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Progress Tracking
// ─────────────────────────────────────────────────────────────────────────────
const progressSchema = new Schema({
    studentID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseID: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    completedModules: [{ type: Schema.Types.ObjectId, ref: 'Module' }], // Legacy support

    // Granular per-module progress tracking
    moduleProgress: [{
        moduleID: { type: Schema.Types.ObjectId, ref: 'Module' },
        timeSpent: { type: Number, default: 0 }, // in seconds
        completed: { type: Boolean, default: false },
        lastUpdated: { type: Date, default: Date.now }
    }],

    percentComplete: { type: Number, default: 0 },
    lastAccessed: { type: Date, default: Date.now }
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Exams Collection
// ─────────────────────────────────────────────────────────────────────────────
const examSchema = new Schema({
    courseID: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    duration: { type: Number, default: 30 }, // Duration in minutes
    questions: [{
        questionText: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctOptionIndices: [{ type: Number, required: true }] // Supports multiple correct answers
    }],
    passingScore: { type: Number, default: 70 },
    activationThreshold: { type: Number, default: 85 }, // % progress required to unlock exam
    status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
    approvalStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. Certificates Collection
// ─────────────────────────────────────────────────────────────────────────────
const certificateSchema = new Schema({
    studentID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseID: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    examScore: { type: Number, required: true },
    issueDate: { type: Date, default: Date.now },
    certificateURL: { type: String },
    uniqueCertID: { type: String, unique: true }, // Format: {courseID-4digits}{YY}{studentID-4digits}
    mentorName: { type: String },
    completedAt: { type: Date },
    percentage: { type: Number }
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. Exam Attempts Collection  (tracks randomised questions and timing)
// ─────────────────────────────────────────────────────────────────────────────
const examAttemptSchema = new Schema({
    studentID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    examID: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    courseID: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    questionOrder: [{ type: Number, required: true }], // Indices showing randomised order
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    completed: { type: Boolean, default: false },
    score: { type: Number },
    status: { type: String, enum: ['In Progress', 'Submitted', 'Expired'], default: 'In Progress' },
    answers: [{ type: Number }], // Student answers in the order presented
    timeTaken: { type: Number }  // Seconds taken to complete
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. Module Feedback Collection
// ─────────────────────────────────────────────────────────────────────────────
const feedbackSchema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    moduleId: { type: String, required: true },   // Stored as string – IDs may not always be ObjectId
    moduleName: { type: String },
    courseId: { type: String },                   // Stored as string for same reason
    ratings: {
        videoQuality: { type: Number, min: 0, max: 5, default: 0 },
        contentQuality: { type: Number, min: 0, max: 5, default: 0 },
        contentRelevance: { type: Number, min: 0, max: 5, default: 0 },
        expectations: { type: Number, min: 0, max: 5, default: 0 },
        recommendation: { type: Number, min: 0, max: 5, default: 0 }
    },
    overallRating: { type: Number, min: 0, max: 5, default: 0 },
    comments: { type: String, maxlength: 2000, default: '' }
}, { timestamps: true });
// Index: { moduleId: 1, studentId: 1 }

// ─────────────────────────────────────────────────────────────────────────────
// 14. Results Collection
// ─────────────────────────────────────────────────────────────────────────────
const resultSchema = new Schema({
    studentID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    examID: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    score: { type: Number, required: true },
    status: { type: String, enum: ['Pass', 'Fail'], required: true },
    date: { type: Date, default: Date.now }
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. Staff Notifications Collection
// ─────────────────────────────────────────────────────────────────────────────
const notificationSchema = new Schema({
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['Course', 'Module', 'System'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedId: { type: Schema.Types.ObjectId }, // ID of related Course/Module/etc.
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
// Index: { recipient: 1, read: 1, createdAt: -1 }

// ─────────────────────────────────────────────────────────────────────────────
// 16. FAQ / Chatbot Collection
// ─────────────────────────────────────────────────────────────────────────────
const faqSchema = new Schema({
    question: { type: String, required: true }, // Keywords/Tags
    answer: { type: String, required: true },
    category: {
        type: String,
        enum: ['Technical', 'Spiritual', 'Payment', 'General'],
        required: true,
        default: 'General'
    },
    adminRemarks: { type: String },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
}, { timestamps: true });

// ─────────────────────────────────────────────────────────────────────────────
// 17. Enrollments Collection
// ─────────────────────────────────────────────────────────────────────────────
const enrollmentSchema = new Schema({
    studentID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseID: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    enrolledAt: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    status: { type: String, enum: ['Active', 'Expired', 'Disabled'], default: 'Active' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completed: { type: Boolean, default: false }
});

// ─────────────────────────────────────────────────────────────────────────────
// 18. Support Tickets Collection
// ─────────────────────────────────────────────────────────────────────────────
const ticketReplySchema = new Schema({
    message: { type: String, required: true },
    repliedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    repliedAt: { type: Date, default: Date.now },
    isAdminReply: { type: Boolean, default: false }
});

const ticketSchema = new Schema({
    ticketID: { type: String, unique: true }, // Auto-generated via pre-save hook: TKT-YYYYMM-XXXX
    subject: {
        type: String,
        required: true,
        enum: [
            'Technical Issue', 'Course Access Problem', 'Payment Issue',
            'Account Related', 'Content Quality', 'Certificate Issue',
            'General Inquiry', 'Feature Request', 'Bug Report', 'Other'
        ]
    },
    description: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    replies: [ticketReplySchema],
    lastUpdated: { type: Date, default: Date.now },
    isReadByAdmin: { type: Boolean, default: false },
    isReadByUser: { type: Boolean, default: true }
}, { timestamps: true });
// pre-save hook: auto-generates ticketID as TKT-{YYYYMM}-{0001..}

// ─────────────────────────────────────────────────────────────────────────────
// 19. Forum / Comments Collection
// ─────────────────────────────────────────────────────────────────────────────
const forumSchema = new Schema({
    courseID: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    studentID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// ─────────────────────────────────────────────────────────────────────────────
// 20. Broadcasts Collection
// ─────────────────────────────────────────────────────────────────────────────
const broadcastSchema = new Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['Announcement', 'Promotion', 'Emergency'], default: 'Announcement' },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

// ─────────────────────────────────────────────────────────────────────────────
// 21. Banners Collection
// ─────────────────────────────────────────────────────────────────────────────
const bannerSchema = new Schema({
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    mobileImageUrl: { type: String }, // Optional mobile-optimised image
    link: { type: String },
    active: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    metadata: {
        width: Number,
        height: Number,
        size: Number,
        format: String
    },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
// Index: { active: 1, displayOrder: 1 }

// ─────────────────────────────────────────────────────────────────────────────
// 22. Blogs Collection
// ─────────────────────────────────────────────────────────────────────────────
const blogSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, default: 'Awareness Academy' },
    category: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// ─────────────────────────────────────────────────────────────────────────────
// 23. Newsletter Subscriptions Collection
// ─────────────────────────────────────────────────────────────────────────────
const newsletterSchema = new Schema({
    email: { type: String, required: true, unique: true },
    joinedAt: { type: Date, default: Date.now }
});

// ─────────────────────────────────────────────────────────────────────────────
// 24. Contact Messages Collection
// ─────────────────────────────────────────────────────────────────────────────
const contactMessageSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
        type: String,
        enum: ['New', 'Read', 'Replied', 'Archived'],
        default: 'New'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    source: { type: String, default: 'Website' },
    ipAddress: { type: String },
    userAgent: { type: String },
    adminNotes: { type: String },
    repliedAt: { type: Date },
    repliedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// ─────────────────────────────────────────────────────────────────────────────
// 25. Course Subscribers Collection
// ─────────────────────────────────────────────────────────────────────────────
const courseSubscriberSchema = new Schema({
    courseID: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    notified: { type: Boolean, default: false },
    notifiedAt: { type: Date }
}, { timestamps: true });
// Compound index: { courseID: 1, email: 1 } unique

// ─────────────────────────────────────────────────────────────────────────────
// 26. Gallery Collection
// ─────────────────────────────────────────────────────────────────────────────
const gallerySchema = new Schema({
    imageUrl: { type: String, required: true },
    description: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 100,
        trim: true
    },
    likes: { type: Number, default: 0, min: 0 },
    likedBy: [{ type: String }], // IP addresses or session IDs
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileSize: { type: Number }, // in bytes
    fileName: { type: String },
    displayOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
}, { timestamps: true });
// Index: { active: 1, displayOrder: 1 }

// ─────────────────────────────────────────────────────────────────────────────
// 27. Membership Packages Collection
// ─────────────────────────────────────────────────────────────────────────────
const membershipSchema = new Schema({
    packageName: { type: String, required: true },
    originalPrice: { type: Number, required: true },
    offeredPrice: { type: Number, required: true },
    offerEndsAt: { type: Date, required: true }, // Offer end date and time
    description: { type: String }, // Legacy field – kept for backward compatibility
    features: [{ type: String, maxlength: 100 }], // 1–20 bullet points
    duration: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }
    },
    classTime: { type: String },
    mentors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isMostPopular: { type: Boolean, default: false }, // Only one can be true
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
// Index: { active: 1, isMostPopular: -1 }

// ─────────────────────────────────────────────────────────────────────────────
// 28. Events Collection
// ─────────────────────────────────────────────────────────────────────────────
const eventSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    venue: { type: String },
    type: { type: String, enum: ['Workshop', 'Seminar', 'Retreat', 'Webinar', 'Other'], default: 'Other' },
    imageUrl: { type: String },
    registrationLink: { type: String },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

// ─────────────────────────────────────────────────────────────────────────────
// 29. Coupons Collection
// ─────────────────────────────────────────────────────────────────────────────
const couponSchema = new Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['Percentage', 'Fixed'], required: true },
    discountValue: { type: Number, required: true },
    validUntil: { type: Date, required: true },
    usageLimit: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    courseID: { type: Schema.Types.ObjectId, ref: 'Course' }, // null = applies to all courses
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

// ─────────────────────────────────────────────────────────────────────────────
// 30. Settings Collection  (Singleton document)
//     Source of truth: backend/models/Settings.js
// ─────────────────────────────────────────────────────────────────────────────
const settingsSchema = new Schema({
    isMaintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'System is currently under maintenance. Please check back later.' },
    disableRightClick: { type: Boolean, default: false },
    siteTitle: { type: String, default: 'Awareness Academy' },
    supportEmail: { type: String, default: 'support@awarenessacademy.in' },
    emailNotifications: { type: Boolean, default: true },
    strictVerification: { type: Boolean, default: false },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now }
});

// ─────────────────────────────────────────────────────────────────────────────
// 31. DeveloperSettings Collection  (Singleton document)
//     Source of truth: backend/models/DeveloperSettings.js
// ─────────────────────────────────────────────────────────────────────────────
const developerSettingsSchema = new Schema({
    // Cost Monitoring
    vpsPlan: { type: String, default: 'KVM 2' },
    vpsCost: { type: Number, default: 0 },
    vpsInstances: { type: Number, default: 1 },

    mongoPlan: { type: String, default: 'M0 Sandbox' },
    mongoCost: { type: Number, default: 0 },
    mongoStoragePricePerGb: { type: Number, default: 0.25 },
    mongoDataTransferPricePerGb: { type: Number, default: 0.12 },
    mongoBackupCost: { type: Number, default: 0 },

    razorpayCommissionPercent: { type: Number, default: 2.0 },

    r2StoragePricePerGb: { type: Number, default: 0.015 },
    r2BandwidthPricePerGb: { type: Number, default: 0.09 },

    // R2 Operational Limits & Trackers
    r2MaxVideoSizeBytes: { type: Number, default: 5368709120 }, // Default: 5 GB
    r2ChunkSizeBytes: { type: Number, default: 52428800 },      // Default: 50 MB
    r2ClassACount: { type: Number, default: 0 },
    r2ClassAWarning1: { type: Number, default: 500000 },
    r2ClassAWarning2: { type: Number, default: 750000 },
    r2ClassAStop: { type: Number, default: 900000 },
    r2ClassBCount: { type: Number, default: 0 },
    r2ClassBWarning1: { type: Number, default: 5000000 },
    r2ClassBWarning2: { type: Number, default: 7500000 },
    r2ClassBStop: { type: Number, default: 9000000 },

    // Scaling & Load Control
    autoScaleEnabled: { type: Boolean, default: false },
    maxInstancesAllowed: { type: Number, default: 3 },
    scalingThresholdPercent: { type: Number, default: 80 },

    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now }
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports  (reference only – not used at runtime; runtime models are in
//           backend/models/index.js and backend/models/Module.js)
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
    User: mongoose.model('User', userSchema),
    Course: mongoose.model('Course', courseSchema),
    Schedule: mongoose.model('Schedule', scheduleSchema),
    Attendance: mongoose.model('Attendance', attendanceSchema),
    Payment: mongoose.model('Payment', paymentSchema),
    Content: mongoose.model('Content', contentSchema),
    Module: mongoose.model('Module', moduleSchema),
    Impression: mongoose.model('Impression', impressionSchema),
    Progress: mongoose.model('Progress', progressSchema),
    Exam: mongoose.model('Exam', examSchema),
    Certificate: mongoose.model('Certificate', certificateSchema),
    ExamAttempt: mongoose.model('ExamAttempt', examAttemptSchema),
    Feedback: mongoose.model('Feedback', feedbackSchema),
    Result: mongoose.model('Result', resultSchema),
    Notification: mongoose.model('Notification', notificationSchema),
    FAQ: mongoose.model('FAQ', faqSchema),
    Enrollment: mongoose.model('Enrollment', enrollmentSchema),
    Ticket: mongoose.model('Ticket', ticketSchema),
    Forum: mongoose.model('Forum', forumSchema),
    Broadcast: mongoose.model('Broadcast', broadcastSchema),
    Banner: mongoose.model('Banner', bannerSchema),
    Blog: mongoose.model('Blog', blogSchema),
    Newsletter: mongoose.model('Newsletter', newsletterSchema),
    ContactMessage: mongoose.model('ContactMessage', contactMessageSchema),
    CourseSubscriber: mongoose.model('CourseSubscriber', courseSubscriberSchema),
    Gallery: mongoose.model('Gallery', gallerySchema),
    Membership: mongoose.model('Membership', membershipSchema),
    Event: mongoose.model('Event', eventSchema),
    Coupon: mongoose.model('Coupon', couponSchema),
    Settings: mongoose.model('Settings', settingsSchema),
    DeveloperSettings: mongoose.model('DeveloperSettings', developerSettingsSchema)
};
