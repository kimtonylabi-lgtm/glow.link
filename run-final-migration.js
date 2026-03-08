const { Client } = require('pg');

const config = {
    user: 'postgres.clclddgtbshfshmivtue',
    password: 'K9#989&88',
    host: 'aws-0-ap-northeast-2.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

async function run() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log("Connected to DB");

        const sql = `
            -- 1. shipping_orders 테이블 컬럼 보정
            ALTER TABLE public.shipping_orders ALTER COLUMN tracking_number DROP NOT NULL;
            ALTER TABLE public.shipping_orders ALTER COLUMN shipping_date DROP NOT NULL;
            
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shipping_orders' AND column_name='shipping_method') THEN 
                    ALTER TABLE public.shipping_orders ADD COLUMN shipping_method VARCHAR(50); 
                END IF; 
            END $$;

            -- 2. 제품명 JOIN을 위한 외래키 관계 강제 설정 (order_items -> client_products)
            -- client_product_id 컬럼이 있는지 확인 후 FK 설정
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='client_product_id') THEN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints tc 
                        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name 
                        WHERE tc.table_name = 'order_items' AND kcu.column_name = 'client_product_id' AND tc.constraint_type = 'FOREIGN KEY'
                    ) THEN
                        ALTER TABLE public.order_items ADD CONSTRAINT fk_order_items_client_product 
                        FOREIGN KEY (client_product_id) REFERENCES public.client_products(id) 
                        ON DELETE SET NULL;
                    END IF;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Caught error during FK creation: %', SQLERRM;
            END $$;
        `;

        await client.query(sql);
        console.log("SQL Migration Success!");

        const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'shipping_orders'`);
        console.log("Final Columns:", res.rows.map(r => r.column_name).join(", "));

    } catch (err) {
        console.error("Migration Failed:", err.message);
    } finally {
        await client.end();
    }
}
run();
