import { X, ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from './Toast.jsx'
import { api } from '../api.js'
import { useNavigate } from 'react-router-dom'

const formatPrice = (price) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

export default function Cart() {
  const { items, removeItem, updateQty, total, count, isOpen, setIsOpen, clear } = useCart()
  const { user }     = useAuth()
  const { show }     = useToast()
  const navigate     = useNavigate()

  const handleCheckout = async () => {
    if (!user) {
      show('Faça login para finalizar o pedido', 'info')
      setIsOpen(false)
      navigate('/login')
      return
    }
    try {
      for (const item of items) {
        await api.createOrder({
          product_id:  item.id,
          quantity:    item.quantity,
          total_price: item.price * item.quantity,
        }, user.token)
      }
      show(`${items.length} pedido(s) realizados com sucesso!`, 'success')
      clear()
      setIsOpen(false)
      navigate('/orders')
    } catch (e) {
      show(e.message || 'Erro ao finalizar pedido', 'error')
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-violet-400" />
            </div>
            <h2 className="font-semibold text-white text-lg">Carrinho</h2>
            {count > 0 && (
              <span className="px-2 py-0.5 bg-violet-600 text-white text-xs rounded-full font-semibold">{count}</span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-slate-600" />
              </div>
              <div>
                <p className="text-slate-400 font-medium">Carrinho vazio</p>
                <p className="text-slate-600 text-sm mt-1">Adicione produtos para começar</p>
              </div>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex-shrink-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{item.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{item.name}</p>
                  <p className="text-violet-400 font-semibold text-sm">{formatPrice(item.price)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-md bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3 h-3 text-slate-300" />
                    </button>
                    <span className="text-white text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-md bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3 h-3 text-slate-300" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-auto p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">
                Subtotal ({count} {count === 1 ? 'item' : 'itens'})
              </span>
              <span className="text-white font-bold text-lg">{formatPrice(total)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
            >
              Finalizar Pedido
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  )
}
