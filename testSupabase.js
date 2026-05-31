require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  const { data, error } = await supabase.from('companies').select('*').limit(1);
  if (error) {
    console.log("Error querying 'companies':", error.message);
  } else {
    console.log("'companies' table exists. Data:", data);
  }

  const { data: tData, error: tError } = await supabase.from('training_events').select('*').limit(1);
  if (tError) {
    console.log("Error querying 'training_events':", tError.message);
  } else {
    console.log("'training_events' table exists. Data:", tData);
  }
}

testSupabase();
