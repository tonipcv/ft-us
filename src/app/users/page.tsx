'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface User {
  id: string
  email: string
  created_at: string
  profile?: {
    name: string
    is_premium: boolean
    expiration_date: string
    phone_number: string
    phone_local_code: string
    external_id: string
  }
}

interface StatusMessage {
  text: string
  details?: string
  type: 'success' | 'error' | 'warning'
}

interface PaginationInfo {
  total: number
  page: number
  per_page: number
}

function ProtectionScreen({ onAccess }: { onAccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (password === 'milionario27@') {
      onAccess()
    } else {
      setError('Código inválido')
      setPassword('')
    }
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] min-h-screen bg-black text-white">
      <div className="row-start-2 flex items-center justify-center">
        <div className="w-full max-w-md mx-4">
          <div className="bg-zinc-900/50 backdrop-blur-sm p-8 rounded-lg shadow-2xl border border-zinc-800/50">
            <h1 className="text-3xl font-bold mb-8 text-center text-white">
              Área Restrita
            </h1>
            
            <div className="mb-6 text-sm text-zinc-400 text-center">
              Digite o código de acesso para continuar
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
                  Código de Acesso
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-md 
                           text-white placeholder-zinc-500 focus:outline-none focus:ring-2 
                           focus:ring-white/25 focus:border-transparent transition-all duration-200"
                  placeholder="Digite o código de acesso"
                  autoComplete="off"
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 bg-white/10 backdrop-blur-sm text-white font-medium 
                         rounded-md border border-white/10 hover:bg-white/20 focus:outline-none 
                         focus:ring-2 focus:ring-white/25 transition-all duration-200"
              >
                Acessar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'premium' | 'normal'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    per_page: 25
  })

  useEffect(() => {
    try {
      const flag = typeof window !== 'undefined' ? localStorage.getItem('users_access') : null
      if (flag === '1') {
        setIsAuthenticated(true)
      }
    } catch {}
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.per_page.toString()
      })

      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter)
      }

      if (searchTerm.trim()) {
        queryParams.append('search', searchTerm.trim())
      }

      const response = await fetch(`/api/users?${queryParams.toString()}`, {
        method: 'GET',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar usuários')
      }

      setUsers(data.users)
      setPagination(prev => ({
        ...prev,
        total: data.total
      }))
    } catch (error) {
      setStatus({
        text: 'Erro ao carregar usuários',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.per_page, statusFilter, searchTerm])

  const handleExport = async (type: 'all' | 'premium') => {
    try {
      const res = await fetch(`/api/users/export?type=${type}`)
      if (!res.ok) {
        throw new Error('Falha ao gerar CSV')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `usuarios-${type}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setStatus({ text: 'Erro ao exportar CSV', details: err instanceof Error ? err.message : undefined, type: 'error' })
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers()
    }
  }, [isAuthenticated, fetchUsers])

  const handleDelete = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir usuário')
      }

      setStatus({
        text: 'Usuário excluído com sucesso',
        type: 'success'
      })

      // Recarregar a lista
      fetchUsers()
    } catch (error) {
      setStatus({
        text: 'Erro ao excluir usuário',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        type: 'error'
      })
    }
  }

  const handleEdit = async (user: User) => {
    setEditingUser(user)
  }

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingUser) return

    setEditLoading(true)
    const form = e.currentTarget
    const formData = new FormData(form)
    
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          is_premium: formData.get('is_premium') === 'true',
          expiration_date: formData.get('expiration_date'),
          phone_number: formData.get('phone_number')?.toString().replace(/\D/g, ''),
          phone_local_code: formData.get('phone_local_code')?.toString().replace(/\D/g, ''),
          external_id: formData.get('external_id')
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar usuário')
      }

      setStatus({
        text: 'Usuário atualizado com sucesso',
        type: 'success'
      })

      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      setStatus({
        text: 'Erro ao atualizar usuário',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        type: 'error'
      })
    } finally {
      setEditLoading(false)
    }
  }

  const totalPages = Math.ceil(pagination.total / pagination.per_page)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPagination(prev => ({
        ...prev,
        page: newPage
      }))
    }
  }

  if (!isAuthenticated) {
    return <ProtectionScreen onAccess={() => { try { localStorage.setItem('users_access', '1') } catch {} setIsAuthenticated(true) }} />
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page on search
                }}
                placeholder="Buscar usuários..."
                className="w-64 px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-md 
                         text-white placeholder-zinc-500 focus:outline-none focus:ring-2 
                         focus:ring-white/25 focus:border-transparent transition-all duration-200
                         pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'premium' | 'normal')
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-md 
                       text-white placeholder-zinc-500 focus:outline-none focus:ring-2 
                       focus:ring-white/25 focus:border-transparent transition-all duration-200"
            >
              <option value="all">Todos os Status</option>
              <option value="premium">Premium</option>
              <option value="normal">Normal</option>
            </select>
            <Link
              href="/"
              className="px-4 py-2 bg-white/10 rounded-md hover:bg-white/20 transition-all duration-200"
            >
              Adicionar Novo
            </Link>
            <Link
              href="/bulk-premium"
              className="px-4 py-2 bg-emerald-500/10 text-emerald-200 rounded-md hover:bg-emerald-500/20 transition-all duration-200"
            >
              Converter em Massa
            </Link>
            <button
              onClick={() => handleExport('premium')}
              className="px-4 py-2 bg-emerald-600/10 text-emerald-200 rounded-md hover:bg-emerald-600/20 transition-all duration-200"
            >
              Exportar Premium CSV
            </button>
            <button
              onClick={() => handleExport('all')}
              className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-all duration-200"
            >
              Exportar Geral CSV
            </button>
          </div>
        </div>

        {status && (
          <div className={`mb-6 p-4 rounded-md ${
            status.type === 'error'
              ? 'bg-red-500/10 border border-red-500/20 text-red-200'
              : status.type === 'warning'
              ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-200'
              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200'
          }`}>
            <div className="font-medium">{status.text}</div>
            {status.details && (
              <div className="mt-1 text-sm opacity-90">{status.details}</div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-zinc-800/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800/50">
                      <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">Nome</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">Expiração</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">Telefone</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">ID Externo</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-zinc-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-zinc-800/30">
                        <td className="px-6 py-4 text-sm">
                          {user.profile?.name || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {user.profile?.is_premium ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-200">
                              Premium
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {user.profile?.expiration_date ? 
                            new Date(user.profile.expiration_date).toLocaleDateString('pt-BR') : 
                            '-'
                          }
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {user.profile?.phone_number ? 
                            `(${user.profile.phone_local_code}) ${user.profile.phone_number}` : 
                            '-'
                          }
                        </td>
                        <td className="px-6 py-4 text-sm font-mono">
                          {user.profile?.external_id || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-1 text-zinc-400 hover:text-white transition-colors"
                              title="Editar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                              title="Excluir"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between px-4 py-3 bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-zinc-800/50">
              <div className="flex items-center text-sm text-zinc-400">
                <span>
                  Mostrando {((pagination.page - 1) * pagination.per_page) + 1} até{' '}
                  {Math.min(pagination.page * pagination.per_page, pagination.total)} de{' '}
                  {pagination.total} resultados
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`px-3 py-1 rounded-md text-sm ${
                    pagination.page === 1
                      ? 'bg-zinc-800/30 text-zinc-500 cursor-not-allowed'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  Anterior
                </button>
                
                <span className="px-4 py-1 text-sm text-zinc-400">
                  Página {pagination.page} de {totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= totalPages}
                  className={`px-3 py-1 rounded-md text-sm ${
                    pagination.page >= totalPages
                      ? 'bg-zinc-800/30 text-zinc-500 cursor-not-allowed'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  Próxima
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900/90 p-8 rounded-lg border border-zinc-800/50 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Editar Usuário</h2>
              <button
                onClick={() => setEditingUser(null)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingUser.profile?.name}
                  className="w-full px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-md 
                           text-white placeholder-zinc-500 focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Status
                </label>
                <select
                  name="is_premium"
                  required
                  defaultValue={editingUser.profile?.is_premium ? 'true' : 'false'}
                  className="w-full px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-md 
                           text-white focus:outline-none focus:ring-2"
                >
                  <option value="true">Premium</option>
                  <option value="false">Normal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Data de Expiração
                </label>
                <input
                  type="date"
                  name="expiration_date"
                  required
                  defaultValue={editingUser.profile?.expiration_date?.split('T')[0]}
                  className="w-full px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-md 
                           text-white focus:outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Telefone
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="phone_local_code"
                    required
                    maxLength={2}
                    defaultValue={editingUser.profile?.phone_local_code}
                    placeholder="DDD"
                    className="w-20 px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-md 
                             text-white placeholder-zinc-500 focus:outline-none focus:ring-2"
                  />
                  <input
                    type="text"
                    name="phone_number"
                    required
                    maxLength={9}
                    defaultValue={editingUser.profile?.phone_number}
                    placeholder="Número"
                    className="flex-1 px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-md 
                             text-white placeholder-zinc-500 focus:outline-none focus:ring-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  ID Externo
                </label>
                <input
                  type="text"
                  name="external_id"
                  required
                  defaultValue={editingUser.profile?.external_id}
                  className="w-full px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-md 
                           text-white placeholder-zinc-500 focus:outline-none focus:ring-2"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 py-2 px-4 bg-white/10 text-white rounded-md 
                           hover:bg-white/20 focus:outline-none focus:ring-2
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Salvando...
                    </span>
                  ) : (
                    'Salvar'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={editLoading}
                  className="flex-1 py-2 px-4 bg-zinc-800 text-zinc-300 rounded-md 
                           hover:bg-zinc-700 focus:outline-none focus:ring-2
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 