import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './database.types'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and supabase.auth.getUser()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const url = request.nextUrl.clone()
    const pathname = url.pathname

    // 0. Bypass specific paths (Logout, API, etc.)
    const isAuthAction =
        pathname.startsWith('/auth') ||
        pathname.includes('logout') ||
        pathname.startsWith('/api/')
    if (isAuthAction) {
        return supabaseResponse
    }

    // 1. Role-based protection for authenticated users
    if (user) {
        try {
            // ─── [성능 최적화] ──────────────────────────────────────────────────────
            // JWT의 app_metadata에서 role을 읽어 DB 왕복을 제거합니다.
            //
            // [보안 설계]
            // - app_metadata는 서버만 쓸 수 있어 클라이언트 위변조 불가 (안전)
            // - 단, JWT는 세션 갱신(로그인/로그아웃) 전까지 오래된 값을 가질 수 있음
            // - 따라서 미들웨어는 가벼운 라우팅 가드 용도로만 사용
            // - 발주 확정 등 핵심 서버 액션은 verifyRoleForAction() → DB 재검증 필수
            // ────────────────────────────────────────────────────────────────────────
            const jwtRole = user.app_metadata?.role as string | undefined
            const userEmail = user.email

            // ADMIN BYPASS: Never block the main admin account
            if (userEmail === 'admin@glow.link') {
                return supabaseResponse
            }

            // JWT에 role이 없는 경우(예: 초기 가입 직후 트리거 미실행) DB fallback 조회
            let resolvedRole: string | null = jwtRole ?? null

            if (!resolvedRole) {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (error || !profile) {
                    if (pathname === '/pending') return supabaseResponse
                    url.pathname = '/pending'
                    return NextResponse.redirect(url)
                }
                resolvedRole = profile.role
            }

            if (resolvedRole === 'inactive') {
                await supabase.auth.signOut()
                url.pathname = '/login'
                url.searchParams.set('error', 'account_deactivated')
                const response = NextResponse.redirect(url)
                supabaseResponse.cookies.getAll().forEach((cookie) => {
                    response.cookies.set(cookie.name, cookie.value)
                })
                return response
            }

            // PENDING ROLE DEFENSE
            if (resolvedRole === 'pending') {
                if (pathname === '/pending') {
                    return supabaseResponse
                }
                url.pathname = '/pending'
                const response = NextResponse.redirect(url)
                supabaseResponse.cookies.getAll().forEach((cookie) => {
                    response.cookies.set(cookie.name, cookie.value)
                })
                return response
            }

            // AUTHORIZED ROLE DEFENSE
            if (resolvedRole !== 'pending' && pathname === '/pending') {
                url.pathname = '/dashboard'
                return NextResponse.redirect(url)
            }

            // LOGIN PAGE DEFENSE
            if (pathname === '/login') {
                url.pathname = '/dashboard'
                return NextResponse.redirect(url)
            }
        } catch (e) {
            console.error('Middleware role check error:', e)
        }
    } else {
        // 2. Auth protection for unauthenticated users
        const isProtectedRoute = pathname.startsWith('/dashboard') || pathname === '/pending'
        if (isProtectedRoute) {
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
