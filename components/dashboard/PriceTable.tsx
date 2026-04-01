'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, TrendingDown } from 'lucide-react';
import { mockPriceProducts } from '@/lib/mock-data';
import type { PriceProduct } from '@/lib/types';
import { SkeletonTableRow } from './SkeletonCards';

function formatPrice(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function StatusBadge({ status }: { status: PriceProduct['status'] }) {
  if (status === 'competitivo') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
        Competitivo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25">
      <TrendingDown className="w-3 h-3" />
      Risco de Preco
    </span>
  );
}

export default function PriceTable() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<PriceProduct[]>([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = () => {
    setTimeout(() => {
      setProducts(mockPriceProducts);
      setLastUpdated(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      setLoading(false);
      setRefreshing(false);
    }, 700);
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <div className="glass-card rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div>
          <h3 className="text-base font-semibold text-white">Monitor de Precos</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {lastUpdated ? `Atualizado as ${lastUpdated}` : 'Carregando...'}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-xs font-medium hover:bg-neon-cyan/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-white/2">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Produto</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Seu Preco</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Conc. A</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Conc. B</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Conc. C</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6}>
                    <SkeletonTableRow />
                  </td>
                </tr>
              ))
            ) : (
              products.map((product, idx) => {
                const minCompetitorPrice = Math.min(...product.competitors.map(c => c.price));
                return (
                  <tr
                    key={product.id}
                    className={`
                      border-b border-gray-800/50 transition-colors
                      ${idx === 0 ? 'bg-neon-cyan/3' : 'hover:bg-white/2'}
                    `}
                  >
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium text-gray-100 text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{product.category}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className={`font-semibold font-mono text-sm ${
                          product.status === 'risco' ? 'text-orange-400' : 'text-white'
                        }`}
                      >
                        {formatPrice(product.myPrice)}
                      </span>
                    </td>
                    {product.competitors.map((comp, ci) => {
                      const isCheaper = comp.price < product.myPrice;
                      const isLowest = comp.price === minCompetitorPrice;
                      return (
                        <td
                          key={ci}
                          className={`px-4 py-3.5 text-right font-mono text-sm ${
                            ci === 0 ? 'hidden sm:table-cell' : ci === 1 ? 'hidden md:table-cell' : 'hidden lg:table-cell'
                          }`}
                        >
                          <span
                            className={`
                              ${isCheaper ? 'text-red-400 font-medium' : 'text-gray-400'}
                              ${isLowest && isCheaper ? 'font-bold' : ''}
                            `}
                          >
                            {formatPrice(comp.price)}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={product.status} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {!loading && (
        <div className="px-5 py-3 border-t border-gray-800 bg-white/2">
          <p className="text-xs text-gray-500">
            <span className="text-red-400 font-medium">
              {products.filter(p => p.status === 'risco').length} produtos
            </span>{' '}
            com risco de preco alto vs. concorrentes.{' '}
            <span className="text-neon-cyan/70 font-medium">
              {products.filter(p => p.status === 'competitivo').length} competitivos.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
