import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'

import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  CreditCard,
  DollarSign,
  Download,
  Dumbbell,
  Eye,
  Filter,
  LayoutDashboard,
  LogOut,
  Plus,
  Receipt,
  Search,
  Settings,
  Smartphone,
  Trash2,
  Trophy,
  UserCog,
  Users,
  Utensils,
  Wallet,
  Wrench,
} from 'lucide-react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

const menuItems = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'members', name: 'Members', icon: Users },
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
  { id: 'mobile', name: 'Mobile App', icon: Smartphone },
  { id: 'reports', name: 'Reports', icon: BarChart3 },
  { id: 'settings', name: 'Settings', icon: Settings },
]

export default function Payments({ onNavigate, onLogout }) {
  const [payments, setPayments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')

  useEffect(() => {
    let shouldUpdate = true

    const loadPayments = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`${apiBaseUrl}/payments`, {
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

          throw new Error(payload.message || 'Unable to load payments.')
        }

        if (shouldUpdate) setPayments(payload.payments || [])
      } catch (caughtError) {
        if (shouldUpdate) setError(caughtError.message || 'Unable to load payments.')
      } finally {
        if (shouldUpdate) setIsLoading(false)
      }
    }

    loadPayments()

    return () => {
      shouldUpdate = false
    }
  }, [onLogout])

  const filteredPayments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return payments.filter((payment) => {
      const payerName = getPayerName(payment).toLowerCase()
      const matchesSearch =
        !search ||
        payerName.includes(search) ||
        payment.reference_number?.toLowerCase().includes(search) ||
        payment.item_name?.toLowerCase().includes(search) ||
        payment.payment_for?.toLowerCase().includes(search)
      const matchesStatus =
        statusFilter === 'All Status' || payment.payment_status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [payments, searchTerm, statusFilter])

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const paid = payments.filter((payment) => payment.payment_status === 'Paid')
    const todayPaid = paid.filter((payment) =>
      String(payment.payment_date || '').startsWith(today),
    )
    const pending = payments.filter((payment) => payment.payment_status === 'Pending')

    return {
      totalRevenue: paid.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      todayRevenue: todayPaid.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0,
      ),
      transactions: payments.length,
      pending: pending.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    }
  }, [payments])

  const handleViewPayment = (payment) => {
    Swal.fire({
      title: payment.reference_number,
      html: `
        <div style="text-align:left;color:#d1d5db">
          <div style="background:#050505;border:1px solid rgba(200,161,58,0.35);border-radius:18px;padding:18px;margin-bottom:14px">
            <div style="color:#8f8f8f;font-size:12px;font-weight:700;margin-bottom:6px">Payer</div>
            <div style="color:#ffffff;font-size:20px;font-weight:900">${escapeHtml(getPayerName(payment))}</div>
            <div style="color:#8f8f8f;font-size:13px;margin-top:5px">${escapeHtml(payment.payer_type)}</div>
          </div>
          ${receiptRow('Payment For', payment.payment_for)}
          ${receiptRow('Item', payment.item_name)}
          ${receiptRow('Amount', formatCurrency(payment.amount))}
          ${receiptRow('Method', payment.payment_method)}
          ${receiptRow('Date', formatDate(payment.payment_date))}
          ${receiptRow('Status', payment.payment_status)}
          ${payment.notes ? receiptRow('Notes', payment.notes) : ''}
        </div>
      `,
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      confirmButtonText: 'Close',
      width: 560,
    })
  }

  const handleDeletePayment = async (payment) => {
    const confirmation = await Swal.fire({
      title: 'Delete payment?',
      text: `${payment.reference_number} for ${getPayerName(payment)} will be removed permanently.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      cancelButtonColor: '#2a2a2a',
    })

    if (!confirmation.isConfirmed) return

    try {
      const response = await fetch(`${apiBaseUrl}/payments/${payment.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
        },
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to delete payment.')
      }

      setPayments((current) => current.filter((item) => item.id !== payment.id))

      await Swal.fire({
        title: 'Payment deleted',
        text: payload.message || 'Payment deleted successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    } catch (caughtError) {
      await Swal.fire({
        title: 'Delete failed',
        text: caughtError.message || 'Unable to delete payment.',
        icon: 'error',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    }
  }

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
            const active = item.id === 'payments'

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
          <p className="text-xs text-gray-500">Today Revenue</p>
          <h3 className="text-xl font-bold mt-1">
            {formatCurrency(stats.todayRevenue)}
          </h3>
          <p className="text-xs text-[#C8A13A] mt-1">
            {stats.transactions} transactions
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
              const active = item.id === 'payments'

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

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black">Payments</h1>
            <p className="text-gray-400 mt-1">
              Manage membership payments, receipts and pending balances.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('add-payment')}
            className="bg-[#C8A13A] text-black font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Payment
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard
            icon={Wallet}
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
          />
          <StatCard
            icon={DollarSign}
            title="Today Revenue"
            value={formatCurrency(stats.todayRevenue)}
          />
          <StatCard icon={Receipt} title="Transactions" value={stats.transactions} />
          <StatCard
            icon={CreditCard}
            title="Pending"
            value={formatCurrency(stats.pending)}
          />
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 flex items-center gap-3 bg-[#050505] border border-white/10 rounded-2xl px-4 py-3">
              <Search size={20} className="text-gray-500 shrink-0" />
              <input
                placeholder="Search member, reference or plan..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="bg-transparent outline-none w-full text-sm placeholder:text-gray-600"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="appearance-none bg-[#050505] border border-white/10 rounded-2xl px-4 py-3 text-gray-300 outline-none [color-scheme:dark]"
            >
              {['All Status', 'Paid', 'Pending', 'Failed', 'Refunded'].map(
                (item) => (
                  <option key={item} className="bg-[#050505] text-white">
                    {item}
                  </option>
                ),
              )}
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
          <div className="flex items-center justify-between gap-4 px-5 py-5 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold">Payment Records</h2>
              <p className="text-gray-500 text-sm mt-1">
                Recent membership and service payments.
              </p>
            </div>
            <button
              type="button"
              className="hidden sm:flex items-center gap-2 text-[#C8A13A] text-sm font-bold"
            >
              <Download size={17} />
              Export
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="bg-[#050505] text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-4">Member</th>
                  <th className="px-5 py-4">Plan</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Method</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {isLoading && (
                  <tr>
                    <td className="px-5 py-8 text-center text-gray-400" colSpan="7">
                      Loading payments...
                    </td>
                  </tr>
                )}

                {!isLoading && error && (
                  <tr>
                    <td className="px-5 py-8 text-center text-red-300" colSpan="7">
                      {error}
                    </td>
                  </tr>
                )}

                {!isLoading && !error && filteredPayments.length === 0 && (
                  <tr>
                    <td className="px-5 py-8 text-center text-gray-400" colSpan="7">
                      No payments found.
                    </td>
                  </tr>
                )}

                {!isLoading && !error && filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/[0.03]">
                    <td className="px-5 py-5">
                      <p className="font-bold">{getPayerName(payment)}</p>
                      <p className="text-gray-500 text-sm">
                        {payment.reference_number}
                      </p>
                    </td>
                    <td className="px-5 py-5 text-gray-300">
                      <p>{payment.item_name}</p>
                      <p className="text-gray-500 text-sm">{payment.payment_for}</p>
                    </td>
                    <td className="px-5 py-5 font-bold text-[#C8A13A]">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-5 py-5 text-gray-300">
                      {payment.payment_method}
                    </td>
                    <td className="px-5 py-5 text-gray-300">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="px-5 py-5">
                      <StatusBadge status={payment.payment_status} />
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewPayment(payment)}
                          className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 text-gray-400 hover:text-[#C8A13A] hover:bg-white/5"
                        >
                          <Eye size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePayment(payment)}
                          className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
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

function getPayerName(payment) {
  if (payment.payer_type === 'Member') {
    return payment.member?.full_name || 'Member'
  }

  return payment.walk_in_name || 'Walk-in'
}

function formatCurrency(value) {
  return `TZS ${Number(value || 0).toLocaleString()}`
}

function formatDate(value) {
  if (!value) return 'Not set'

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function receiptRow(label, value) {
  return `
    <div style="display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid rgba(255,255,255,0.1);padding:12px 0">
      <span style="color:#8f8f8f;font-size:13px">${escapeHtml(label)}</span>
      <strong style="color:#ffffff;text-align:right">${escapeHtml(value || 'Not set')}</strong>
    </div>
  `
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function StatusBadge({ status }) {
  const paid = status === 'Paid'

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
        paid ? 'bg-green-500/15 text-green-400' : 'bg-orange-500/15 text-orange-400'
      }`}
    >
      <CheckCircle size={14} />
      {status}
    </span>
  )
}
