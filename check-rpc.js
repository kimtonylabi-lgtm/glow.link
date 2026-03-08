const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function run() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // RPC 목록 조회 (보통 정보 스키마에서 조회 가능하거나 시스템 함수 사용)
    const { data, error } = await supabase.from('_rpc_list').select('*').limit(1); // 가상의 테이블, 에러 유도하여 목록 확인 시도 가능성도 있음

    // 대신 rpc API의 에러 메시지에서 추천하는 로직을 보거나, 직접 pg 등으로 다시 시도
    console.log("Checking RPC existence via trial...");
    const { error: err1 } = await supabase.rpc('execute_sql', { sql_query: 'SELECT 1' });
    if (err1) console.log("execute_sql failed:", err1.message);

    const { error: err2 } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    if (err2) console.log("exec_sql failed:", err2.message);

    const { error: err3 } = await supabase.rpc('run_sql', { sql: 'SELECT 1' });
    if (err3) console.log("run_sql failed:", err3.message);
}

run();
