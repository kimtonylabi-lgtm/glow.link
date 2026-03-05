const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://mheihxhztkrpyjxoyndk.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA1MDAzMiwiZXhwIjoyMDg3NjI2MDMyfQ.UY6hYEf5y22MOh-4ckxE98Ptgk3wwddWPjalaBrlbaM'
);

async function run() {
    const { data, error } = await supabase.from('orders').select('*').limit(1);

    if (error) {
        console.error('Error fetching orders:', error.message);
        return;
    }

    if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log('Columns in first row:', columns);
        console.log('Has status_history:', columns.includes('status_history'));
    } else {
        console.log('No rows returned, cannot infer columns from data.');
    }
}

run();
