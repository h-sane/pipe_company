import AdminDashboard from '@/components/admin/AdminDashboard'
import { AdminLayout } from '@/components/layout/Layout'

export default function AdminPage() {
  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
              <p className="text-gray-600 mt-1">
                Manage your pipe supply business from this dashboard
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Logged in as</div>
              <div className="font-medium text-gray-900">Admin User</div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                ADMIN
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <AdminDashboard />
    </AdminLayout>
  )
}