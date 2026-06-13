import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Package, LogOut, LayoutDashboard, Zap, Activity } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { count, setIsOpen } = useCart()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white">Vini <span className="text-violet-400">Market</span></span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/" className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
            Produtos
          </Link>
          {user && (
            <Link to="/orders" className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all flex items-center gap-1.5">
              <Package className="w-4 h-4" /> Meus Pedidos
            </Link>
          )}
          <Link to="/status" className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all flex items-center gap-1.5">
            <Activity className="w-4 h-4" /> Status
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="px-3 py-1.5 text-sm text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-lg transition-all flex items-center gap-1.5">
              <LayoutDashboard className="w-4 h-4" /> Admin
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">

          {/* Cart button */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            <ShoppingCart className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-violet-600 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                  {user.email[0].toUpperCase()}
                </div>
                <span className="text-sm text-slate-300 max-w-32 truncate">{user.email}</span>
                {user.role === 'admin' && (
                  <span className="text-xs px-1.5 py-0.5 bg-violet-500/20 text-violet-400 rounded-md font-medium">admin</span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors">
                Entrar
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg transition-all font-medium shadow-lg shadow-violet-500/20"
              >
                Cadastrar
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
