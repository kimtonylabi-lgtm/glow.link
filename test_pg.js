const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:ehCA6MGio5hENzlo@db.mheihxhztkrpyjxoyndk.supabase.co:6543/postgres?pgbouncer=true'
});

async function run() {
    try {
        await client.connect();

        // Check columns
        const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders';`);
        const columns = res.rows.map(r => r.column_name);

        console.log('Columns in orders table:');
        console.log(columns);
        console.log('\nHas status_history:', columns.includes('status_history'));

        if (!columns.includes('status_history')) {
            console.log('\nColumn status_history is missing. Applying ALTER TABLE...');
            await client.query(`ALTER TABLE public.orders ADD COLUMN status_history JSONB DEFAULT '[]'::jsonb;`);
            console.log('Successfully added status_history column to orders table.');
        } else {
            console.log('\nstatus_history column is already present.');
        }

    } catch (err) {
        console.error('PG execution error:\n' + err.message);
    } finally {
        await client.end();
    }
}

run();
