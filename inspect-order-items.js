const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data: item, error } = await supabase.from('order_items').select('*').limit(1).single();
    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("order_items columns:", Object.keys(item).join(", "));
    }
}
inspect();
