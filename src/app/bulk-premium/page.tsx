'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

interface Student {
  name: string
  email: string
  phone: string
  enrollment_date: string
}

interface ProcessingDetail {
  email: string
  status: 'success' | 'error'
  message: string
}

interface Results {
  total: number
  success: number
  error: number
  details: ProcessingDetail[]
}

interface CSVColumn {
  header: string
  sampleValue: string
}

interface ColumnMapping {
  name: string
  email: string
  phone: string
  enrollment_date: string
}

export default function BulkPremiumPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progressText, setProgressText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<Results | null>(null)
  const [csvColumns, setCsvColumns] = useState<CSVColumn[]>([])
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    name: '',
    email: '',
    phone: '',
    enrollment_date: ''
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const isAllMapped = Boolean(
    columnMapping.name && 
    columnMapping.email && 
    columnMapping.phone && 
    columnMapping.enrollment_date
  )
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setSelectedFile(file)
    setError(null)
    setResults(null)
    
    try {
      const text = await file.text()
      const lines = text.split('\n')
      
      if (lines.length < 2) {
        throw new Error('O arquivo CSV deve conter pelo menos um cabeçalho e uma linha de dados')
      }
      
      // Log para debug
      console.log('Conteúdo do CSV:', text)
      
      const headers = lines[0].split(',').map(h => h.trim())
      const sampleLine = lines[1].split(',').map(v => v.trim())
      
      // Log para debug
      console.log('Headers encontrados:', headers)
      console.log('Valores de exemplo:', sampleLine)
      
      setCsvColumns(headers.map((header, index) => ({
        header: header,
        sampleValue: sampleLine[index] || ''
      })))
      
      // Resetar apenas o mapeamento de email
      setColumnMapping(prev => ({
        ...prev,
        email: ''
      }))
    } catch (error) {
      console.error('Erro ao ler arquivo:', error)
      setError('Erro ao ler o arquivo CSV. Certifique-se de que é um arquivo CSV válido.')
      setSelectedFile(null)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!selectedFile || !columnMapping.email) {
      setError('Por favor, selecione um arquivo e mapeie a coluna de email.')
      return
    }

    setIsProcessing(true)
    setError(null)
    setResults(null)
    
    try {
      const text = await selectedFile.text()
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      
      // Log para debug
      console.log('Headers no submit:', headers)
      console.log('Mapeamento selecionado:', columnMapping)
      
      // Obter índice da coluna de email
      const emailIndex = headers.indexOf(columnMapping.email)
      console.log('Índice do email:', emailIndex)
      
      if (emailIndex === -1) {
        throw new Error('Coluna de email não encontrada')
      }
      
      const emails = lines
        .slice(1)
        .filter(line => line.trim())
        .map(line => {
          const columns = line.split(',').map(c => c.trim())
          return columns[emailIndex]
        })
        .filter(email => email) // Remover emails vazios
      
      // Log para debug
      console.log('Emails encontrados:', emails)
      
      let processed = 0
      let successCount = 0
      let errorCount = 0
      const processingDetails: ProcessingDetail[] = []
      
      setProgressText(`Processando ${emails.length} emails...`)
      
      for (const email of emails) {
        try {
          // Enviar para API
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email.trim(),
              is_premium: true,
              expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || data.details || 'Erro desconhecido')
          }

          processingDetails.push({
            email: email,
            status: 'success',
            message: `${data.action === 'created' ? 'Criado' : 'Atualizado'} com sucesso`
          })
          successCount++
        } catch (error) {
          processingDetails.push({
            email: email,
            status: 'error',
            message: error instanceof Error ? error.message : 'Erro desconhecido'
          })
          errorCount++
        }

        processed++
        setProgressText(`Processando ${processed}/${emails.length} emails...`)
      }
      
      setResults({
        total: emails.length,
        success: successCount,
        error: errorCount,
        details: processingDetails
      })
    } catch (error) {
      console.error('Erro no processamento:', error)
      setError(error instanceof Error ? error.message : 'Erro ao processar o arquivo')
    } finally {
      setIsProcessing(false)
      setProgressText('')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Converter Alunos em Massa</h1>
          <Link
            href="/users"
            className="px-4 py-2 bg-white/10 rounded-md hover:bg-white/20 transition-all duration-200"
          >
            Voltar para Lista
          </Link>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-zinc-800/50 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Arquivo CSV
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-zinc-400
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-md file:border-0
                         file:text-sm file:font-medium
                         file:bg-white/10 file:text-white
                         file:cursor-pointer
                         hover:file:bg-white/20"
              />
              <p className="mt-2 text-sm text-zinc-400">
                O arquivo deve ser um CSV contendo uma coluna com os emails.
              </p>
            </div>

            {csvColumns.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Selecione a Coluna de Email</h3>
                <div>
                  <select
                    value={columnMapping.email}
                    onChange={(e) => setColumnMapping(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-md 
                             text-white focus:outline-none focus:ring-2"
                  >
                    <option value="">Selecione a coluna</option>
                    {csvColumns.map((col, index) => (
                      <option key={index} value={col.header}>
                        {col.header} (ex: {col.sampleValue})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedFile || !columnMapping.email || isProcessing}
              className="w-full py-3 px-4 bg-emerald-500/10 text-emerald-200 rounded-md
                       border border-emerald-500/20 hover:bg-emerald-500/20
                       focus:outline-none focus:ring-2 focus:ring-emerald-500/40
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {progressText || 'Processando...'}
                </span>
              ) : (
                'Processar Arquivo'
              )}
            </button>
          </form>

          {results && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-800/30 rounded-md">
                  <div className="text-2xl font-bold">{results.total}</div>
                  <div className="text-sm text-zinc-400">Total</div>
                </div>
                <div className="p-4 bg-emerald-500/10 rounded-md">
                  <div className="text-2xl font-bold text-emerald-200">{results.success}</div>
                  <div className="text-sm text-emerald-200/70">Sucessos</div>
                </div>
                <div className="p-4 bg-red-500/10 rounded-md">
                  <div className="text-2xl font-bold text-red-200">{results.error}</div>
                  <div className="text-sm text-red-200/70">Erros</div>
                </div>
              </div>

              <div className="space-y-2">
                {results.details.map((detail, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-md ${
                      detail.status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-200'
                        : 'bg-red-500/10 text-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{detail.email}</div>
                      <div className="text-sm opacity-90">{detail.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 