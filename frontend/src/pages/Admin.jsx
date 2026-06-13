import { useState, useEffect } from 'react'
import { Plus, Package, DollarSign, Archive, LayoutDashboard } from 'lucide-react'
import { api }      from '../api.js'
import { useAuth }  from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'

const formatPrice = (price) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

const GRADIENTS = [
  'from-violet-600 to-indigo-600',
  'from-rose-600 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-600 to-teal-600',
  'from-cyan-600 to-blue-600',
  'from-fuchsia-600 to-purple-600',
]

export default function Admin() {
  const [products,   setProducts]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form,       setForm]       = useState({ name: '', description: '', price: '', stock: '' })
  const { user }  = useAuth()
  const { show }  = useToast()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const loadProducts = () => {
    setLoading(true)
    api.getProducts()
      .then(setProducts)
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProducts() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.createProduct({
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
      }, user.token)
      show('Produto criado com sucesso!', 'success')
      setForm({ name: '', description: '', price: '', stock: '' })
      loadProducts()
    } catch (err) {
      show(err.message || 'Erro ao criar produto', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const totalValue = products.reduce((acc, p) => acc + p.price * p.stock, 0)

  const inputCls = "w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Painel Admin</h1>
          <p className="text-slate-500 text-sm">Gerencie os produtos da loja</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total de Produtos', value: products.length, icon: Package, color: 'violet' },
          { label: 'Total em Estoque',  value: products.reduce((a, p) => a + p.stock, 0), icon: Archive, color: 'emerald' },
          { label: 'Valor do Estoque',  value: formatPrice(totalValue), icon: DollarSign, color: 'amber' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
                <Icon className={`w-4 h-4 text-${color}-400`} />
              </div>
              <span className="text-slate-500 text-sm">{label}</span>
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sticky top-20">
            <h2 className="font-semibold text-white text-lg mb-5 flex items-center gap-2">
              <Plus className="w-5 h-5 text-violet-400" /> Novo Produto
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Nome *</label>
                <input type="text" required value={form.name} onChange={set('name')} placeholder="Nome do produto" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Descrição opcional"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Preço (R$) *</label>
                  <input type="number" required min="0.01" step="0.01" value={form.price} onChange={set('price')} placeholder="0,00" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Estoque *</label>
                  <input type="number" required min="0" value={form.stock} onChange={set('stock')} placeholder="0" className={inputCls} />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 text-sm"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Plus className="w-4 h-4" /> Criar Produto</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Products list */}
        <div className="lg:col-span-3">
          <h2 className="font-semibold text-white text-lg mb-4">Produtos cadastrados</h2>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Package className="w-8 h-8 text-slate-700" />
              <p className="text-slate-600 text-sm">Nenhum produto ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map(p => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${GRADIENTS[p.id % GRADIENTS.length]} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold text-sm">{p.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{p.name}</p>
                    {p.description && (
                      <p className="text-xs text-slate-500 truncate">{p.description}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-white text-sm">{formatPrice(p.price)}</p>
                    <p className="text-xs text-slate-500">{p.stock} em estoque</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
