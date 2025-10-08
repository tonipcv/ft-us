import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface ExportRow {
  id: string
  name: string | null
  email: string | null
  is_premium: boolean
  expiration_date: string | null
  phone_number: string | null
  phone_local_code: string | null
  external_id: string | null
  created_at: string | null
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = (searchParams.get('type') || 'all').toLowerCase()

  try {
    let query = supabase
      .from('profiles')
      .select(
        'id, name, email, is_premium, expiration_date, phone_number, phone_local_code, external_id, created_at'
      )
      .order('created_at', { ascending: false })

    if (type === 'premium') {
      query = query.eq('is_premium', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao exportar usuários:', error)
      return NextResponse.json({ error: 'Erro ao exportar usuários' }, { status: 500 })
    }

    const rows: ExportRow[] = (data as ExportRow[]) || []

    // CSV Header
    const header = [
      'id',
      'name',
      'email',
      'is_premium',
      'expiration_date',
      'phone_local_code',
      'phone_number',
      'external_id',
      'created_at',
    ]

    // Escape CSV field
    const escapeCsv = (value: unknown) => {
      if (value === null || value === undefined) return ''
      const s = String(value)
      if (/[",\n]/.test(s)) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }

    const csvLines = [
      header.join(','),
      ...rows.map((r: ExportRow) =>
        [
          r.id,
          r.name ?? '',
          r.email ?? '',
          r.is_premium ? 'true' : 'false',
          r.expiration_date ?? '',
          r.phone_local_code ?? '',
          r.phone_number ?? '',
          r.external_id ?? '',
          r.created_at ?? '',
        ]
          .map(escapeCsv)
          .join(',')
      ),
    ]

    const csv = csvLines.join('\n')

    const now = new Date()
    const dateStamp = new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .format(now)
      .replace(/[\/:\s]/g, '-')

    const filename = `usuarios-${type === 'premium' ? 'premium' : 'geral'}-${dateStamp}.csv`

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Erro ao gerar CSV:', error)
    return NextResponse.json({ error: 'Erro ao gerar CSV' }, { status: 500 })
  }
}
