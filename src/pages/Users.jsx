import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'

import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Download,
  Dumbbell,
  Edit,
  Eye,
  Filter,
  LayoutDashboard,
  Lock,
  LogOut,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Trash2,
  Trophy,
  UserCheck,
  UserCog,
  Users as UsersIcon,
  UserX,
  Utensils,
  Wrench,
  X,
  Save,
  Shield,
} from 'lucide-react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

const menuItems = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'members', name: 'Members', icon: UsersIcon },
  { id: 'plans', name: 'Membership Plans', icon: CreditCard },
  { id: 'trainers', name: 'Trainers', icon: UserCog },
  { id: 'exercises', name: 'Exercises', icon: Dumbbell },
  { id: 'equipment', name: 'Equipment', icon: Wrench },
  { id: 'workouts', name: 'Workouts', icon: Activity },
  { id: 'levels', name: 'Workout Levels', icon: Trophy },
  { id: 'diet', name: 'Diet Plans', icon: Utensils },
  { id: 'classes', name: 'Classes', icon: CalendarDays },
  { id: 'attendance', name: 'Attendance', icon: ClipboardList },
  { id: 'payments', name: 'Payments', icon: CreditCard },
  { id: 'users', name: 'Users & Roles', icon: ShieldCheck },
  { id: 'mobile', name: 'Mobile App', icon: Smartphone },
  { id: 'reports', name: 'Reports', icon: BarChart3 },
  { id: 'settings', name: 'Settings', icon: Settings },
]

const roleAccess = {
  'Super Admin': 'Full Access',
  Manager: 'Members, Staff, Reports, Settings',
  Receptionist: 'Members, Payments, Attendance',
  Trainer: 'Classes, Workouts, Members',
  Accountant: 'Payments, Plans, Reports',
}

const roleOptions = [
  'All Roles',
  'Super Admin',
  'Manager',
  'Receptionist',
  'Trainer',
  'Accountant',
]

