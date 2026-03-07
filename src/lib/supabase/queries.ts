/**
 * @file queries.ts
 * @description React cache()로 감싼 공통 Supabase 쿼리 함수 모음.
 *
 * [핵심 원리]
 * React의 cache()는 동일한 서버 요청(Request) 수명 주기 내에서
 * 동일한 인자로 호출되면 DB를 다시 조회하지 않고 캐시된 결과를 반환합니다.
 * → layout.tsx, page.tsx, 각종 server action에서 중복 호출해도 DB는 1번만 조회!
 *
 * [JWT 역할 보안 정책]
 * - 미들웨어(경량 라우팅 가드): JWT 클레임에서 role 읽기 (빠름, DB 없음)
 * - 핵심 서버 액션(발주 확정 등): getProfileForAction() 호출 → DB 재확인 (안전)
 */
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────────────────────────────────────
// 1. 현재 유저 가져오기 (동일 요청 내 캐시)
// ─────────────────────────────────────────────────────────────────────────────
export const getCurrentUser = cache(async () => {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    return user
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. 프로필 가져오기 (동일 요청 내 캐시)
// ─────────────────────────────────────────────────────────────────────────────
export const getProfile = cache(async (userId: string) => {
    const supabase = await createClient()
    const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, department, created_at')
        .eq('id', userId)
        .single()
    return data
})


// ─────────────────────────────────────────────────────────────────────────────
// 3. 현재 유저 + 프로필 한 번에 가져오기 (가장 많이 쓰이는 패턴)
// ─────────────────────────────────────────────────────────────────────────────
export const getCurrentUserWithProfile = cache(async () => {
    const user = await getCurrentUser()
    if (!user) return { user: null, profile: null }
    const profile = await getProfile(user.id)
    return { user, profile }
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. [보안 강화] 핵심 서버 액션 전용 역할 검증 함수
//    JWT가 아니라 반드시 DB를 직접 조회하여 최신 권한 확인
//    → 관리자가 권한 변경 후 사용자가 로그아웃 안 해도 서버 액션은 항상 최신 권한 적용
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyRoleForAction(
    allowedRoles: string[]
): Promise<{ authorized: boolean; role: string | null; userId: string | null }> {
    try {
        const supabase = await createClient()

        // JWT 캐시 없이 항상 fresh하게 getUser 호출
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return { authorized: false, role: null, userId: null }
        }

        // DB에서 최신 역할을 직접 조회 (캐시 함수 사용 금지 - 항상 신선한 값 필요)
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (error || !profile) {
            return { authorized: false, role: null, userId: user.id }
        }

        const authorized = allowedRoles.includes(profile.role)
        return { authorized, role: profile.role, userId: user.id }
    } catch {
        return { authorized: false, role: null, userId: null }
    }
}
