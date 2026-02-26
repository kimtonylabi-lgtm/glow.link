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

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const url = request.nextUrl.clone()

    if (user && url.pathname.startsWith('/dashboard')) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile) {
            if (profile.role === 'inactive') {
                // Force logout and redirect to login with error
                await supabase.auth.signOut()
                url.pathname = '/login'
                url.searchParams.set('error', 'account_deactivated')
                const response = NextResponse.redirect(url)
                // Copy cookies to the new response
                supabaseResponse.cookies.getAll().forEach((cookie) => {
                    response.cookies.set(cookie.name, cookie.value)
                })
                return response
            }

            if (profile.role === 'pending' && url.pathname !== '/dashboard/pending') {
                url.pathname = '/dashboard/pending'
                return NextResponse.redirect(url)
            }

            if (profile.role !== 'pending' && url.pathname === '/dashboard/pending') {
                url.pathname = '/dashboard'
                return NextResponse.redirect(url)
            }
        }
    }

    if (
        !user &&
        url.pathname.startsWith('/dashboard')
    ) {
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // If user is already logged in, redirect /login to /dashboard
    if (
        user &&
        url.pathname === '/login'
    ) {
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
