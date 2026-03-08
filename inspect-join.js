const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    // 1. orders와 order_items 조인 확인
    const { data, error } = await supabase
        .from('orders')
        .select('id, order_items(id, client_product_name)')
        .limit(5);

    console.log("Joined data sample:", JSON.stringify(data, null, 2));
}
inspect();
