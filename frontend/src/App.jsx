import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }    from './context/AuthContext.jsx'
import { CartProvider }    from './context/CartContext.jsx'
import { ToastProvider }   from './components/Toast.jsx'
import Navbar              from './components/Navbar.jsx'
import Cart                from './components/Cart.jsx'
import PrivateRoute        from './components/PrivateRoute.jsx'
import Home                from './pages/Home.jsx'
import Login               from './pages/Login.jsx'
import Register            from './pages/Register.jsx'
import Orders              from './pages/Orders.jsx'
import Admin               from './pages/Admin.jsx'
import Status              from './pages/Status.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <div className="min-h-screen bg-slate-950">
              <Navbar />
              <Cart />
              <main className="pt-16">
                <Routes>
                  <Route path="/"         element={<Home />} />
                  <Route path="/login"    element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/orders"   element={<PrivateRoute><Orders /></PrivateRoute>} />
                  <Route path="/admin"    element={<PrivateRoute adminOnly><Admin /></PrivateRoute>} />
                  <Route path="/status"   element={<Status />} />
                  <Route path="*"         element={<Navigate to="/" />} />
                </Routes>
              </main>
            </div>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
