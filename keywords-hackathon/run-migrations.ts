import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Run migrations in order

  console.log(`Found ${migrationFiles.length} migration(s) to run:`);
  migrationFiles.forEach(file => console.log(`  - ${file}`));
  console.log('');

  for (const file of migrationFiles) {
    console.log(`Running migration: ${file}`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
      // Execute SQL using Supabase RPC
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

      if (error) {
        console.error(`  ❌ Error in ${file}:`, error.message);
        // Try alternative method using the REST API directly
        console.log('  Trying alternative method...');

        // Split SQL into individual statements and execute them
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of statements) {
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ sql_query: statement + ';' })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`  ❌ Failed to execute statement:`, errorText);
          }
        }
      } else {
        console.log(`  ✅ Successfully ran ${file}`);
      }
    } catch (err) {
      console.error(`  ❌ Exception in ${file}:`, err);
    }
    console.log('');
  }

  console.log('Migration process completed!');
}

runMigrations().catch(console.error);
