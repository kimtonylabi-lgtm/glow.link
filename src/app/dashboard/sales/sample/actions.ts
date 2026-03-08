'use server'

import { revalidatePath, unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sampleRequestSchema, type SampleRequestFormValues } from '@/lib/validations/sample'

// 영업팀: 새로운 샘플 요청 등록
export async function addSampleRequest(data: SampleRequestFormValues) {
    noStore(); // [긴급] Server Action 내 캐시 강제 무효화
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: '인증되지 않은 사용자입니다.' }
        }

        const parsedData = sampleRequestSchema.safeParse(data)

        if (!parsedData.success) {
            return { error: '입력값이 올바르지 않습니다.' }
        }

        const {
            client_id,
            product_name,
            quantity,
            contact_person,
            cat_no,
            has_sample,
            has_film,
            has_laba,
            shipping_address,
            special_instructions,
            sample_type,
            sample_no,
            completion_date,
            design_specs
        } = parsedData.data

        let final_client_id = client_id
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

        // client_id가 UUID가 아니면(직접 입력한 사명인 경우) 처리
        if (!uuidRegex.test(client_id)) {
            // 동일 이름의 기존 업체가 있는지 확인
            const { data: existingClient } = await supabase
                .from('clients')
                .select('id')
                .eq('company_name', client_id)
                .maybeSingle()

            if (existingClient) {
                final_client_id = existingClient.id
            } else {
                // 새로운 업체 등록
                const { data: newClient, error: clientError } = await supabase
                    .from('clients')
                    .insert({ company_name: client_id })
                    .select('id')
                    .single()

                if (clientError) {
                    return { error: `신규 업체 등록 실패: ${clientError.message}` }
                }
                final_client_id = newClient.id
            }
        }

        // [해결책 2] 서버단 무조건 재채번 - 프론트엔드 번호는 단순 참고용이며, 무조건 최신 번호로 덮어씀
        const { success: seqSuccess, nextNo: freshSampleNo } = await getNextSampleNo(sample_type);
        if (!seqSuccess || !freshSampleNo) {
            console.error(`[actions.ts] Failed to generate next number for type: ${sample_type}`);
            return { error: '샘플 번호 생성 실패' };
        }

        console.log(`[actions.ts] FORCING OVERWRITE: Frontend suggested "${sample_no}", Server using "${freshSampleNo}"`);

        // 프론트엔드에서 보낸 sample_no를 완전히 배제하고 서버에서 새로 생성한 번호만 사용
        const insertPayload: any = {
            client_id: final_client_id,
            product_name,
            quantity,
            contact_person,
            sample_no: freshSampleNo, // 서버에서 딴 새 번호로 강제 할당 (절대적)
            cat_no: (sample_type === 'design') ? cat_no : null,
            has_sample: has_sample ?? false,
            has_film: has_film ?? false,
            has_laba: has_laba ?? false,
            shipping_address,
            special_instructions,
            sample_type,
            sales_person_id: user.id,
            design_specs: (sample_type === 'design') ? (design_specs || []) : null
        }

        if (sample_type === 'design' && completion_date) {
            insertPayload.completion_date = new Date(completion_date).toISOString().split('T')[0]
        }

        console.log("[actions.ts] FINAL DATABASE INSERT PAYLOAD:", JSON.stringify(insertPayload, null, 2));

        const { data: insertedData, error: insertError } = await supabase
            .from('sample_requests')
            .insert(insertPayload)
            .select()
            .single()

        if (insertError) {
            console.error("[actions.ts] CRITICAL DB INSERT ERROR:", insertError);
            return { error: `등록 실패 (DB): ${insertError.message}` }
        }

        revalidatePath('/dashboard/sales/sample')
        revalidatePath('/dashboard/sample_team')

        return { success: true, data: insertedData }
    } catch (err: unknown) {
        if (err instanceof Error) {
            return { error: err.message }
        }
        return { error: 'Unknown API error' }
    }
}

// 샘플팀: 샘플 상태 업데이트 (이미지 URL 옵션)
export async function updateSampleStatus(id: string, newStatus: string, imageUrl?: string | null) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: '인증되지 않은 사용자입니다.' }
        }

        const updatePayload: any = { status: newStatus }
        if (imageUrl !== undefined) {
            updatePayload.completion_image_url = imageUrl
        }

        const { error: updateError } = await supabase
            .from('sample_requests')
            .update(updatePayload)
            .eq('id', id)

        if (updateError) {
            return { error: updateError.message }
        }

        revalidatePath('/dashboard/sales/sample')
        revalidatePath('/dashboard/sample_team')
        return { success: true }
    } catch (err: unknown) {
        if (err instanceof Error) {
            return { error: err.message }
        }
        return { error: 'Unknown API error' }
    }
}

export async function getNextSampleNo(sampleType: string) {
    noStore(); // [긴급] 채번 시 캐시된 데이터 반환 방지
    const supabase = await createClient()

    // [해결책] 단순히 건수(count)를 세지 말고, 실제 DB에서 가장 큰 번호를 실시간 조회 (Gaps/Delete 대응)
    const prefix = sampleType === 'random' ? 'R' : sampleType === 'ct' ? 'C' : 'D'

    const { data: maxItem, error: maxError } = await (supabase as any)
        .from('sample_requests')
        .select('sample_no')
        .eq('sample_type', sampleType)
        .order('sample_no', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (maxError) {
        console.error('[actions.ts] Max check error:', maxError);
        // DB 조회 실패 시 RPC로 폴백하되, 역시 캐시 영향 최소화
        const { data: rpcData } = await (supabase as any).rpc('get_next_sample_seq_v2', { p_type: sampleType });
        const nextVal = (rpcData || 0) + 1;
        return { success: true, nextNo: `${prefix}${String(nextVal).padStart(6, '0')}` }
    }

    let nextVal = 1;
    if (maxItem && (maxItem as any).sample_no) {
        // 문자를 제외한 숫자 부분 추출 (e.g. R000005 -> 5)
        const numericPart = (maxItem as any).sample_no.replace(/[^0-9]/g, '');
        const currentNum = parseInt(numericPart);
        if (!isNaN(currentNum)) {
            nextVal = currentNum + 1;
        }
    }

    const finalNo = `${prefix}${String(nextVal).padStart(6, '0')}`;
    console.log(`[actions.ts] Next real-time sequence for ${sampleType}: ${finalNo}`);

    return { success: true, nextNo: finalNo }
}
