/**
 * InnerSpark Database Schemas (Mongoose)
 * Version: 2.0 - Updated March 2026
 * Complete schema reference for all 31 collections
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// 1. Users Collection - Enhanced with verification and extended profile
const userSchema = new Schema({
    studentID: { type: String, unique: true, sparse: true }, // IS-YYYY-XXXX
    role: { type: String, enum: ['Student', 'Staff', 'Admin'], required: true },
    name: { type: String, required: true }, // Enforce Caps in frontend
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    additionalPhone: { type: String }, // Additional contact number
    profilePic: { type: String },
    active: { type: Boolean, default: true },
    isDefaultAdmin: { type: Boolean, default: false }, // Only one admin can be default

    // Verification & Security
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    lastLogin: { type: Date }, // Track last login

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

    enrolledCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    createdAt: { type: Date, default: Date.now }
});

// 2. Courses Collection
const courseSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true }, // Meditation/Motivation/etc.
    price: { type: Number, required: true },
    mentorID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    thumbnail: { type: String },
    status: { type: String, enum: ['Draft', 'Published', 'Inactive'], default: 'Draft' },
    createdAt: { type: Date, default: Date.now }
});

// 3. Schedules Collection
const scheduleSchema = new Schema({
    courseID: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    staffID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    meetingLink: { type: String },
    type: { type: String, enum: ['Live', 'Recorded Release'], required: true }
});

// 4. Attendance Collection
const attendanceSchema = new Schema({
    studentID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseID: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    scheduleID: { type: Schema.Types.ObjectId, ref: 'Schedule', required: true },
    status: { type: String, enum: ['Present', 'Absent'], required: true },
    timestamp: { type: Date, default: Date.now }
});

// 5. Payments Collection - Coupon references removed
const paymentSchema = new Schema({
    transactionID: { type: String, unique: true },
    studentID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseID: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['UPI', 'Card', 'Manual'], required: true },
    status: { type: String, enum: ['Pending', 'Success', 'Failed'], default: 'Pending' },
    date: { type: Date, default: Date.now }
});

// 6. Content Collection
const contentSchema = new Schema({
    courseID: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['Video', 'PDF', 'Note'], required: true },
    fileUrl: { type: String, required: true },
    previewDuration: { type: Number, default: 0 }, // Seconds
    approvalStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    adminRemarks: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// 7. Marketing Analytics / Impressions
const impressionSchema = new Schema({
    courseID: { type: Schema.Types.ObjectId, ref: 'Course' },
    studentID: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['View', 'Click', 'VideoSkip'], default: 'View' },
    metadata: { type: String }, // e.g., "From Search", "Direct"
    timestamp: { type: Date, default: Date.now }
});

// 8. Progress Tracking - Enhanced
const progressSchema = new Schema({
    studentID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseID: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    completedLessons: [{ type: Schema.Types.ObjectId, ref: 'Content' }],
    percentComplete: { type: Number, default: 0 },
    lastAccessed: { type: Date, default: Date.now }
});

// 9. Exams Collection
const examSchema = new Schema({
    courseID: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    questions: [{
        questionText: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctOptionIndex: { type: Number, required: true }
    }],
    passingScore: { type: Number, default: 70 },
    activationThreshold: { type: Number, default: 85 }, // % progress required
    status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' }
});

// 10. Certificates Collection
const certificateSchema = new Schema({
    studentID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseID: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    examScore: { type: Number, required: true },
    issueDate: { type: Date, default: Date.now },
    certificateURL: { type: String },
    uniqueCertID: { type: String, unique: true } // CERT-<courseID>-12345
});

// 11. Exam Attempts Collection
const examAttemptSchema = new Schema({
    studentID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    examID: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    answers: [{
        questionIndex: Number,
        selectedOptionIndex: Number
    }],
    score: { type: Number },
    status: { type: String, enum: ['In Progress', 'Completed', 'Abandoned'], default: 'In Progress' },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    timeSpent: { type: Number }, // in minutes
    passed: { type: Boolean },
    attemptNumber: { type: Number, default: 1 }
});

// 12. Module Feedback Collection
const feedbackSchema = new Schema({
    studentID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    moduleID: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 500 },
    helpful: { type: Boolean },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    createdAt: { type: Date, default: Date.now }
});

// 13. Results Collection
const resultSchema = new Schema({
    studentID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    examID: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    score: { type: Number, required: true },
    status: { type: String, enum: ['Pass', 'Fail'], required: true },
    date: { type: Date, default: Date.now }
});

// 14. Notifications Collection
const notificationSchema = new Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['Course', 'Payment', 'System', 'Reminder'], default: 'System' },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    recipientID: { type: Schema.Types.ObjectId, ref: 'User' },
    recipientRole: { type: String, enum: ['Student', 'Staff', 'Admin', 'All'] },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    actionUrl: { type: String },
    data: { type: Schema.Types.Mixed },
    expiresAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// 15. FAQ Collection
const faqSchema = new Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, enum: ['Technical', 'Spiritual', 'Payment'], required: true },
    adminRemarks: { type: String }
});

// 16. Enrollments Collection - Enhanced
const enrollmentSchema = new Schema({
    studentID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseID: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    enrolledAt: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    status: { type: String, enum: ['Active', 'Expired'], default: 'Active' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completed: { type: Boolean, default: false }
});

// 17. Support Tickets Collection - Enhanced
const ticketReplySchema = new Schema({
    message: { type: String, required: true },
    repliedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    repliedAt: { type: Date, default: Date.now },
    isAdminReply: { type: Boolean, default: false }
});

const ticketSchema = new Schema({
    ticketID: { type: String, unique: true },
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

// 18. Forum/Comments Collection
const forumSchema = new Schema({
    courseID: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    studentID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// 19. Broadcasts Collection
const broadcastSchema = new Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['Announcement', 'Promotion', 'Emergency'], default: 'Announcement' },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

// 20. Banners Collection - Enhanced
const bannerSchema = new Schema({
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    mobileImageUrl: { type: String }, // Optional mobile-optimized image
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

// 21. Blogs Collection
const blogSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, default: 'InnerSpark' },
    thumbnail: { type: String },
    category: { type: String },
    date: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

// 22. Newsletter Subscriptions Collection
const newsletterSchema = new Schema({
    email: { type: String, required: true, unique: true },
    joinedAt: { type: Date, default: Date.now }
});

// 23. Contact Messages Collection
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

// 24. Course Subscribers Collection
const courseSubscriberSchema = new Schema({
    courseID: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    notified: { type: Boolean, default: false },
    notifiedAt: { type: Date }
}, { timestamps: true });

// 25. Gallery Collection
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
    likedBy: [{ type: String }], // Store IP addresses or session IDs
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileSize: { type: Number }, // in bytes
    fileName: { type: String },
    displayOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
}, { timestamps: true });

// 26. Membership Packages Collection
const membershipSchema = new Schema({
    packageName: { type: String, required: true },
    originalPrice: { type: Number, required: true },
    offeredPrice: { type: Number, required: true },
    offerEndsAt: { type: Date, required: true },
    description: { type: String },
    features: [{
        type: String,
        maxlength: 100
    }],
    duration: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }
    },
    classTime: { type: String },
    mentors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isMostPopular: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = {
    User: mongoose.model('User', userSchema),
    Course: mongoose.model('Course', courseSchema),
    Schedule: mongoose.model('Schedule', scheduleSchema),
    Attendance: mongoose.model('Attendance', attendanceSchema),
    Payment: mongoose.model('Payment', paymentSchema),
    Content: mongoose.model('Content', contentSchema),
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
    Membership: mongoose.model('Membership', membershipSchema)
};
