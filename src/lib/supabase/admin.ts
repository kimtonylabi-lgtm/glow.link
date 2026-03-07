import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * [관리자용] 서비스 롤 키를 사용하여 RLS를 우회하는 수퍼베이스 클라이언트입니다.
 * 서버 사이드(Server Actions, Route Handlers)에서만 사용해야 하며, 절대 클라이언트에 노출하지 마세요.
 */
export const createAdminClient = () => {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
