import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, Package, Sparkles } from 'lucide-react'
import { api }         from '../api.js'
import ProductCard     from '../components/ProductCard.jsx'
import { useToast }    from '../components/Toast.jsx'

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [sort,     setSort]     = useState('default')
  const { show } = useToast()

  useEffect(() => {
    api.getProducts()
      .then(setProducts)
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = products
    .filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'price-asc')  return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'name')       return a.name.localeCompare(b.name)
      return 0
    })

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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar produtos..."
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

      {!loading && (
        <p className="text-slate-500 text-sm mb-4">
          {filtered.length} {filtered.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
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
                <div className="h-4 bg-slate-800 rounded-lg w-2/3" />
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
            {search ? 'Nenhum produto encontrado para esta busca' : 'Nenhum produto cadastrado ainda'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
