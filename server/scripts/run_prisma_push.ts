#!/usr/bin/env tsx
/**
 * Script to run Prisma db push with proper environment variable loading
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from multiple possible locations
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../server/.env'),
  path.resolve(process.cwd(), '.env'),
];

for (const envPath of envPaths) {
  try {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      console.log(`✓ Loaded .env from: ${envPath}`);
      break;
    }
  } catch (error) {
    // Continue to next path
  }
}

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('Please set DATABASE_URL in your .env file');
  process.exit(1);
}

console.log('✓ DATABASE_URL is set');
console.log('Running: npx prisma db push\n');

try {
  execSync('npx prisma db push', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
    env: process.env,
  });
  console.log('\n✅ Prisma db push completed successfully');
} catch (error) {
  console.error('\n❌ Prisma db push failed');
  process.exit(1);
}

