/**
 * Razorpay UPI Configuration Guide
 * Steps to enable UPI QR Code in Razorpay Dashboard
 */

console.log(`
🔧 RAZORPAY DASHBOARD CONFIGURATION GUIDE
==========================================

📍 STEP 1: Login to Razorpay Dashboard
   → Go to: https://dashboard.razorpay.com/
   → Login with your test account credentials

📍 STEP 2: Enable Payment Methods
   → Navigate: Settings → Configuration → Payment Methods
   → Ensure UPI is ENABLED:
     ✅ UPI Collect (for QR codes)
     ✅ UPI Intent (for app redirects)
   → Save changes

📍 STEP 3: Configure UPI Settings  
   → Go to: Settings → Payment Methods → UPI
   → Enable these options:
     ✅ UPI QR Code
     ✅ UPI Collect
     ✅ UPI Intent
     ✅ Dynamic QR Code
   → Set timeout: 5-15 minutes

📍 STEP 4: Webhook Configuration (Optional but recommended)
   → Navigate: Settings → Webhooks
   → Add webhook URL: ' + process.env.CLIENT_URL + '/api/payments/webhook
   → Select events:
     ✅ payment.authorized
     ✅ payment.failed
     ✅ order.paid

📍 STEP 5: Test Mode Verification
   → Ensure you're in TEST mode (not LIVE)
   → Test Key should start with: rzp_test_
   → UPI testing works in test mode with dummy QR codes

🚨 COMMON ISSUES & SOLUTIONS:
❌ UPI not showing → Check Payment Methods are enabled
❌ QR code not displaying → Verify UPI Collect is active
❌ Logo CORS error → Logo removed from config (✅ Fixed)
❌ Timeout too short → Increase UPI timeout in dashboard

📱 TESTING UPI QR CODES:
   → In test mode, you can simulate UPI payments
   → Use any UPI testing app or Razorpay's test cards
   → QR codes will show dummy data but flow will work

💡 NOTE: Some UPI features require business verification
   → But test mode should show QR codes without verification
   → Contact Razorpay support if UPI still doesn't appear after enabling
`);