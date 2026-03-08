const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data: order } = await supabase.from('orders').select('id').limit(1).single();
    if (!order) {
        console.error("No orders found to test.");
        return;
    }
    console.log("Found order:", order.id, ". Attempting dummy insert to see schema details...");
    const { data, error } = await supabase.from('shipping_orders').insert({
        order_id: order.id,
        shipped_quantity: 1,
        shipping_date: new Date().toISOString()
    }).select();

    if (error) {
        console.log("Schema Error Detected (Expected):", error.message);
        console.log("Full Error Object:", JSON.stringify(error, null, 2));
    } else {
        console.log("Insert Success (Surprisingly). Sample Columns:", Object.keys(data[0]).join(", "));
        await supabase.from('shipping_orders').delete().eq('id', data[0].id);
    }
}
inspect();
