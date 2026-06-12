import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './admin/AdminLayout'
import GuestAdminRoute from './admin/GuestAdminRoute'
import ProtectedAdminRoute from './admin/ProtectedAdminRoute'
import AdminLogin from './admin/pages/Login'
import AdminPortal from './admin/pages/Portal'
import Layout from './components/Layout'
import CategoryPage from './pages/CategoryPage'
import CartPage from './pages/CartPage'
import Home from './pages/Home'
import OrderSuccessPage from './pages/OrderSuccessPage'
import OrderPage from './pages/OrderPage'
import ProductPage from './pages/ProductPage'
import AboutUs from './pages/AboutUs'
import OurValues from './pages/OurValues'
import Search from './pages/Search'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route
            path="category/:slug/:subcategorySlug"
            element={<CategoryPage />}
          />
          <Route path="search" element={<Search />} />
          <Route path="about-us" element={<AboutUs />} />
          <Route path="our-values" element={<OurValues />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="order" element={<OrderPage />} />
          <Route path="order/success" element={<OrderSuccessPage />} />
          <Route path="product/:slug" element={<ProductPage />} />
        </Route>

        <Route path="admin/login" element={<GuestAdminRoute />}>
          <Route index element={<AdminLogin />} />
        </Route>

        <Route path="admin" element={<ProtectedAdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminPortal />} />
          </Route>
        </Route>

        <Route path="dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
