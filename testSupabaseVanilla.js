const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function testSupabase() {
  console.log("Checking if training_events exists...");
  const { data, error } = await supabase.from('training_events').select('id').limit(1);
  if (error) {
    console.log("Table training_events ERROR:", error.message);
  } else {
    console.log("Table training_events OK!");
  }
}
testSupabase();
