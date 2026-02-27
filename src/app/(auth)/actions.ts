'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // type-casting here for convenience
    // in practice, you should validate your inputs
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        full_name: formData.get('full_name') as string,
        department: formData.get('department') as string,
    }

    const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
            data: {
                full_name: data.full_name || '익명',
                department: data.department || '미지정',
            }
        }
    })

    if (error) {
        console.error('Sign Up Error (Supabase):', error)
        // Check for common errors
        if (error.message.includes('Database error saving user')) {
            return { error: '데이터베이스 오류: 역할(Role) 설정 중 문제가 발생했습니다. 관리자에게 문의하세요.' }
        }
        return { error: error.message }
    }

    // Check if email confirmation is required (session will be null)
    if (authData.user && !authData.session) {
        console.log('Signup success but verification required')
        return { success: true, verificationRequired: true }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}
