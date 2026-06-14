import { useState, useEffect, useCallback } from 'react'
import {
  Activity, CheckCircle, XCircle, Clock, RefreshCw,
  Server, AlertTriangle, Wifi, WifiOff, Package, Tag,
} from 'lucide-react'
import { api } from '../api.js'

const SERVICE_META = {
  gateway:  { label: 'API Gateway',  port: '8000', color: 'violet' },
  users:    { label: 'Usuários',     port: '5001', color: 'blue'   },
  products: { label: 'Produtos',     port: '5002', color: 'emerald'},
  orders:   { label: 'Pedidos',      port: '5003', color: 'amber'  },
}

const LEVEL_STYLE = {
  DOWN:     'text-red-400 bg-red-500/10 border-red-500/30',
  WARN:     'text-amber-400 bg-amber-500/10 border-amber-500/30',
  RECOVERY: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  INFO:     'text-slate-400 bg-slate-500/10 border-slate-500/30',
}

const formatTs = (ts) => {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

export default function Status() {
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [countdown,  setCountdown]  = useState(5)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [products,   setProducts]   = useState([])
  const [prodLoading, setProdLoading] = useState(true)

  const fetchProducts = useCallback(() => {
    setProdLoading(true)
    api.getProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setProdLoading(false))
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const json = await api.getStatus()
      setData(json)
      setError(null)
      setLastUpdate(new Date())
      setCountdown(5)
    } catch (e) {
      setError('Não foi possível conectar ao gateway')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    fetchProducts()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [fetchStatus, fetchProducts])

  useEffect(() => {
    if (!lastUpdate) return
    const t = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [lastUpdate])

  // Build services map including gateway itself
  // Gateway returns "online"/"offline" string — normalize to object shape
  const gatewayObj = data
    ? (typeof data.gateway === 'string'
        ? { healthy: data.gateway === 'online', last_check: data.timestamp, last_seen: data.gateway === 'online' ? data.timestamp : null }
        : data.gateway)
    : null
  const allServices = data
    ? { gateway: gatewayObj, ...Object.fromEntries(Object.entries(data.services).filter(([k]) => k !== 'products-replica')) }
    : {}

  const totalServices = Object.keys(allServices).length
  const healthyCount  = Object.values(allServices).filter(s => s?.healthy).length
  const allOk = totalServices > 0 && healthyCount === totalServices

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${allOk ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            <Activity className={`w-5 h-5 ${allOk ? 'text-emerald-400' : 'text-red-400'}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Status da API</h1>
            <p className="text-slate-500 text-sm">Monitoramento em tempo real dos microsserviços</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-slate-500">
              Atualiza em <span className="text-slate-300 font-medium">{countdown}s</span>
            </span>
          )}
          <button
            onClick={() => { fetchStatus(); fetchProducts() }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-all border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </button>
        </div>
      </div>

      {/* Overall badge */}
      {!loading && !error && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border mb-6 ${
          allOk
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          {allOk
            ? <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            : <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />}
          <span className={`font-semibold ${allOk ? 'text-emerald-300' : 'text-red-300'}`}>
            {allOk
              ? `Todos os ${totalServices} serviços operacionais`
              : `${healthyCount} de ${totalServices} serviços operacionais`}
          </span>
          {lastUpdate && (
            <span className="ml-auto text-xs text-slate-500">
              Última verificação: {lastUpdate.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
            </span>
          )}
        </div>
      )}

      {/* Error state — só mostra tela cheia se não há dados ainda */}
      {error && !data && (
        <div className="flex items-center gap-3 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl mb-6">
          <WifiOff className="w-6 h-6 text-red-400" />
          <div>
            <p className="text-red-300 font-semibold">Gateway inacessível</p>
            <p className="text-slate-500 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}
      {/* Aviso discreto quando falha mas ainda há dados antigos */}
      {error && data && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4 text-xs text-amber-400">
          <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
          Falha ao atualizar — exibindo última leitura conhecida
        </div>
      )}

      {/* Service cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-36 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(SERVICE_META).map(([key, meta]) => {
            const svc = allServices[key]
            const ok  = svc?.healthy ?? false
            return (
              <div
                key={key}
                className={`bg-slate-900 rounded-2xl border p-5 transition-all ${
                  ok ? 'border-slate-800 hover:border-slate-700' : 'border-red-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Server className="w-4 h-4 text-slate-500" />
                  {ok
                    ? <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30"><Wifi className="w-3 h-3"/>Online</span>
                    : <span className="flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full border border-red-500/30"><WifiOff className="w-3 h-3"/>Offline</span>
                  }
                </div>
                <p className="font-semibold text-white text-sm">{meta.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">:{meta.port}</p>
                <div className="mt-3 pt-3 border-t border-slate-800">
                  {svc?.failures > 0 && (
                    <p className="text-xs text-amber-400">{svc.failures} falha{svc.failures > 1 ? 's' : ''}</p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-slate-600 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatTs(svc?.last_check)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Heartbeat log */}
      <div>
        <h2 className="font-semibold text-white text-lg mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-400" />
          Log de Heartbeat
          {data?.log && <span className="text-xs text-slate-500 font-normal">({data.log.length} eventos)</span>}
        </h2>

        {!data?.log?.length ? (
          <div className="flex items-center gap-3 p-5 bg-slate-900 rounded-2xl border border-slate-800">
            <CheckCircle className="w-5 h-5 text-slate-600" />
            <p className="text-slate-500 text-sm">Nenhum evento registrado ainda. Os logs aparecerão após o heartbeat detectar mudanças de estado.</p>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Horário</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Nível</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {data.log.map((entry, i) => (
                  <tr key={i} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap font-mono">
                      {formatTs(entry.ts)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${LEVEL_STYLE[entry.level] || LEVEL_STYLE.INFO}`}>
                        {entry.level}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-300 text-xs">{entry.msg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Products */}
      <div className="mt-8">
        <h2 className="font-semibold text-white text-lg mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-violet-400" />
          Produtos Cadastrados
          {!prodLoading && (
            <span className="text-xs text-slate-500 font-normal">({products.length} {products.length === 1 ? 'produto' : 'produtos'})</span>
          )}
        </h2>

        {prodLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-900 rounded-xl animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex items-center gap-3 p-5 bg-slate-900 rounded-2xl border border-slate-800">
            <Package className="w-5 h-5 text-slate-600" />
            <p className="text-slate-500 text-sm">Nenhum produto cadastrado.</p>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">ID</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs">Produto</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-xs hidden sm:table-cell">Categoria</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium text-xs">Preço</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium text-xs">Estoque</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-2.5 text-slate-600 text-xs font-mono">#{p.id}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0 bg-slate-800"
                            onError={e => { e.currentTarget.style.display = 'none' }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4 text-slate-600" />
                          </div>
                        )}
                        <span className="text-white font-medium text-xs truncate max-w-[180px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      {p.category ? (
                        <span className="inline-flex items-center gap-1 text-xs text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded-full">
                          <Tag className="w-2.5 h-2.5" />{p.category}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-emerald-400 text-xs font-semibold whitespace-nowrap">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`text-xs font-semibold ${p.stock > 0 ? 'text-slate-300' : 'text-red-400'}`}>
                        {p.stock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
