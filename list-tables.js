const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    const { data, error } = await supabase.rpc('get_tables'); // Try a common RPC if it exists
    if (error) {
        console.log("RPC get_tables failed. Trying direct query on information_schema via RPC...");
        // If we don't have get_tables, we'll try to just select from a known table to see if it works
        const tables = ['orders', 'order_items', 'shipping_orders', 'shippings', 'shipments'];
        for (const t of tables) {
            const { error: e } = await supabase.from(t).select('count', { count: 'exact', head: true });
            if (e) console.log(`Table '${t}': NOT FOUND or ERROR (${e.message})`);
            else console.log(`Table '${t}': FOUND`);
        }
    } else {
        console.log("Tables:", data);
    }
}
listTables();
