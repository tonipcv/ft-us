import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

// PUT: Atualiza ou cria o perfil do usuário
export async function PUT(request: NextRequest) {
  try {
    // Extrair o "id" a partir da URL
    const { pathname } = new URL(request.url)
    // Supondo que sua rota é "/api/users/[id]", o ID será o último segmento
    const segments = pathname.split('/')
    const userId = segments[segments.length - 1]
    
    const data = await request.json()
    const profileData = {
      id: userId,
      name: data.name,
      is_premium: data.is_premium,
      expiration_date: data.expiration_date,
      phone_number: data.phone_number,
      phone_local_code: data.phone_local_code,
      external_id: data.external_id,
      updated_at: new Date().toISOString(),
    }

    // Verificar se o perfil existe
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar perfil:', checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    // Criar ou atualizar
    let result
    if (!existingProfile) {
      // Criar novo perfil
      result = await supabase
        .from('profiles')
        .insert([{ ...profileData, created_at: new Date().toISOString() }])
    } else {
      // Atualizar perfil existente
      result = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
    }

    if (result.error) {
      console.error('Erro ao salvar perfil:', result.error)
      return NextResponse.json(
        { error: result.error.message, details: result.error.details },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, profile: result.data })
  } catch (error: unknown) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE: Deleta usuário e perfil
export async function DELETE(request: NextRequest) {
  try {
    // Extrair o "id" a partir da URL
    const { pathname } = new URL(request.url)
    const segments = pathname.split('/')
    const userId = segments[segments.length - 1]

    // Primeiro deletar o perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Depois deletar o usuário do Auth
    const { error: userError } = await supabase.auth.admin.deleteUser(userId)

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
