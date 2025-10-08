import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface ApiError {
  message: string;
  code?: string;
  details?: string;
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
}

// Criar cliente Supabase com a service role key (não usar a anon key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const email = searchParams.get('email')

  try {
    if (email) {
      // Busca direta por email usando o cliente supabase (o mesmo usado no POST)
      const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers()
      
      if (getUserError) {
        console.error('Erro ao listar usuários:', getUserError)
        return NextResponse.json({ error: 'Erro ao verificar usuário' }, { status: 500 })
      }

      const authUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
      
      if (!authUser) {
        return NextResponse.json({ users: [] })
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', profileError)
        return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 })
      }

      return NextResponse.json({
        users: [{
          id: authUser.id,
          email: authUser.email,
          profile: profile || null
        }]
      })
    }

    // Para listagem de usuários
    let query = supabase
      .from('profiles')
      .select('id, name, email, is_premium, expiration_date, phone_number, phone_local_code, external_id, created_at', { count: 'exact' })

    if (status) {
      query = query.eq('is_premium', status === 'premium')
    }

    if (search) {
      // Filter only on columns that exist in profiles to avoid errors.
      // If email search is required, we can extend to filter via auth_users on a follow-up change.
      query = query.or(`name.ilike.%${search}%,phone_number.ilike.%${search}%`)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
    }

    // Transformar os resultados para o formato esperado
    const users = data.map((profile: any) => ({
      id: profile.id,
      email: profile.email ?? null,
      profile: {
        name: profile.name,
        is_premium: profile.is_premium,
        expiration_date: profile.expiration_date,
        phone_number: profile.phone_number,
        phone_local_code: profile.phone_local_code,
        external_id: profile.external_id
      }
    }))

    return NextResponse.json({
      users,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json()
    const { name, email, is_premium, expiration_date, phone_number, phone_local_code, external_id } = body

    let userId: string

    try {
      // Tentar criar o usuário primeiro
      console.log('Tentando criar usuário:', email)
      const { data: authData, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { name }
      })

      if (createError) {
        if (createError.message?.includes('already been registered')) {
          // Se o usuário já existe, buscar na lista completa
          console.log('Usuário já existe, buscando na lista:', email)
          
          try {
            // Tentar buscar o usuário diretamente pelo email - note que isso pode falhar
            // se o email estiver em um case diferente, por isso é apenas uma otimização
            const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
            if (listError) throw listError

            const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
            
            if (existingUser) {
              // Encontrou o usuário, usar o ID
              userId = existingUser.id
              console.log('ID do usuário encontrado:', userId)
            } else {
              // Usuário existe mas não foi encontrado na lista
              // Vamos gerar um perfil mesmo assim, já que sabemos que o email existe
              console.log('Usuário existe mas não foi encontrado na lista. Gerando perfil direto.')
              
              // Verificar se já existe um perfil com esse email
              const { data: profileByEmail } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single()
                
              if (profileByEmail) {
                // Já existe um perfil com esse email, usar o ID dele
                userId = profileByEmail.id
                console.log('Encontrado perfil com o email:', email, 'ID:', userId)
              } else {
                // Criar um novo perfil com um UUID
                userId = uuidv4()
                console.log('Gerando UUID para novo perfil:', userId)
              }
            }
          } catch (err) {
            // Falha na busca, ainda vamos criar um perfil
            console.error('Erro ao buscar usuário:', err)
            userId = uuidv4()
            console.log('Erro na busca. Gerando UUID para novo perfil:', userId)
          }
        } else {
          throw createError
        }
      } else {
        userId = authData.user.id
        console.log('Novo usuário criado:', userId)
      }

      // Verificar se existe perfil com este ID
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (existingProfile) {
        // Atualizar perfil existente
        console.log('Atualizando perfil existente:', email)
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({
            name,
            is_premium,
            expiration_date,
            phone_number,
            phone_local_code,
            external_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single()

        if (updateError) {
          console.error('Erro ao atualizar perfil:', updateError)
          throw updateError
        }

        return NextResponse.json({
          success: true,
          data: updateData,
          action: 'updated',
          email
        })
      } else {
        // Criar novo perfil
        console.log('Criando novo perfil:', email)
        const { data: insertData, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            name,
            email,
            is_premium,
            expiration_date,
            phone_number,
            phone_local_code,
            external_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (insertError) {
          console.error('Erro ao criar perfil:', insertError)
          throw insertError
        }

        return NextResponse.json({
          success: true,
          data: insertData,
          action: 'created',
          email
        })
      }
    } catch (error) {
      console.error('Erro ao processar autenticação:', error)
      throw error
    }
  } catch (error) {
    console.error('Erro ao processar usuário:', error)
    return NextResponse.json({ 
      error: 'Erro ao processar usuário',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      email: body?.email 
    }, { status: 400 })
  }
} 