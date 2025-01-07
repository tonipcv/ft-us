'use client'

import { useState, useEffect } from 'react'

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

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers()
    }
  }, [isAuthenticated])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'GET',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar usuários')
      }

      setUsers(data.users)
    } catch (error) {
      setStatus({
        text: 'Erro ao carregar usuários',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return <ProtectionScreen onAccess={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
          <a
            href="/"
            className="px-4 py-2 bg-white/10 rounded-md hover:bg-white/20 transition-all duration-200"
          >
            Adicionar Novo
          </a>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 