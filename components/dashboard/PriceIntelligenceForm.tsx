'use client'

import { useState, useTransition } from 'react'
import { Search, TrendingDown, TrendingUp, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { runPriceIntelligenceAction } from '@/actions/price-intelligence'

interface PriceResult {
  alert: string | null
  alertMessage: string
  priceDiffPercent: number | null
  savedAlerts: number
  competitors: Array<{ name: string; url: string; price: number | null; status: string }>
}

export default function PriceIntelligenceForm({ adAccountId }: { adAccountId: string }) {
  const [myPrice, setMyPrice] = useState('')
  const [productName, setProductName] = useState('')
  const [result, setResult] = useState<PriceResult | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!adAccountId) {
      setError('Nenhuma conta de anúncio encontrada.')
      return
    }

    startTransition(async () => {
      const res = await runPriceIntelligenceAction(adAccountId, parseFloat(myPrice), productName)
      if (res.success && res.data) {
        setResult(res.data as unknown as PriceResult)
      } else {
        setError(res.error ?? 'Erro ao executar Price Intelligence.')
      }
    })
  }

  return (
    <div className="glass-card rounded-xl p-5 border border-gray-800">
      <h3 className="text-sm font-semibold text-white mb-1">Executar Coleta de Preços</h3>
      <p className="text-xs text-gray-500 mb-4">
        Informe seu preço e o produto. A IA visita os sites dos concorrentes cadastrados e compara.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          required
          placeholder="Nome do produto (ex: Tênis Air Max 90)"
          value={productName}
          onChange={e => setProductName(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan/50"
        />
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0,00"
              value={myPrice}
              onChange={e => setMyPrice(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan/50"
            />
          </div>
          <button
            type="submit"
            disabled={isPending || !myPrice || !productName}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neon-cyan text-gray-950 font-semibold text-sm hover:bg-neon-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {isPending ? 'Coletando...' : 'Coletar'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-5 space-y-3">
          {/* Alert banner */}
          {result.alert === 'HIGH_PRICE_RISK' ? (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-400">Risco de Preço Alto</p>
                <p className="text-xs text-red-400/70 mt-0.5">{result.alertMessage}</p>
                {result.priceDiffPercent && (
                  <p className="text-xs text-red-300 mt-1 font-mono">
                    Seu preço está {result.priceDiffPercent.toFixed(1)}% acima do concorrente mais barato
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-400">Preço Competitivo</p>
                <p className="text-xs text-green-400/70 mt-0.5">{result.alertMessage}</p>
              </div>
            </div>
          )}

          {/* Resultados por concorrente */}
          {result.competitors.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400">Preços coletados:</p>
              {result.competitors.map((comp, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/3 border border-gray-800">
                  <div>
                    <p className="text-xs font-medium text-gray-300">{comp.name}</p>
                    <p className="text-xs text-gray-600 font-mono truncate max-w-[150px]">{comp.url}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {comp.price !== null ? (
                      <>
                        {comp.price < parseFloat(myPrice)
                          ? <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                          : <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                        }
                        <span className={`text-sm font-bold font-mono ${comp.price < parseFloat(myPrice) ? 'text-red-400' : 'text-green-400'}`}>
                          R$ {comp.price.toFixed(2).replace('.', ',')}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-600">Não encontrado</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
