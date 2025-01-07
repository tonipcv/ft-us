import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

interface ApiError {
  message: string;
  code?: string;
  details?: string;
}

// Criar cliente Supabase com variáveis de ambiente do servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export async function GET() {
  try {
    // Buscar todos os usuários do Auth
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers()
    
    if (getUserError) {
      return NextResponse.json({ error: getUserError.message }, { status: 500 })
    }

    if (!users) {
      return NextResponse.json({ users: [] })
    }

    // Buscar todos os perfis
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Combinar usuários com seus perfis
    const usersWithProfiles = users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      profile: profiles?.find(profile => profile.id === user.id)
    }))

    return NextResponse.json({ users: usersWithProfiles })
  } catch (error: unknown) {
    console.error('Erro na API:', error)
    const apiError = error as ApiError
    return NextResponse.json(
      { error: apiError.message || 'Erro interno do servidor' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, is_premium, expiration_date, phone_number, phone_local_code, external_id } = body

    // Primeiro, verificar se o usuário existe
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers()
    
    if (getUserError) {
      return NextResponse.json({ error: getUserError.message }, { status: 500 })
    }

    const existingUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
    let userId: string

    if (existingUser) {
      userId = existingUser.id
    } else {
      // Criar novo usuário
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        password: uuidv4(),
        user_metadata: {
          name: name
        }
      })

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 })
      }

      if (!newUser?.user) {
        return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
      }

      userId = newUser.user.id
    }

    // Verificar se o perfil existe
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    let profileData

    if (!existingProfile) {
      // Criar novo perfil
      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            name: name,
            is_premium: is_premium,
            expiration_date: expiration_date,
            phone_number: phone_number,
            phone_local_code: phone_local_code,
            external_id: external_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            email: email
          }
        ])
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 })
      }

      profileData = insertData
    } else {
      // Atualizar perfil existente
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          name: name,
          is_premium: is_premium,
          expiration_date: expiration_date,
          phone_number: phone_number,
          phone_local_code: phone_local_code,
          external_id: external_id,
          updated_at: new Date().toISOString(),
          email: email
        })
        .eq('id', userId)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }

      profileData = updateData
    }

    return NextResponse.json({ data: profileData })
  } catch (error: unknown) {
    console.error('Erro na API:', error)
    const apiError = error as ApiError
    return NextResponse.json(
      { error: apiError.message || 'Erro interno do servidor' }, 
      { status: 500 }
    )
  }
} 