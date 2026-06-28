import ProtectedAdminRoute from '../../admin/ProtectedAdminRoute'
import AdminLayout from '../../admin/AdminLayout'
import AdminPortal from '../../admin/pages/Portal'

export default function AdminPage() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <AdminPortal />
      </AdminLayout>
    </ProtectedAdminRoute>
  )
}
