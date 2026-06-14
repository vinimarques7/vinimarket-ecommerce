import { useState, useEffect, useCallback } from 'react'
import { Package, Clock, ShoppingBag, ChevronDown, Trash2, CheckSquare, Square, AlertTriangle } from 'lucide-react'
import { api }       from '../api.js'
import { useAuth }   from '../context/AuthContext.jsx'
import { useToast }  from '../components/Toast.jsx'

const formatDate = (str) =>
  new Date(str + 'Z').toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })

const formatPrice = (p) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p)

export default function Orders() {
  const [orders,    setOrders]    = useState([])
  const [products,  setProducts]  = useState({})  // id → product
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState(new Set())
  const [selected,  setSelected]  = useState(new Set())
  const [deleting,  setDeleting]  = useState(false)
  const [confirmIds, setConfirmIds] = useState(null) // ids to confirm delete
  const { user }  = useAuth()
  const { show }  = useToast()

  const loadOrders = useCallback(() => {
    if (!user) return
    setLoading(true)
    api.getUserOrders(user.userId, user.token)
      .then(setOrders)
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    loadOrders()
    api.getProducts().then(list => {
      const map = {}
      list.forEach(p => { map[p.id] = p })
      setProducts(map)
    }).catch(() => {})
  }, [loadOrders])

  const toggleExpand = (id) => setExpanded(prev => {
    const s = new Set(prev)
    s.has(id) ? s.delete(id) : s.add(id)
    return s
  })

  const toggleSelect = (id) => setSelected(prev => {
    const s = new Set(prev)
    s.has(id) ? s.delete(id) : s.add(id)
    return s
  })

  const toggleSelectAll = () => {
    setSelected(prev => prev.size === orders.length ? new Set() : new Set(orders.map(o => o.id)))
  }

  const handleDelete = async (ids) => {
    setDeleting(true)
    setConfirmIds(null)
    try {
      await Promise.all(ids.map(id => api.deleteOrder(id, user.token)))
      show(`${ids.length} pedido(s) excluído(s)`, 'success')
      setSelected(new Set())
      loadOrders()
    } catch (e) {
      show(e.message || 'Erro ao excluir', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const allSelected = orders.length > 0 && selected.size === orders.length

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Meus Pedidos</h1>
            <p className="text-slate-500 text-sm">Histórico completo das suas compras</p>
          </div>
        </div>

        {/* Bulk delete bar */}
        {selected.size > 0 && (
          <button
            onClick={() => setConfirmIds([...selected])}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Excluir selecionados ({selected.size})
          </button>
        )}
      </div>

      {/* Confirm modal */}
      {confirmIds && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <h3 className="font-semibold text-white">Confirmar exclusão</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              Excluir {confirmIds.length} pedido(s)? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmIds(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmIds)}
                className="flex-1 py-2 bg-red-500 hover:bg-red-400 text-white rounded-xl text-sm font-semibold transition-all"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center">
            <Package className="w-8 h-8 text-slate-700" />
          </div>
          <div>
            <p className="text-slate-400 font-medium">Nenhum pedido ainda</p>
            <p className="text-slate-600 text-sm mt-1">Seus pedidos aparecerão aqui após a compra</p>
          </div>
        </div>
      ) : (
        <>
          {/* Select all row */}
          <div className="flex items-center gap-3 px-2 mb-2">
            <button onClick={toggleSelectAll} className="text-slate-500 hover:text-violet-400 transition-colors">
              {allSelected
                ? <CheckSquare className="w-4 h-4 text-violet-400" />
                : <Square className="w-4 h-4" />}
            </button>
            <span className="text-xs text-slate-600">
              {selected.size > 0 ? `${selected.size} selecionado(s)` : 'Selecionar todos'}
            </span>
          </div>

          <div className="space-y-2">
            {orders.map(order => {
              const product  = products[order.product_id]
              const isOpen   = expanded.has(order.id)
              const isChecked = selected.has(order.id)

              return (
                <div
                  key={order.id}
                  className={`bg-slate-900 rounded-2xl border transition-all ${
                    isChecked ? 'border-violet-500/40' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Row */}
                  <div className="flex items-center gap-3 p-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(order.id)}
                      className="text-slate-500 hover:text-violet-400 transition-colors flex-shrink-0"
                    >
                      {isChecked
                        ? <CheckSquare className="w-4 h-4 text-violet-400" />
                        : <Square className="w-4 h-4" />}
                    </button>

                    {/* Thumbnail */}
                    <div
                      className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center cursor-pointer"
                      onClick={() => toggleExpand(order.id)}
                    >
                      {product?.image_url
                        ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        : <Package className="w-4 h-4 text-white/60" />}
                    </div>

                    {/* Info — click to expand */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => toggleExpand(order.id)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white text-sm">Pedido #{order.id}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          order.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {order.status === 'pending' ? 'Pendente' : 'Concluído'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {product ? product.name : `Produto #${order.product_id}`}
                        {' · '}Qtd: {order.quantity}
                        {order.total_price ? ` · ${formatPrice(order.total_price)}` : ''}
                      </p>
                    </div>

                    {/* Date + actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="hidden sm:flex items-center gap-1 text-slate-600 text-xs">
                        <Clock className="w-3 h-3" />
                        {formatDate(order.created_at)}
                      </div>
                      <button
                        onClick={() => setConfirmIds([order.id])}
                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Excluir pedido"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleExpand(order.id)}
                        className="p-1.5 text-slate-600 hover:text-slate-300 transition-all"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded product details */}
                  {isOpen && (
                    <div className="border-t border-slate-800 px-4 pb-4 pt-3 ml-7">
                      {product ? (
                        <div className="flex gap-3 items-start">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-20 h-20 rounded-xl object-cover flex-shrink-0 bg-slate-800"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm">{product.name}</p>
                            {product.category && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-violet-500/15 text-violet-400 border border-violet-500/20 rounded mr-1">
                                {product.category}
                              </span>
                            )}
                            {product.description && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                              <span>Quantidade: <span className="text-white font-semibold">{order.quantity}</span></span>
                              <span>Unitário: <span className="text-white font-semibold">{formatPrice(product.price)}</span></span>
                              <span>Total: <span className="text-violet-400 font-semibold">{formatPrice(product.price * order.quantity)}</span></span>
                            </div>
                            {product.specifications && typeof product.specifications === 'object' && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {Object.entries(product.specifications).slice(0, 4).map(([k, v]) => (
                                  <span key={k} className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
                                    <span className="text-slate-600">{k}:</span> {v}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">Detalhes do produto não disponíveis.</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}


const formatDate = (str) =>
  new Date(str + 'Z').toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })

export default function Orders() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const { user }  = useAuth()
  const { show }  = useToast()

  useEffect(() => {
    if (!user) return
    api.getUserOrders(user.userId, user.token)
      .then(setOrders)
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Meus Pedidos</h1>
          <p className="text-slate-500 text-sm">Histórico completo das suas compras</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center">
            <Package className="w-8 h-8 text-slate-700" />
          </div>
          <div>
            <p className="text-slate-400 font-medium">Nenhum pedido ainda</p>
            <p className="text-slate-600 text-sm mt-1">Seus pedidos aparecerão aqui após a compra</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div
              key={order.id}
              className="flex items-center gap-4 p-5 bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold text-white">Pedido #{order.id}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    order.status === 'pending'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {order.status === 'pending' ? 'Pendente' : 'Concluído'}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  Produto #{order.product_id} · Qtd: {order.quantity}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-slate-500 text-xs">
                  <Clock className="w-3 h-3" />
                  {formatDate(order.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
