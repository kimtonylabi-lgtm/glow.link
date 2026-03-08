const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    // 1. orders 테이블 컬럼 확인
    const { data: order, error: orderErr } = await supabase.from('orders').select('*').limit(1).single();
    console.log("Orders columns:", order ? Object.keys(order).join(", ") : "Error: " + orderErr?.message);

    // 2. 실제 데이터 샘플 (client_product_name 유무 확인)
    const { data: items, error: itemsErr } = await supabase.from('order_items').select('*, orders(po_number)').not('client_product_name', 'is', null).limit(3);
    console.log("Order items with client_product_name:", JSON.stringify(items, null, 2));
}
inspect();
