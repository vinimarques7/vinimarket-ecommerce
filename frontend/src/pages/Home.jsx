import { useState, useEffect, useRef } from 'react'
import { Search, SlidersHorizontal, Package, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { api }         from '../api.js'
import { CATEGORIES, CATEGORY_ICONS } from '../constants.js'
import ProductCard     from '../components/ProductCard.jsx'
import { useToast }    from '../components/Toast.jsx'

export default function Home() {
  const [products,  setProducts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [sort,      setSort]      = useState('default')
  const [category,  setCategory]  = useState('Todas')
  const { show } = useToast()
  const tabsRef = useRef(null)

  useEffect(() => {
    api.getProducts()
      .then(setProducts)
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  // Extract categories present in actual products
  const availableCategories = ['Todas', ...CATEGORIES.filter(c =>
    products.some(p => p.category === c)
  )]

  const filtered = products
    .filter(p => category === 'Todas' || p.category === category)
    .filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.category    || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'price-asc')  return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'name')       return a.name.localeCompare(b.name)
      return 0
    })

  const scroll = (dir) => {
    if (tabsRef.current) tabsRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-950 via-slate-900 to-indigo-950 border border-violet-900/30 p-8 md:p-12 mb-10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 text-violet-400 text-sm font-medium mb-3">
            <Sparkles className="w-4 h-4" />
            Bem-vindo ao Vini Market
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight">
            Descubra produtos<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              incríveis
            </span>
          </h1>
          <p className="text-slate-400 max-w-lg">
            Os melhores produtos com os melhores preços, direto do Vini Market para você.
          </p>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar produtos, categorias..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="pl-10 pr-8 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all appearance-none cursor-pointer"
          >
            <option value="default">Padrão</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="name">Nome A-Z</option>
          </select>
        </div>
      </div>

      {/* Category tabs */}
      {!loading && availableCategories.length > 1 && (
        <div className="relative mb-6">
          <button
            onClick={() => scroll(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div
            ref={tabsRef}
            className="flex gap-2 overflow-x-auto scrollbar-thin px-8 py-1 scroll-smooth"
            style={{ scrollbarWidth: 'none' }}
          >
            {availableCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  category === cat
                    ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                {cat !== 'Todas' && <span>{CATEGORY_ICONS[cat] || '📦'}</span>}
                {cat}
              </button>
            ))}
          </div>
          <button
            onClick={() => scroll(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {!loading && (
        <p className="text-slate-500 text-sm mb-4">
          {filtered.length} {filtered.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
          {category !== 'Todas' && <span className="text-violet-400"> em {category}</span>}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden animate-pulse">
              <div className="h-48 bg-slate-800" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-slate-800 rounded-lg w-3/4" />
                <div className="h-4 bg-slate-800 rounded-lg w-full" />
                <div className="h-10 bg-slate-800 rounded-xl mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center">
            <Package className="w-8 h-8 text-slate-700" />
          </div>
          <p className="text-slate-500 font-medium">
            {search || category !== 'Todas' ? 'Nenhum produto encontrado para este filtro' : 'Nenhum produto cadastrado ainda'}
          </p>
          {category !== 'Todas' && (
            <button onClick={() => setCategory('Todas')} className="text-violet-400 text-sm hover:text-violet-300 transition-colors">
              Ver todos os produtos
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
