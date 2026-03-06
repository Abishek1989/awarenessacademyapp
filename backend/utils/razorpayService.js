/**
 * Razorpay Service for Awareness Academy
 * Handles payment processing, verification, and order creation
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || process.env.key_id,
    key_secret: process.env.RAZORPAY_KEY_SECRET || process.env.key_secret,
});

// Log Razorpay configuration status
console.log('💳 Razorpay Configuration:');
console.log('   Key ID:', process.env.RAZORPAY_KEY_ID || process.env.key_id ? '✅ Configured' : '❌ NOT SET');
console.log('   Key Secret:', process.env.RAZORPAY_KEY_SECRET || process.env.key_secret ? '✅ Configured' : '❌ NOT SET');
console.log('   Environment:', process.env.RAZORPAY_KEY_ID || process.env.key_id?.includes('test') ? 'TEST' : 'LIVE');

/**
 * Create Razorpay Order
 */
exports.createOrder = async (amount, currency = 'INR', receipt) => {
    try {
        // Validate inputs
        if (!amount || amount <= 0) {
            throw new Error('Invalid amount: Amount must be greater than 0');
        }

        if (currency !== 'INR') {
            throw new Error('Invalid currency: Only INR is supported');
        }

        if (amount < 1) {
            throw new Error('Invalid amount: Minimum amount is ₹1.00');
        }

        // Ensure amount is properly formatted (round to 2 decimal places)
        const roundedAmount = Math.round(amount * 100) / 100;
        
        const orderOptions = {
            amount: Math.round(roundedAmount * 100), // Razorpay expects amount in paise (integer)
            currency: currency,
            receipt: receipt || `receipt_${Date.now()}`,
            payment_capture: 1 // Auto capture payment
        };

        console.log('🔄 Creating Razorpay order with options:', {
            ...orderOptions,
            amount: `₹${amount} (${orderOptions.amount} paise)`
        });

        const order = await razorpay.orders.create(orderOptions);
        console.log('✅ Razorpay order created:', order.id);
        
        return {
            success: true,
            order: order,
            key_id: process.env.RAZORPAY_KEY_ID || process.env.key_id
        };
    } catch (error) {
        console.error('❌ Error creating Razorpay order:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Verify Payment Signature
 */
exports.verifyPayment = (orderId, paymentId, signature) => {
    try {
        const body = orderId + '|' + paymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || process.env.key_secret)
            .update(body.toString())
            .digest('hex');

        const isSignatureValid = expectedSignature === signature;
        
        if (isSignatureValid) {
            console.log('✅ Payment signature verified successfully');
            return { success: true, verified: true };
        } else {
            console.log('❌ Payment signature verification failed');
            return { success: false, verified: false, error: 'Invalid signature' };
        }
    } catch (error) {
        console.error('❌ Error verifying payment:', error);
        return { success: false, verified: false, error: error.message };
    }
};

/**
 * Get Payment Details
 */
exports.getPaymentDetails = async (paymentId) => {
    try {
        const payment = await razorpay.payments.fetch(paymentId);
        console.log('✅ Payment details fetched:', paymentId);
        
        return {
            success: true,
            payment: payment
        };
    } catch (error) {
        console.error('❌ Error fetching payment details:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Refund Payment
 */
exports.refundPayment = async (paymentId, amount = null) => {
    try {
        const refundOptions = {};
        if (amount) {
            refundOptions.amount = amount * 100; // Amount in paise
        }

        const refund = await razorpay.payments.refund(paymentId, refundOptions);
        console.log('✅ Refund processed:', refund.id);
        
        return {
            success: true,
            refund: refund
        };
    } catch (error) {
        console.error('❌ Error processing refund:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get Order Details
 */
exports.getOrderDetails = async (orderId) => {
    try {
        const order = await razorpay.orders.fetch(orderId);
        console.log('✅ Order details fetched:', orderId);
        
        return {
            success: true,
            order: order
        };
    } catch (error) {
        console.error('❌ Error fetching order details:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Generate Receipt ID
 */
exports.generateReceiptId = (studentId, courseId) => {
    const timestamp = Date.now();
    return `IS_${studentId.slice(-6)}_${courseId.slice(-6)}_${timestamp}`;
};

/**
 * Format Amount for Razorpay (Convert to paise)
 */
exports.formatAmount = (amount) => {
    return Math.round(amount * 100);
};

/**
 * Parse Razorpay Amount (Convert from paise to rupees)
 */
exports.parseAmount = (amountInPaise) => {
    return amountInPaise / 100;
};

/**
 * Validate Webhook Signature
 */
exports.validateWebhookSignature = (body, signature, secret) => {
    try {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(body))
            .digest('hex');

        return expectedSignature === signature;
    } catch (error) {
        console.error('❌ Error validating webhook signature:', error);
        return false;
    }
};

module.exports = exports;