export default function UsersPage({ onNavigate, onLogout }) {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [resetPasswordData, setResetPasswordData] = useState({
    password: '',
    password_confirmation: '',
    force_password_change: true,
  })
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  useEffect(() => {
    let shouldUpdate = true

    const loadUsers = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`${apiBaseUrl}/users`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
          },
        })

        const payload = await response.json()

        if (!response.ok) {
          if (response.status === 401) {
            onLogout()
            return
          }

          throw new Error(payload.message || 'Unable to load users.')
        }

        if (shouldUpdate) {
          setUsers(payload.users || [])
        }
      } catch (caughtError) {
        if (shouldUpdate) {
          setError(caughtError.message || 'Unable to load users.')
        }
      } finally {
        if (shouldUpdate) {
          setIsLoading(false)
        }
      }
    }

    loadUsers()

    return () => {
      shouldUpdate = false
    }
  }, [onLogout])

  const handleViewUser = (user) => {
    setSelectedUser(user)
    setShowViewModal(true)
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    // Store user in localStorage for the edit page
    localStorage.setItem('edit_user_data', JSON.stringify(user))
    onNavigate('edit-user')
  }

  const handleResetPassword = (user) => {
    setSelectedUser(user)
    setResetPasswordData({
      password: '',
      password_confirmation: '',
      force_password_change: true,
    })
    setShowResetPasswordModal(true)
  }

  const submitResetPassword = async (event) => {
    event.preventDefault()
    setIsResettingPassword(true)

    try {
      const response = await fetch(
        `${apiBaseUrl}/users/${selectedUser.id}/reset-password`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(resetPasswordData),
        },
      )

      const payload = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          onLogout()
          return
        }

        const validationMessage = payload.errors
          ? Object.values(payload.errors).flat().join(' ')
          : payload.message

        throw new Error(validationMessage || 'Unable to reset password.')
      }

      setShowResetPasswordModal(false)
      setSelectedUser(null)

      await Swal.fire({
        title: 'Password Reset',
        text: payload.message || 'Password reset successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    } catch (caughtError) {
      await Swal.fire({
        title: 'Reset Failed',
        text: caughtError.message || 'Unable to reset password.',
        icon: 'error',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleDeleteUser = async (user) => {
    const result = await Swal.fire({
      title: 'Delete User?',
      text: `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
        },
      })

      const payload = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          onLogout()
          return
        }

        throw new Error(payload.message || 'Unable to delete user.')
      }

      // Remove user from list
      setUsers((current) => current.filter((u) => u.id !== user.id))

      await Swal.fire({
        title: 'User Deleted',
        text: payload.message || 'User deleted successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    } catch (caughtError) {
      await Swal.fire({
        title: 'Delete Failed',
        text: caughtError.message || 'Unable to delete user.',
        icon: 'error',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    }
  }

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.name?.toLowerCase().includes(normalizedSearch) ||
        user.email?.toLowerCase().includes(normalizedSearch)

      const matchesRole =
        roleFilter === 'All Roles' || user.role === roleFilter

      const matchesStatus =
        statusFilter === 'All Status' || user.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [roleFilter, searchTerm, statusFilter, users])

  const stats = useMemo(() => {
    const totalUsers = users.length
    const activeUsers = users.filter((user) => user.status === 'Active').length
    const inactiveUsers = users.filter(
      (user) => user.status !== 'Active',
    ).length
    const roleCount = new Set(users.map((user) => user.role).filter(Boolean))
      .size

    return { activeUsers, inactiveUsers, roleCount, totalUsers }
  }, [users])

  const roleCards = useMemo(
    () =>
      ['Super Admin', 'Receptionist', 'Trainer'].map((role) => ({
        role,
        count: users.filter((user) => user.role === role).length,
      })),
    [users],
  )

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <aside className="hidden lg:flex w-72 bg-[#090909] border-r border-white/10 p-5 flex-col">
        <div className="mb-8 px-2">
          <h1 className="text-3xl font-black tracking-wide">
            AUR<span className="text-[#C8A13A]">EX</span>
          </h1>
          <p className="text-[#C8A13A] text-xs tracking-[0.25em]">
            PERFORMANCE ARENA
          </p>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = item.id === 'users'

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition text-sm ${
                  active
                    ? 'bg-[#C8A13A] text-black font-bold shadow-lg shadow-[#C8A13A]/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            )
          })}
        </nav>

        <div className="mt-6 bg-[#111] rounded-2xl p-4 border border-white/10">
          <p className="text-xs text-gray-500">Active Users</p>
          <h3 className="text-xl font-bold mt-1">{stats.activeUsers}</h3>
          <p className="text-xs text-[#C8A13A] mt-1">
            {stats.roleCount} permission roles
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-5 flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10"
        >
          <LogOut size={19} />
          Logout
        </button>
      </aside>

      <main className="flex-1 min-w-0 bg-gradient-to-br from-[#050505] via-[#080808] to-[#111] p-5 sm:p-8 overflow-y-auto">
        <div className="lg:hidden bg-[#090909] border border-white/10 rounded-3xl p-3 mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = item.id === 'users'

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm ${
                    active
                      ? 'bg-[#C8A13A] text-black font-bold'
                      : 'text-gray-400 bg-white/5'
                  }`}
                >
                  <Icon size={17} />
                  {item.name}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black">Users & Roles</h1>
            <p className="text-gray-400 mt-1">
              Manage admin users, staff login access and permissions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              className="border border-white/10 text-gray-300 px-5 py-3 rounded-2xl flex items-center justify-center gap-2 hover:border-[#C8A13A]"
            >
              <Download size={18} />
              Export
            </button>

            <button
              type="button"
              onClick={() => onNavigate('permissions')}
              className="border border-[#C8A13A]/40 text-[#C8A13A] px-5 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#C8A13A]/10"
            >
              <ShieldCheck size={18} />
              Permissions
            </button>

            <button
              type="button"
              onClick={() => onNavigate('add-user')}
              className="bg-[#C8A13A] text-black font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add User
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard
            icon={UsersIcon}
            title="Total Users"
            value={stats.totalUsers}
          />
          <StatCard
            icon={UserCheck}
            title="Active Users"
            value={stats.activeUsers}
          />
          <StatCard
            icon={UserX}
            title="Inactive Users"
            value={stats.inactiveUsers}
          />
          <StatCard icon={ShieldCheck} title="Roles" value={stats.roleCount} />
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 flex items-center gap-3 bg-[#050505] border border-white/10 rounded-2xl px-4 py-3">
              <Search size={20} className="text-gray-500 shrink-0" />
              <input
                placeholder="Search user by name or email..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="bg-transparent outline-none w-full text-sm placeholder:text-gray-600"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="appearance-none bg-[#050505] border border-white/10 rounded-2xl px-4 py-3 text-gray-300 outline-none [color-scheme:dark]"
            >
              {roleOptions.map((item) => (
                <option key={item} className="bg-[#050505] text-white">
                  {item}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="appearance-none bg-[#050505] border border-white/10 rounded-2xl px-4 py-3 text-gray-300 outline-none [color-scheme:dark]"
            >
              {['All Status', 'Active', 'Inactive', 'Suspended'].map((item) => (
                <option key={item} className="bg-[#050505] text-white">
                  {item}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="border border-white/10 px-5 py-3 rounded-2xl flex items-center justify-center gap-2 text-gray-300 hover:border-[#C8A13A]"
            >
              <Filter size={18} />
              Filter
            </button>
          </div>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-[#0A0A0A] text-gray-400 text-sm">
                <tr>
                  <th className="p-5">User</th>
                  <th className="p-5">Role</th>
                  <th className="p-5">Access</th>
                  <th className="p-5">Last Login</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {isLoading && (
                  <tr>
                    <td className="p-8 text-center text-gray-400" colSpan="6">
                      Loading users...
                    </td>
                  </tr>
                )}

                {!isLoading && error && (
                  <tr>
                    <td className="p-8 text-center text-red-300" colSpan="6">
                      {error}
                    </td>
                  </tr>
                )}

                {!isLoading && !error && filteredUsers.length === 0 && (
                  <tr>
                    <td className="p-8 text-center text-gray-400" colSpan="6">
                      No users found.
                    </td>
                  </tr>
                )}

                {!isLoading && !error && filteredUsers.map((user) => (
                  <tr
                    key={user.id || user.email}
                    className="border-t border-white/10 hover:bg-white/[0.03]"
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#C8A13A] text-black font-black flex items-center justify-center shrink-0">
                          {user.name.charAt(0)}
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-bold truncate">{user.name}</h3>
                          <p className="text-gray-500 text-sm truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-5">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#C8A13A]/15 text-[#C8A13A]">
                        {user.role}
                      </span>
                    </td>

                    <td className="p-5 text-gray-300 max-w-xs">
                      {roleAccess[user.role] || user.user_type || 'Standard Access'}
                    </td>

                    <td className="p-5 text-gray-300">
                      {formatDate(user.updated_at || user.created_at)}
                    </td>

                    <td className="p-5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          user.status === 'Active'
                            ? 'bg-green-500/15 text-green-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>

                    <td className="p-5">
                      <div className="flex justify-end gap-2">
                        <ActionButton
                          icon={Eye}
                          onClick={() => handleViewUser(user)}
                          title="View Details"
                        />
                        <ActionButton
                          icon={Edit}
                          onClick={() => handleEditUser(user)}
                          title="Edit User"
                        />
                        <ActionButton
                          icon={Lock}
                          onClick={() => handleResetPassword(user)}
                          title="Reset Password"
                        />
                        <ActionButton
                          icon={Trash2}
                          onClick={() => handleDeleteUser(user)}
                          title="Delete User"
                          danger
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
          <RoleCard
            title="Super Admin"
            desc="Full access to all modules and settings."
            users={`${roleCards[0].count} users`}
            onClick={() => onNavigate('permissions')}
          />
          <RoleCard
            title="Receptionist"
            desc="Members, attendance, payments and class bookings."
            users={`${roleCards[1].count} users`}
            onClick={() => onNavigate('permissions')}
          />
          <RoleCard
            title="Trainer"
            desc="Classes, workout programs and assigned members."
            users={`${roleCards[2].count} users`}
            onClick={() => onNavigate('permissions')}
          />
        </div>

        {/* View User Modal */}
        {showViewModal && selectedUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-[#111] to-[#0A0A0A] border border-white/10 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="bg-[#0A0A0A] border-b border-white/10 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#C8A13A] text-black font-black flex items-center justify-center text-3xl">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">{selectedUser.name}</h2>
                    <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Status & Security Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
                    <p className="text-gray-400 text-xs mb-2">Status</p>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                        selectedUser.status === 'Active'
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {selectedUser.status}
                    </span>
                  </div>

                  <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
                    <p className="text-gray-400 text-xs mb-2">Role</p>
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-[#C8A13A]/15 text-[#C8A13A]">
                      {selectedUser.role}
                    </span>
                  </div>

                  <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
                    <p className="text-gray-400 text-xs mb-2">2FA</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                      selectedUser.two_factor_enabled
                        ? 'bg-blue-500/15 text-blue-400'
                        : 'bg-gray-500/15 text-gray-400'
                    }`}>
                      {selectedUser.two_factor_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <UserCog size={20} className="text-[#C8A13A]" />
                    User Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Name" value={selectedUser.name} />
                    <DetailItem label="Email" value={selectedUser.email} />
                    <DetailItem label="Phone" value={selectedUser.phone || 'Not provided'} />
                    <DetailItem label="User Type" value={selectedUser.user_type} />
                    <DetailItem label="Role" value={selectedUser.role} />
                    <DetailItem label="Status" value={selectedUser.status} />
                  </div>
                </div>

                {/* Account Info */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Shield size={20} className="text-[#C8A13A]" />
                    Account Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem
                      label="Created"
                      value={formatDate(selectedUser.created_at)}
                    />
                    <DetailItem
                      label="Last Updated"
                      value={formatDate(selectedUser.updated_at)}
                    />
                    <DetailItem
                      label="User ID"
                      value={selectedUser.id || 'N/A'}
                    />
                    <DetailItem
                      label="Force Password Change"
                      value={selectedUser.force_password_change ? 'Yes' : 'No'}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="bg-[#0A0A0A] border-t border-white/10 p-6 flex justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowViewModal(false)
                    handleResetPassword(selectedUser)
                  }}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/10 text-gray-300 hover:text-[#C8A13A] hover:border-[#C8A13A] transition"
                >
                  <Lock size={18} />
                  Reset Password
                </button>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowViewModal(false)
                      handleEditUser(selectedUser)
                    }}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-[#C8A13A]/40 text-[#C8A13A] hover:bg-[#C8A13A]/10 transition"
                  >
                    <Edit size={18} />
                    Edit User
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowViewModal(false)}
                    className="bg-[#C8A13A] text-black font-bold px-6 py-3 rounded-2xl hover:bg-[#B89130] transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showResetPasswordModal && selectedUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-[#111] border border-white/10 rounded-3xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Reset Password</h2>
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-gray-400 mb-6">
                Reset password for <span className="text-white font-bold">{selectedUser.name}</span>
              </p>

              <form onSubmit={submitResetPassword} className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={resetPasswordData.password}
                    onChange={(e) =>
                      setResetPasswordData({
                        ...resetPasswordData,
                        password: e.target.value,
                      })
                    }
                    className="w-full bg-[#050505] border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#C8A13A]"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm block mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={resetPasswordData.password_confirmation}
                    onChange={(e) =>
                      setResetPasswordData({
                        ...resetPasswordData,
                        password_confirmation: e.target.value,
                      })
                    }
                    className="w-full bg-[#050505] border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#C8A13A]"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="force_password_change"
                    checked={resetPasswordData.force_password_change}
                    onChange={(e) =>
                      setResetPasswordData({
                        ...resetPasswordData,
                        force_password_change: e.target.checked,
                      })
                    }
                    className="accent-[#C8A13A]"
                  />
                  <label htmlFor="force_password_change" className="text-gray-300 text-sm">
                    Force password change on next login
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowResetPasswordModal(false)}
                    className="flex-1 border border-white/10 text-gray-300 px-5 py-3 rounded-2xl hover:border-[#C8A13A]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResettingPassword}
                    className="flex-1 bg-[#C8A13A] disabled:opacity-60 text-black font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function formatDate(value) {
  if (!value) {
    return 'Never'
  }

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function StatCard({ icon: Icon, title, value }) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-3xl p-5">
      <div className="w-12 h-12 rounded-2xl bg-[#C8A13A]/15 flex items-center justify-center mb-4">
        <Icon className="text-[#C8A13A]" size={22} />
      </div>
      <p className="text-gray-400 text-sm">{title}</p>
      <h3 className="text-2xl font-black mt-1">{value}</h3>
    </div>
  )
}

function RoleCard({ title, desc, users, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-[#111] border border-white/10 rounded-3xl p-6 hover:border-[#C8A13A]/60 transition text-left"
    >
      <ShieldCheck size={26} className="text-[#C8A13A] mb-4" />
      <h3 className="text-xl font-black">{title}</h3>
      <p className="text-gray-400 text-sm mt-2">{desc}</p>
      <div className="flex items-center justify-between gap-4 mt-4">
        <p className="text-[#C8A13A] font-bold">{users}</p>
        <span className="text-sm text-gray-400">Permissions</span>
      </div>
    </button>
  )
}

function ActionButton({ icon: Icon, danger = false, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 ${
        danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-gray-400 hover:text-[#C8A13A] hover:bg-white/5'
      }`}
    >
      <Icon size={17} />
    </button>
  )
}

function DetailItem({ label, value }) {
  return (
    <div>
      <label className="text-gray-400 text-xs uppercase tracking-wider">{label}</label>
      <p className="text-white font-bold mt-1 break-words">{value}</p>
    </div>
  )
}
