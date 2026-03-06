#!/usr/bin/env node

/**
 * Generate Secure JWT Secret
 * Run: node generate-jwt-secret.js
 */

const crypto = require('crypto');

console.log('🔐 Generating Secure JWT Secret...\n');

// Generate a 64-byte (512-bit) random secret
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('✅ Your secure JWT secret:');
console.log('┌─────────────────────────────────────────────────────────────────┐');
console.log(`│ ${jwtSecret}  │`);
console.log('└─────────────────────────────────────────────────────────────────┘');

console.log('\n📝 Add this to your backend/.env file:');
console.log(`JWT_SECRET=${jwtSecret}`);

console.log('\n🔒 Security Notes:');
console.log('- This secret is 128 characters (64 bytes) long');
console.log('- Keep this secret safe and never commit it to version control');
console.log('- Use different secrets for development and production');
console.log('- Consider rotating this secret every 6-12 months');

console.log('\n✨ Done! Your application is now more secure.');