import { ShoppingCart, Package } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from './Toast.jsx'

const GRADIENTS = [
  'from-violet-600 to-indigo-600',
  'from-rose-600 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-600 to-teal-600',
  'from-cyan-600 to-blue-600',
  'from-fuchsia-600 to-purple-600',
]

const formatPrice = (price) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const { show }    = useToast()

  const grad = GRADIENTS[product.id % GRADIENTS.length]

  const handleAdd = () => {
    addItem(product)
    show(`"${product.name}" adicionado ao carrinho!`, 'success')
  }

  return (
    <div className="group bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/50 flex flex-col">

      {/* Image / Gradient placeholder */}
      <div className={`h-48 bg-gradient-to-br ${grad} flex items-center justify-center relative overflow-hidden`}>
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, white 0%, transparent 60%)' }}
        />
        <Package className="w-16 h-16 text-white/30" />

        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
            <span className="text-sm font-semibold text-slate-300 bg-slate-800 px-3 py-1 rounded-full">Esgotado</span>
          </div>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute top-3 right-3 text-xs font-semibold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full">
            Últimas {product.stock}!
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-semibold text-white text-lg leading-tight mb-1 line-clamp-1">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-slate-500 mb-3 line-clamp-2 flex-1">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-800">
          <div>
            <span className="text-2xl font-bold text-white">{formatPrice(product.price)}</span>
            <p className="text-xs text-slate-500 mt-0.5">{product.stock} em estoque</p>
          </div>
          <button
            onClick={handleAdd}
            disabled={product.stock <= 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
              ${product.stock > 0
                ? `bg-gradient-to-r ${grad} text-white hover:opacity-90 hover:shadow-lg active:scale-95 shadow-md`
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Adicionar
          </button>
        </div>
      </div>
    </div>
  )
}
