import { Suspense } from 'react'
import GuestAdminRoute from '../../../admin/GuestAdminRoute'
import AdminLogin from '../../../admin/pages/Login'

export default function AdminLoginPage() {
  return (
    <GuestAdminRoute>
      <Suspense fallback={<div className="admin-loading"><p>Loading…</p></div>}>
        <AdminLogin />
      </Suspense>
    </GuestAdminRoute>
  )
}
