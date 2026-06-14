import { useState, useEffect } from 'react'
import { Plus, Package, DollarSign, Archive, LayoutDashboard, Image, Tag, FileText, Pencil, X } from 'lucide-react'
import { api }      from '../api.js'
import { useAuth }  from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { CATEGORIES } from '../constants.js'

const formatPrice = (price) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

const GRADIENTS = [
  'from-violet-600 to-indigo-600', 'from-rose-600 to-pink-600',
  'from-amber-500 to-orange-600',  'from-emerald-600 to-teal-600',
  'from-cyan-600 to-blue-600',     'from-fuchsia-600 to-purple-600',
]

const parseSpecs = (text) => {
  if (!text.trim()) return null
  const result = {}
  text.split('\n').forEach(line => {
    const idx = line.indexOf(':')
    if (idx > 0) {
      const key = line.slice(0, idx).trim()
      const val = line.slice(idx + 1).trim()
      if (key && val) result[key] = val
    }
  })
  return Object.keys(result).length ? result : null
}

const EMPTY_FORM = { name: '', description: '', price: '', stock: '', image_url: '', category: '', specifications: '' }

export default function Admin() {
  const [products,   setProducts]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [imgError,   setImgError]   = useState(false)
  const [editingId,  setEditingId]  = useState(null)  // null = criar, number = editar
  const { user }  = useAuth()
  const { show }  = useToast()

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); if (k === 'image_url') setImgError(false) }

  const loadProducts = () => {
    setLoading(true)
    api.getProducts()
      .then(setProducts)
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProducts() }, [])

  const specsToText = (specs) => {
    if (!specs || typeof specs !== 'object') return ''
    return Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join('\n')
  }

  const startEdit = (p) => {
    setEditingId(p.id)
    setImgError(false)
    setForm({
      name:           p.name           || '',
      description:    p.description    || '',
      price:          p.price          ?? '',
      stock:          p.stock          ?? '',
      image_url:      p.image_url      || '',
      category:       p.category       || '',
      specifications: specsToText(p.specifications),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setImgError(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const payload = {
      name:           form.name,
      description:    form.description || null,
      price:          parseFloat(form.price),
      stock:          parseInt(form.stock, 10),
      image_url:      form.image_url || null,
      category:       form.category  || null,
      specifications: parseSpecs(form.specifications),
    }
    try {
      if (editingId) {
        await api.updateProduct(editingId, payload, user.token)
        show('Produto atualizado!', 'success')
        setEditingId(null)
      } else {
        await api.createProduct(payload, user.token)
        show('Produto criado com sucesso!', 'success')
      }
      setForm(EMPTY_FORM)
      setImgError(false)
      loadProducts()
    } catch (err) {
      show(err.message || 'Erro ao salvar produto', 'error')
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
          { label: 'Total de Produtos', value: products.length,                                     icon: Package,   color: 'violet' },
          { label: 'Total em Estoque',  value: products.reduce((a, p) => a + p.stock, 0),            icon: Archive,   color: 'emerald' },
          { label: 'Valor do Estoque',  value: formatPrice(totalValue),                              icon: DollarSign,color: 'amber' },
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
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white text-lg flex items-center gap-2">
                {editingId
                  ? <><Pencil className="w-5 h-5 text-amber-400" /> Editar Produto</>
                  : <><Plus className="w-5 h-5 text-violet-400" /> Novo Produto</>}
              </h2>
              {editingId && (
                <button onClick={cancelEdit} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
              )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="block text-sm text-slate-400 mb-2">Nome *</label>
                <input type="text" required value={form.name} onChange={set('name')} placeholder="Nome do produto" className={inputCls} />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2 flex items-center gap-1.5"><Tag className="w-3 h-3"/>Categoria</label>
                <select value={form.category} onChange={set('category')} className={`${inputCls} appearance-none cursor-pointer`}>
                  <option value="">Selecione uma categoria</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Descrição</label>
                <textarea value={form.description} onChange={set('description')} placeholder="Descrição do produto" rows={2} className={`${inputCls} resize-none`} />
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

              {/* Image URL */}
              <div>
                <label className="block text-sm text-slate-400 mb-2 flex items-center gap-1.5"><Image className="w-3 h-3"/>URL da Imagem</label>
                <input type="url" value={form.image_url} onChange={set('image_url')} placeholder="https://..." className={inputCls} />
                {form.image_url && !imgError && (
                  <div className="mt-2 rounded-xl overflow-hidden h-28 bg-slate-800">
                    <img
                      src={form.image_url}
                      alt="preview"
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  </div>
                )}
                {form.image_url && imgError && (
                  <p className="text-xs text-red-400 mt-1">URL de imagem inválida</p>
                )}
              </div>

              {/* Specifications */}
              <div>
                <label className="block text-sm text-slate-400 mb-2 flex items-center gap-1.5"><FileText className="w-3 h-3"/>Especificações <span className="text-slate-600">(Chave: Valor, uma por linha)</span></label>
                <textarea
                  value={form.specifications}
                  onChange={set('specifications')}
                  placeholder={"Processador: Intel i9\nRAM: 32GB\nArmazenamento: 1TB SSD"}
                  rows={4}
                  className={`${inputCls} resize-none font-mono text-xs`}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-2.5 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${
                  editingId
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-500/20'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20'
                }`}
              >
                {submitting
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : editingId
                    ? <><Pencil className="w-4 h-4" /> Salvar Alterações</>
                    : <><Plus className="w-4 h-4" /> Criar Produto</>
                }
              </button>
            </form>
          </div>
        </div>

        {/* Products list */}
        <div className="lg:col-span-3">
          <h2 className="font-semibold text-white text-lg mb-4">
            Produtos cadastrados
            {!loading && <span className="text-slate-500 font-normal text-sm ml-2">({products.length})</span>}
          </h2>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-slate-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Package className="w-8 h-8 text-slate-700" />
              <p className="text-slate-600 text-sm">Nenhum produto ainda</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin pr-1">
              {products.map(p => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all"
                >
                  {/* Thumbnail */}
                  <div className={`w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 ${!p.image_url ? `bg-gradient-to-br ${GRADIENTS[p.id % GRADIENTS.length]}` : ''}`}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; e.target.parentNode.classList.add(`bg-gradient-to-br`, GRADIENTS[p.id%GRADIENTS.length]) }}/>
                      : <div className="w-full h-full flex items-center justify-center"><span className="text-white font-bold text-xl">{p.name[0]}</span></div>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-white text-sm truncate">{p.name}</p>
                      {p.category && (
                        <span className="text-xs px-1.5 py-0.5 bg-violet-500/15 text-violet-400 rounded border border-violet-500/20">{p.category}</span>
                      )}
                    </div>
                    {p.description && <p className="text-xs text-slate-500 truncate">{p.description}</p>}
                    {p.specifications && (
                      <p className="text-xs text-slate-600 truncate">
                        {Object.entries(p.specifications).slice(0,3).map(([k,v]) => `${k}: ${v}`).join(' · ')}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <p className="font-semibold text-white text-sm">{formatPrice(p.price)}</p>
                    <p className="text-xs text-slate-500">{p.stock} un.</p>
                    <button
                      onClick={() => startEdit(p)}
                      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg transition-all ${
                        editingId === p.id
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'text-slate-600 hover:text-amber-400 hover:bg-amber-500/10'
                      }`}
                    >
                      <Pencil className="w-3 h-3" /> Editar
                    </button>
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
