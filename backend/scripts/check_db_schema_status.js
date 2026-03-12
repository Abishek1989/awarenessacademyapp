/**
 * Check Database Schema Status
 * Provides detailed information about collections and their document counts
 * 
 * Usage: node backend/scripts/check_db_schema_status.js
 */

require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const { User } = require('../models/index');

async function checkSchemaStatus() {
    try {
        const mongoURI = process.env.MONGODB_URL || process.env.MONGO_URI;
        
        if (!mongoURI || mongoURI.includes('localhost')) {
            console.error('❌ ERROR: MONGODB_URL not found or pointing to localhost');
            process.exit(1);
        }
        
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Connected to MongoDB\n');

        // Get database info
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        console.log('📊 DATABASE COLLECTIONS STATUS');
        console.log('================================\n');
        console.log(`Total Collections Found: ${collections.length}\n`);

        // Expected collections
        const expectedCollections = [
            'users', 'courses', 'schedules', 'attendance', 'payments', 'contents',
            'modules', 'impressions', 'progresses', 'exams', 'certificates', 'examattempts',
            'feedbacks', 'results', 'notifications', 'faqs', 'enrollments', 'tickets',
            'forums', 'broadcasts', 'banners', 'blogs', 'newsletters', 'contactmessages',
            'coursesubscribers', 'galleries', 'memberships', 'events', 'coupons',
            'settings', 'developersettings'
        ];

        const collectionNames = collections.map(c => c.name.toLowerCase());

        console.log('📝 Collection Details:\n');
        
        let existingCount = 0;
        let missingCollections = [];

        for (const expected of expectedCollections) {
            const exists = collectionNames.includes(expected);
            if (exists) {
                existingCount++;
                const collection = await db.collection(expected);
                const docCount = await collection.countDocuments();
                console.log(`✅ ${expected.padEnd(25)} | Documents: ${docCount}`);
            } else {
                missingCollections.push(expected);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`✅ Existing Collections: ${existingCount}/${expectedCollections.length}`);
        console.log(`❌ Missing Collections: ${missingCollections.length}`);
        
        if (missingCollections.length > 0) {
            console.log('\nMissing Collections:');
            missingCollections.forEach(col => console.log(`  - ${col}`));
            console.log('\n⚠️  Note: Missing collections will be auto-created when first accessed.');
        }

        // Get Users and Admin info
        console.log('\n' + '='.repeat(60));
        console.log('👥 USER STATISTICS\n');
        
        const userCollection = db.collection('users');
        const totalUsers = await userCollection.countDocuments();
        const admins = await userCollection.countDocuments({ role: 'Admin' });
        const staff = await userCollection.countDocuments({ role: 'Staff' });
        const students = await userCollection.countDocuments({ role: 'Student' });

        console.log(`Total Users: ${totalUsers}`);
        console.log(`  - Admins: ${admins}`);
        console.log(`  - Staff: ${staff}`);
        console.log(`  - Students: ${students}`);

        // Check for default admin
        const defaultAdmin = await userCollection.findOne({ isDefaultAdmin: true });
        if (defaultAdmin) {
            console.log(`\n⭐ Default Admin: ${defaultAdmin.name} (${defaultAdmin.email})`);
        }

        // Other useful stats
        console.log('\n' + '='.repeat(60));
        console.log('📈 OTHER STATISTICS\n');

        const courseCollection = db.collection('courses');
        const enrollmentCollection = db.collection('enrollments');
        const paymentCollection = db.collection('payments');

        const courses = await courseCollection.countDocuments();
        const enrollments = await enrollmentCollection.countDocuments();
        const payments = await paymentCollection.countDocuments();

        console.log(`Courses: ${courses}`);
        console.log(`Enrollments: ${enrollments}`);
        console.log(`Payments: ${payments}`);

        console.log('\n' + '='.repeat(60));
        console.log('✅ Schema check complete!\n');

        await mongoose.connection.close();
        process.exit(0);

    } catch (err) {
        console.error('❌ ERROR:', err.message);
        process.exit(1);
    }
}

checkSchemaStatus();
