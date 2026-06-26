require('dotenv').config({ path: '.env.local' });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fetchTable(table) {
  const res = await fetch(`${URL}/rest/v1/${table}?select=*`, {
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`
    }
  });
  const data = await res.json();
  console.log(`--- ${table.toUpperCase()} ---`);
  console.log(JSON.stringify(data, null, 2));
}

async function check() {
  await fetchTable('profiles');
  await fetchTable('employer_profiles');
  await fetchTable('jobs');
}
check();
