/**
 * Test Newsletter API Endpoints
 * 
 * Script to test the newsletter admin API endpoints
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';

async function testNewsletterAPI() {
    console.log('============================================');
    console.log('Testing Newsletter API Endpoints');
    console.log('============================================\n');

    // Note: These tests require:
    // 1. A valid admin user token
    // 2. MailerLite API key configured
    // 3. Server running

    console.log('⚠️  Manual Testing Required');
    console.log('============================================\n');
    console.log('To test the newsletter API endpoints, you need to:');
    console.log('1. Start the server: npm run dev (in server directory)');
    console.log('2. Get an admin auth token from the frontend');
    console.log('3. Use Postman or curl to test the endpoints\n');
    console.log('Available Endpoints:');
    console.log('--------------------------------------------');
    console.log('GET    /api/admin/newsletters              - List all campaigns');
    console.log('GET    /api/admin/newsletters/:id          - Get single campaign');
    console.log('POST   /api/admin/newsletters              - Create campaign');
    console.log('PUT    /api/admin/newsletters/:id          - Update campaign');
    console.log('POST   /api/admin/newsletters/:id/send     - Send campaign');
    console.log('POST   /api/admin/newsletters/subscribers  - Add subscriber');
    console.log('DELETE /api/admin/newsletters/subscribers/:email - Remove subscriber\n');
    console.log('Example curl commands:');
    console.log('--------------------------------------------');
    console.log(`# List campaigns`);
    console.log(`curl -X GET "${API_URL}/api/admin/newsletters" \\`);
    console.log(`  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\`);
    console.log(`  -H "Content-Type: application/json"\n`);
    console.log(`# Create campaign`);
    console.log(`curl -X POST "${API_URL}/api/admin/newsletters" \\`);
    console.log(`  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"name":"Test Newsletter","subject":"Test Subject","type":"regular","content":{"html":"<p>Test content</p>"}}'\n`);
    console.log(`# Add subscriber`);
    console.log(`curl -X POST "${API_URL}/api/admin/newsletters/subscribers" \\`);
    console.log(`  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"email":"${TEST_EMAIL}"}'\n`);
    console.log('============================================\n');
}

testNewsletterAPI().catch(console.error);

