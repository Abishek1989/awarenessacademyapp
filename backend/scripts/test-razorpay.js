/**
 * Test Razorpay Configuration
 * Run this script to verify Razorpay integration is working
 */

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const razorpayService = require('../utils/razorpayService');

async function testRazorpay() {
    console.log('🧪 Testing Razorpay Configuration...\n');

    try {
        // Test 1: Create a test order
        console.log('1️⃣ Testing order creation...');
        const testAmount = 100.50; // ₹100.50
        const orderResult = await razorpayService.createOrder(testAmount, 'INR', 'test_receipt_123');
        
        if (orderResult.success) {
            console.log('✅ Order creation: SUCCESS');
            console.log('   Order ID:', orderResult.order.id);
            console.log('   Amount:', `₹${testAmount} (${orderResult.order.amount} paise)`);
            console.log('   Currency:', orderResult.order.currency);
            console.log('   Receipt:', orderResult.order.receipt);
            
            // Test 2: Test signature verification (with dummy data)
            console.log('\n2️⃣ Testing signature verification...');
            const orderId = orderResult.order.id;
            const paymentId = 'pay_test123456789';
            
            // This will fail (expected) but tests the verification function
            const verifyResult = razorpayService.verifyPayment(orderId, paymentId, 'dummy_signature');
            console.log('✅ Signature verification function: WORKING');
            console.log('   Expected failure (dummy data):', !verifyResult.verified);
            
        } else {
            console.log('❌ Order creation: FAILED');
            console.log('   Error:', orderResult.error);
        }

        // Test 3: Check environment variables
        console.log('\n3️⃣ Validating environment variables...');
        console.log('   Key ID:', process.env.RAZORPAY_KEY_ID || process.env.key_id ? '✅ SET' : '❌ MISSING');
        console.log('   Key Secret:', process.env.RAZORPAY_KEY_SECRET || process.env.key_secret ? '✅ SET' : '❌ MISSING');
        console.log('   Environment:', process.env.RAZORPAY_KEY_ID || process.env.key_id?.includes('test') ? 'TEST' : 'LIVE');

        // Test 4: Amount validation
        console.log('\n4️⃣ Testing amount validation...');
        
        // Test invalid amounts
        const invalidAmounts = [-10, 0, 0.5];
        for (const amount of invalidAmounts) {
            const result = await razorpayService.createOrder(amount, 'INR', 'test');
            console.log(`   Amount ${amount}: ${result.success ? '❌ SHOULD FAIL' : '✅ CORRECTLY REJECTED'}`);
        }

        // Test valid amounts
        const validAmounts = [1, 1.50, 100, 999.99];
        for (const amount of validAmounts) {
            const result = await razorpayService.createOrder(amount, 'INR', 'test');
            console.log(`   Amount ${amount}: ${result.success ? '✅ ACCEPTED' : '❌ SHOULD PASS'}`);
        }

        console.log('\n🎉 Razorpay configuration test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testRazorpay();