'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

interface StatusMessage {
  text: string
  details?: string
  type: 'success' | 'error' | 'warning'
}

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [useRandomPhone, setUseRandomPhone] = useState(true)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    setLoading(true)
    setStatus(null)

    const formData = new FormData(form)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const months = parseInt(formData.get('months') as string) || 12

    // Gerar dados adicionais
    const randomPhone = Math.floor(Math.random() * 900000000 + 100000000).toString()
    const timestamp = Date.now()
    const uuid = uuidv4().split('-')[0]
    const externalId = `SEC_${timestamp}_${uuid}`

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          is_premium: true,
          expiration_date: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString(),
          phone_number: useRandomPhone ? randomPhone : phone.replace(/\D/g, ''),
          phone_local_code: '11',
          external_id: externalId
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        let errorMessage = 'Erro ao criar usuário'
        let errorDetails = ''

        switch (response.status) {
          case 400:
            errorMessage = 'Dados inválidos'
            errorDetails = data.error || 'Verifique os dados informados'
            break
          case 409:
            errorMessage = 'Usuário já existe'
            errorDetails = 'Este email já está cadastrado no sistema'
            break
          case 422:
            errorMessage = 'Dados incompletos'
            errorDetails = 'Todos os campos obrigatórios devem ser preenchidos'
            break
          case 500:
            errorMessage = 'Erro interno do servidor'
            errorDetails = 'Tente novamente mais tarde'
            break
          default:
            errorDetails = data.error || 'Ocorreu um erro inesperado'
        }

        setStatus({
          text: errorMessage,
          details: errorDetails,
          type: 'error'
        })
        return
      }

      form.reset()
      setUseRandomPhone(true)

      const expirationDate = new Date(data.data.expiration_date)
      setStatus({
        text: 'Usuário criado com sucesso!',
        details: `Acesso premium ativo até ${expirationDate.toLocaleDateString('pt-BR')}`,
        type: 'success'
      })
    } catch (error: any) {
      setStatus({
        text: 'Erro na operação',
        details: error.message,
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] min-h-screen bg-black text-white">
      <div className="row-start-2 flex items-center justify-center">
        <div className="w-full max-w-md mx-4">
          <div className="bg-zinc-900/50 backdrop-blur-sm p-8 rounded-lg shadow-2xl border border-zinc-800/50">
            <h1 className="text-3xl font-bold mb-8 text-center text-white">
              Adicionar Usuário Premium
            </h1>
            
            <div className="mb-6 text-sm text-zinc-400 text-center">
              O usuário será criado com acesso premium e dados personalizados
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-md 
                           text-white placeholder-zinc-500 focus:outline-none focus:ring-2 
                           focus:ring-white/25 focus:border-transparent transition-all duration-200"
                  placeholder="Digite o nome completo"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-md 
                           text-white placeholder-zinc-500 focus:outline-none focus:ring-2 
                           focus:ring-white/25 focus:border-transparent transition-all duration-200"
                  placeholder="Digite o email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Número de Telefone
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm text-zinc-400">
                    <input
                      type="checkbox"
                      checked={useRandomPhone}
                      onChange={(e) => setUseRandomPhone(e.target.checked)}
                      className="rounded border-zinc-700/50 bg-zinc-800/50 text-white focus:ring-white/25"
                    />
                    <span>Usar número aleatório</span>
                  </label>
                  
                  {!useRandomPhone && (
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      pattern="\d{8,9}"
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-md 
                               text-white placeholder-zinc-500 focus:outline-none focus:ring-2 
                               focus:ring-white/25 focus:border-transparent transition-all duration-200"
                      placeholder="Digite o número de telefone (8-9 dígitos)"
                    />
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="months" className="block text-sm font-medium text-zinc-300 mb-2">
                  Prazo de Acesso (meses)
                </label>
                <select
                  id="months"
                  name="months"
                  required
                  defaultValue="12"
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-md 
                           text-white placeholder-zinc-500 focus:outline-none focus:ring-2 
                           focus:ring-white/25 focus:border-transparent transition-all duration-200"
                >
                  <option value="1">1 mês</option>
                  <option value="3">3 meses</option>
                  <option value="6">6 meses</option>
                  <option value="12">12 meses</option>
                  <option value="24">24 meses</option>
                  <option value="36">36 meses</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 mt-8 bg-white/10 backdrop-blur-sm text-white font-medium 
                         rounded-md border border-white/10 hover:bg-white/20 focus:outline-none 
                         focus:ring-2 focus:ring-white/25 disabled:bg-zinc-800 disabled:cursor-not-allowed
                         transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </span>
                ) : (
                  'Adicionar Usuário Premium'
                )}
              </button>
            </form>

            {status && (
              <div className={`mt-6 p-4 rounded-md backdrop-blur-sm ${
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
          </div>
        </div>
      </div>
    </div>
  )
}
