import { useState, useEffect } from 'react'
import { Package, Clock, ShoppingBag } from 'lucide-react'
import { api }       from '../api.js'
import { useAuth }   from '../context/AuthContext.jsx'
import { useToast }  from '../components/Toast.jsx'

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
