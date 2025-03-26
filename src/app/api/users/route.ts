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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const per_page = parseInt(searchParams.get('per_page') || '25')
    const status = searchParams.get('status') // 'premium', 'normal', or null for all
    const search = searchParams.get('search')?.toLowerCase() // Novo parâmetro de busca

    // Buscar todos os usuários paginando até obter todos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allUsers: any[] = []
    let currentPage = 0
    let hasMore = true

    while (hasMore) {
      const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers({
        page: currentPage,
        perPage: 1000 // Máximo permitido pelo Supabase
      })
      
      if (getUserError) {
        return NextResponse.json({ error: getUserError.message }, { status: 500 })
      }

      if (!users || users.length === 0) {
        hasMore = false
      } else {
        allUsers = [...allUsers, ...users]
        currentPage++
      }
    }

    if (allUsers.length === 0) {
      return NextResponse.json({ users: [], total: 0 })
    }

    // Buscar todos os perfis
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Aplicar busca se houver termo de pesquisa
    let filteredUsers = allUsers
    if (search) {
      filteredUsers = allUsers.filter(user => {
        const userProfile = profiles?.find(profile => profile.id === user.id)
        const searchableFields = [
          user.email?.toLowerCase(),
          userProfile?.name?.toLowerCase(),
          userProfile?.external_id?.toLowerCase(),
          userProfile?.phone_number
        ]
        return searchableFields.some(field => field?.includes(search))
      })
    }

    // Filtrar usuários com base no status
    if (status) {
      filteredUsers = filteredUsers.filter(user => {
        const userProfile = profiles?.find(profile => profile.id === user.id)
        if (status === 'premium') {
          return userProfile?.is_premium === true
        } else if (status === 'normal') {
          return userProfile?.is_premium === false || !userProfile
        }
        return true
      })
    }

    // Aplicar paginação manualmente
    const totalUsers = filteredUsers.length
    const start = (page - 1) * per_page
    const end = start + per_page
    const paginatedUsers = filteredUsers.slice(start, end)

    // Obter IDs dos usuários paginados
    const userIds = paginatedUsers.map(user => user.id)
    
    // Buscar perfis específicos para os usuários paginados
    // Isso garante que encontraremos os perfis mesmo que estejam além dos primeiros 1000
    const { data: specificProfiles, error: specificProfileError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds)
    
    if (specificProfileError) {
      console.error('Erro ao buscar perfis específicos:', specificProfileError)
    }
    
    // Combinar usuários paginados com seus perfis
    // Primeiro tentamos encontrar no conjunto específico de perfis
    // Se não encontrarmos, tentamos no conjunto geral de perfis
    const usersWithProfiles = paginatedUsers.map(user => {
      const specificProfile = specificProfiles?.find(profile => profile.id === user.id)
      const generalProfile = profiles?.find(profile => profile.id === user.id)
      
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        profile: specificProfile || generalProfile
      }
    })

    return NextResponse.json({ 
      users: usersWithProfiles,
      total: totalUsers
    })
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