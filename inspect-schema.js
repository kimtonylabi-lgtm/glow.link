const { Client } = require('pg');
const user = 'postgres.clclddgtbshfshmivtue';
const password = encodeURIComponent('K9#989&88');
const host = 'aws-0-ap-northeast-2.pooler.supabase.com';
const port = 5432;
const database = 'postgres';
const dbUrl = `postgresql://${user}:${password}@${host}:${port}/${database}`;

async function run() {
    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'shipping_orders'
        `);
        console.log("Columns in shipping_orders:");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
