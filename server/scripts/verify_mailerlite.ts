/**
 * Verify MailerLite Connection
 * 
 * Simple script to verify MailerLite API connection and list available methods
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function verifyMailerLite() {
    console.log('============================================');
    console.log('Verifying MailerLite Connection');
    console.log('============================================\n');

    const apiKey = process.env.MAILERLITE_API_KEY;
    if (!apiKey) {
        console.log('❌ MAILERLITE_API_KEY not found in environment variables');
        console.log('   Please set MAILERLITE_API_KEY in your .env file\n');
        return;
    }

    console.log('✅ MAILERLITE_API_KEY found\n');

    try {
        // Dynamic import to handle missing package gracefully
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const MailerLite = require('@mailerlite/mailerlite-nodejs');
        
        console.log('✅ MailerLite SDK loaded\n');
        console.log('Available SDK methods:');
        console.log('--------------------------------------------');
        
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
        const client = new MailerLite({ api_key: apiKey });
        
        // Check available methods
        const methods = Object.keys(client).filter(key => typeof client[key] === 'object' && client[key] !== null);
        console.log('Client object keys:', methods.join(', '));
        
        if (client.subscribers) {
            console.log('\n✅ Subscribers API available');
            const subscriberMethods = Object.keys(client.subscribers);
            console.log('   Methods:', subscriberMethods.join(', '));
        }
        
        if (client.campaigns) {
            console.log('\n✅ Campaigns API available');
            const campaignMethods = Object.keys(client.campaigns);
            console.log('   Methods:', campaignMethods.join(', '));
        } else {
            console.log('\n⚠️  Campaigns API not found - checking alternative structure...');
            console.log('   Full client structure:', Object.keys(client));
        }

        // Test health check
        console.log('\n--------------------------------------------');
        console.log('Testing API Connection...');
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            await client.subscribers.get({ limit: 1 });
            console.log('✅ API connection successful!');
        } catch (error) {
            console.log('❌ API connection failed:');
            console.log('   Error:', (error as Error).message);
            console.log('\n   This might be due to:');
            console.log('   - Invalid API key');
            console.log('   - Network issues');
            console.log('   - MailerLite service unavailable');
        }

    } catch (error) {
        console.log('❌ Failed to load MailerLite SDK:');
        console.log('   Error:', (error as Error).message);
        console.log('\n   Make sure @mailerlite/mailerlite-nodejs is installed:');
        console.log('   npm install @mailerlite/mailerlite-nodejs');
    }

    console.log('\n============================================\n');
}

verifyMailerLite().catch(console.error);

