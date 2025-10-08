import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

// PUT: Atualiza ou cria o perfil do usuário
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Verificar se o perfil existe
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Erro ao buscar perfil:', profileError)
      return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 })
    }

    // Atualizar ou criar o perfil
    const { data: profile, error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id,
        name: body.name,
        is_premium: body.is_premium,
        expiration_date: body.expiration_date,
        phone_number: body.phone_number,
        phone_local_code: body.phone_local_code,
        external_id: body.external_id,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Erro ao atualizar perfil:', upsertError)
      return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 })
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
