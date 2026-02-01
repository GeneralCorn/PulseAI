import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD;
const PROJECT_REF = 'fsjywkunrieilwbkucga';

if (!DB_PASSWORD) {
  console.error(`
❌ Database password not found!

Please set your database password in .env.local:

  SUPABASE_DB_PASSWORD=your_password_here

You can find your password in:
  Supabase Dashboard > Settings > Database > Database Password

If you've lost it, you can reset it in the same location.
`);
  process.exit(1);
}

// Construct the connection string for Supabase (direct connection)
const connectionString = `postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`;

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Read the migration file
    const sqlPath = path.join(__dirname, 'apply-migrations.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📋 Running migrations...\n');

    // Execute the SQL
    await client.query(sql);

    console.log('✅ Migrations applied successfully!\n');
    console.log('🎉 Your database is ready! The ideas table has been created.');

  } catch (error: any) {
    console.error('❌ Migration failed:');
    console.error(error.message);

    if (error.message.includes('password authentication failed')) {
      console.error('\n💡 The database password is incorrect. Please check:');
      console.error('   1. Your password in .env.local');
      console.error('   2. The password in Supabase Dashboard > Settings > Database');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
