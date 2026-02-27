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

    // 1. Role-based protection for authenticated users
    if (user && url.pathname.startsWith('/dashboard')) {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            // If profile doesn't exist yet (race condition with trigger), treat as pending or error
            if (error || !profile) {
                // If it's a new user, they might not have a profile for a split second
                if (url.pathname !== '/dashboard/pending') {
                    url.pathname = '/dashboard/pending'
                    return NextResponse.redirect(url)
                }
                return supabaseResponse
            }

            if (profile.role === 'inactive') {
                await supabase.auth.signOut()
                url.pathname = '/login'
                url.searchParams.set('error', 'account_deactivated')
                const response = NextResponse.redirect(url)
                supabaseResponse.cookies.getAll().forEach((cookie) => {
                    response.cookies.set(cookie.name, cookie.value)
                })
                return response
            }

            if (profile.role === 'pending' && url.pathname !== '/pending') {
                url.pathname = '/pending'
                return NextResponse.redirect(url)
            }

            if (profile.role !== 'pending' && url.pathname === '/pending') {
                url.pathname = '/dashboard'
                return NextResponse.redirect(url)
            }
        } catch (e) {
            console.error('Middleware role check error:', e)
            // Safety fallback
        }
    }

    // 2. Auth protection
    if (
        !user &&
        (url.pathname.startsWith('/dashboard') || url.pathname === '/pending')
    ) {
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // 3. Login redirect
    if (
        user &&
        url.pathname === '/login'
    ) {
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
