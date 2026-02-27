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
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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
    const isAuthAction = pathname.startsWith('/auth') || pathname.includes('logout') || pathname.startsWith('/api/')
    if (isAuthAction) {
        return supabaseResponse
    }

    // 1. Role-based protection for authenticated users
    if (user) {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            // If profile doesn't exist yet (race condition with trigger), treat as pending
            if (error || !profile) {
                if (pathname === '/pending') return supabaseResponse
                url.pathname = '/pending'
                return NextResponse.redirect(url)
            }

            if (profile.role === 'inactive') {
                await supabase.auth.signOut()
                url.pathname = '/login'
                url.searchParams.set('error', 'account_deactivated')
                const response = NextResponse.redirect(url)
                // Transfer cookies to ensure session clearing is reflected
                supabaseResponse.cookies.getAll().forEach((cookie) => {
                    response.cookies.set(cookie.name, cookie.value)
                })
                return response
            }

            // PENDING ROLE DEFENSE
            if (profile.role === 'pending') {
                // [CRITICAL] Early return if already on /pending to prevent Redirect Loop
                if (pathname === '/pending') {
                    return supabaseResponse
                }

                // Redirect anyone with pending role to /pending room
                url.pathname = '/pending'
                const response = NextResponse.redirect(url)
                // Copy cookies to maintain session
                supabaseResponse.cookies.getAll().forEach((cookie) => {
                    response.cookies.set(cookie.name, cookie.value)
                })
                return response
            }

            // AUTHORIZED ROLE DEFENSE
            // If user is NOT pending but stays on /pending page, move them to dashboard
            if (profile.role !== 'pending' && pathname === '/pending') {
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
