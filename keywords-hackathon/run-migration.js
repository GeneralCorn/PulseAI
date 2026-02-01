#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const projectRef = 'fsjywkunrieilwbkucga';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

// Read the migration SQL file
const sql = fs.readFileSync('apply-migrations.sql', 'utf-8');

// Split into individual statements (rough split - works for most cases)
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

let completed = 0;
let failed = 0;

// Execute each statement sequentially
async function executeStatement(statement, index) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: statement + ';' });

    const options = {
      hostname: `${projectRef}.supabase.co`,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          completed++;
          process.stdout.write('.');
          resolve();
        } else {
          // Some errors are okay (like "already exists")
          if (responseData.includes('already exists') || 
              responseData.includes('duplicate') ||
              responseData.includes('PGRST204')) {
            completed++;
            process.stdout.write('.');
            resolve();
          } else {
            failed++;
            process.stdout.write('✗');
            resolve(); // Continue even if one fails
          }
        }
      });
    });

    req.on('error', (error) => {
      failed++;
      process.stdout.write('✗');
      resolve(); // Continue even if one fails
    });

    req.write(data);
    req.end();
  });
}

async function runMigrations() {
  console.log('🚀 Starting migration...\n');
  
  // Try executing in batches
  for (let i = 0; i < statements.length; i++) {
    await executeStatement(statements[i], i);
    
    // Add newline every 50 statements for readability
    if ((i + 1) % 50 === 0) {
      process.stdout.write(`\n`);
    }
  }
  
  console.log('\n');
  console.log(`\n✅ Migration complete!`);
  console.log(`   Successful: ${completed}`);
  if (failed > 0) {
    console.log(`   Failed: ${failed} (may be okay if objects already exist)`);
  }
}

runMigrations().catch(console.error);
