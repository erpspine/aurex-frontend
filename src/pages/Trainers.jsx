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
  LogOut,
  Plus,
  Search,
  Settings,
  Smartphone,
  Star,
  Trash2,
  Trophy,
  UserCog,
  Users,
  Utensils,
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

const specialties = [
  'All Specialties',
  'Strength Training',
  'HIIT & Weight Loss',
  'Bodybuilding',
  'Beginner Fitness',
  'Cardio',
  'Nutrition Coach',
]

export default function Trainers({ onNavigate, onLogout }) {
  const [trainers, setTrainers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('All Specialties')
  const [statusFilter, setStatusFilter] = useState('All Status')

  useEffect(() => {
    let shouldUpdate = true

    const loadTrainers = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`${apiBaseUrl}/trainers`, {
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

          throw new Error(payload.message || 'Unable to load trainers.')
        }

        if (shouldUpdate) setTrainers(payload.trainers || [])
      } catch (caughtError) {
        if (shouldUpdate) setError(caughtError.message || 'Unable to load trainers.')
      } finally {
        if (shouldUpdate) setIsLoading(false)
      }
    }

    loadTrainers()

    return () => {
      shouldUpdate = false
    }
  }, [onLogout])

  const filteredTrainers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return trainers.filter((trainer) => {
      const matchesSearch =
        !search ||
        trainer.full_name?.toLowerCase().includes(search) ||
        trainer.phone?.toLowerCase().includes(search) ||
        trainer.email?.toLowerCase().includes(search) ||
        trainer.specialty?.toLowerCase().includes(search)
      const matchesSpecialty =
        specialtyFilter === 'All Specialties' ||
        trainer.specialty === specialtyFilter
      const matchesStatus =
        statusFilter === 'All Status' || trainer.status === statusFilter

      return matchesSearch && matchesSpecialty && matchesStatus
    })
  }, [searchTerm, specialtyFilter, statusFilter, trainers])

  const stats = useMemo(() => {
    const ratingValues = trainers.map((trainer) => Number(trainer.rating || 0))
    const ratingSum = ratingValues.reduce((sum, rating) => sum + rating, 0)

    return {
      total: trainers.length,
      active: trainers.filter((trainer) => trainer.status === 'Active').length,
      clients: trainers.reduce(
        (sum, trainer) => sum + Number(trainer.assigned_clients || 0),
        0,
      ),
      classes: trainers.reduce(
        (sum, trainer) => sum + Number(trainer.assigned_classes || 0),
        0,
      ),
      rating: ratingValues.length ? (ratingSum / ratingValues.length).toFixed(1) : '0.0',
    }
  }, [trainers])

  const handleViewTrainer = (trainer) => {
    const initials = trainer.full_name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name.charAt(0))
      .join('')
      .toUpperCase()
    const statusColor = trainer.status === 'Active' ? '#22c55e' : '#ef4444'

    Swal.fire({
      title: '',
      html: `
        <div style="text-align:left;color:#ffffff;font-family:Inter,Arial,sans-serif">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:4px 2px 22px;border-bottom:1px solid rgba(255,255,255,0.1)">
            <div style="display:flex;align-items:center;gap:16px;min-width:0">
              <div style="width:72px;height:72px;border-radius:22px;background:#C8A13A;color:#050505;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900">
                ${escapeHtml(initials || 'T')}
              </div>
              <div style="min-width:0">
                <div style="font-size:28px;font-weight:900;line-height:1.12;overflow-wrap:anywhere">${escapeHtml(trainer.full_name)}</div>
                <div style="color:#9ca3af;font-size:14px;margin-top:7px">${escapeHtml(trainer.specialty)} • ${escapeHtml(trainer.role || 'Trainer')}</div>
              </div>
            </div>
            <span style="display:inline-flex;align-items:center;white-space:nowrap;border-radius:999px;background:${statusColor}22;color:${statusColor};font-size:12px;font-weight:900;padding:8px 11px">
              ${escapeHtml(trainer.status)}
            </span>
          </div>

          <div class="trainer-modal-grid" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:18px">
            ${metricCard('Rating', trainer.rating || '0')}
            ${metricCard('Classes', trainer.assigned_classes || 0)}
            ${metricCard('Clients', trainer.assigned_clients || 0)}
            ${metricCard('Experience', trainer.experience || 'Not set')}
          </div>

          <div class="trainer-modal-grid two" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px">
            ${detailCard('Phone', trainer.phone)}
            ${detailCard('Email', trainer.email || 'Not set')}
            ${detailCard('Gender', trainer.gender || 'Not set')}
            ${detailCard('Address', trainer.address || 'Not set')}
            ${detailCard('Certification', trainer.certification || 'Not set')}
            ${detailCard('Specialty', trainer.specialty)}
          </div>

          <div style="margin-top:18px;background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:16px">
            <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:13px">Availability</div>
            <div class="trainer-modal-grid two" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
              ${compactRow('Days', trainer.availability_days?.join(', ') || 'Not set')}
              ${compactRow('Working Hours', `${timeText(trainer.start_time)} - ${timeText(trainer.end_time)}`)}
            </div>
          </div>

          <div class="trainer-modal-grid two" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px">
            <div style="background:rgba(200,161,58,0.09);border:1px solid rgba(200,161,58,0.25);border-radius:18px;padding:16px">
              <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Payment</div>
              ${compactRow('Type', trainer.payment_type || 'Not set')}
              ${compactRow('Rate / Salary', formatCurrency(trainer.rate_amount))}
              ${compactRow('Method', trainer.payment_method || 'Not set')}
              ${compactRow('Reference', trainer.payment_reference || 'Not set')}
            </div>

            <div style="background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:16px">
              <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">System Access</div>
              ${compactRow('Dashboard Login', trainer.allow_dashboard_login ? 'Allowed' : 'Not allowed')}
              ${compactRow('Trainer App', trainer.trainer_app_access ? 'Enabled' : 'Disabled')}
              ${compactRow('Role', trainer.role || 'Trainer')}
              ${compactRow('Status', trainer.status)}
            </div>
          </div>

          ${
            trainer.bio
              ? `<div style="margin-top:18px;background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:16px">
                  <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Trainer Bio</div>
                  <div style="color:#d1d5db;font-size:14px;line-height:1.7;overflow-wrap:anywhere">${escapeHtml(trainer.bio)}</div>
                </div>`
              : ''
          }
        </div>
      `,
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      confirmButtonText: 'Close',
      width: 820,
      customClass: {
        popup: 'aurex-trainer-modal',
      },
    })
  }

  const handleDeleteTrainer = async (trainer) => {
    const confirmation = await Swal.fire({
      title: 'Delete trainer?',
      text: `${trainer.full_name} will be removed permanently.`,
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
      const response = await fetch(`${apiBaseUrl}/trainers/${trainer.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
        },
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to delete trainer.')
      }

      setTrainers((current) => current.filter((item) => item.id !== trainer.id))

      await Swal.fire({
        title: 'Trainer deleted',
        text: payload.message || 'Trainer deleted successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    } catch (caughtError) {
      await Swal.fire({
        title: 'Delete failed',
        text: caughtError.message || 'Unable to delete trainer.',
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
            const active = item.id === 'trainers'
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
          <p className="text-xs text-gray-500">Active Trainers</p>
          <h3 className="text-xl font-bold mt-1">{stats.active}</h3>
          <p className="text-xs text-[#C8A13A] mt-1">
            {stats.classes} classes this week
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
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black">Trainers</h1>
            <p className="text-gray-400 mt-1">
              Manage trainers, specialties, classes and assigned clients.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" className="border border-white/10 text-gray-300 px-5 py-3 rounded-2xl flex items-center justify-center gap-2 hover:border-[#C8A13A]">
              <Download size={18} />
              Export
            </button>
            <button type="button" onClick={() => onNavigate('add-trainer')} className="bg-[#C8A13A] text-black font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2">
              <Plus size={18} />
              Add Trainer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard icon={UserCog} title="Total Trainers" value={stats.total} />
          <StatCard icon={Users} title="Assigned Clients" value={stats.clients} />
          <StatCard icon={CalendarDays} title="Classes This Week" value={stats.classes} />
          <StatCard icon={Star} title="Average Rating" value={stats.rating} />
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 flex items-center gap-3 bg-[#050505] border border-white/10 rounded-2xl px-4 py-3">
              <Search size={20} className="text-gray-500 shrink-0" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search trainer..." className="bg-transparent outline-none w-full text-sm placeholder:text-gray-600" />
            </div>
            <select value={specialtyFilter} onChange={(event) => setSpecialtyFilter(event.target.value)} className="appearance-none bg-[#050505] border border-white/10 rounded-2xl px-4 py-3 text-gray-300 outline-none [color-scheme:dark]">
              {specialties.map((item) => (
                <option key={item} className="bg-[#050505] text-white">
                  {item}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="appearance-none bg-[#050505] border border-white/10 rounded-2xl px-4 py-3 text-gray-300 outline-none [color-scheme:dark]">
              {['All Status', 'Active', 'Inactive', 'On Leave'].map((item) => (
                <option key={item} className="bg-[#050505] text-white">
                  {item}
                </option>
              ))}
            </select>
            <button type="button" className="border border-white/10 px-5 py-3 rounded-2xl flex items-center justify-center gap-2 text-gray-300 hover:border-[#C8A13A]">
              <Filter size={18} />
              Filter
            </button>
          </div>
        </div>

        {isLoading && <PanelMessage>Loading trainers...</PanelMessage>}
        {!isLoading && error && <PanelMessage danger>{error}</PanelMessage>}
        {!isLoading && !error && filteredTrainers.length === 0 && (
          <PanelMessage>No trainers found.</PanelMessage>
        )}

        {!isLoading && !error && filteredTrainers.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {filteredTrainers.map((trainer) => (
              <div key={trainer.id} className="bg-[#111] border border-white/10 rounded-3xl p-6 hover:border-[#C8A13A]/60 transition">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 h-16 rounded-3xl bg-[#C8A13A] text-black font-black text-2xl flex items-center justify-center shrink-0">
                      {trainer.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl font-black truncate">{trainer.full_name}</h3>
                      <p className="text-gray-500 text-sm truncate">{trainer.phone}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                    trainer.status === 'Active'
                      ? 'bg-green-500/15 text-green-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}>
                    {trainer.status}
                  </span>
                </div>
                <div className="mt-6 bg-[#050505] border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <Dumbbell size={18} className="text-[#C8A13A] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-gray-500 text-xs">Specialty</p>
                      <h4 className="font-bold truncate">{trainer.specialty}</h4>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-5">
                  <MiniBox label="Classes" value={trainer.assigned_classes} />
                  <MiniBox label="Clients" value={trainer.assigned_clients} />
                  <MiniBox label="Rating" value={trainer.rating} />
                </div>
                <div className="flex gap-2 mt-6 pt-5 border-t border-white/10">
                  <ActionButton icon={Eye} onClick={() => handleViewTrainer(trainer)} />
                  <ActionButton icon={Edit} onClick={() => onNavigate('edit-trainer', trainer.id)} />
                  <ActionButton icon={Trash2} danger onClick={() => handleDeleteTrainer(trainer)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function detailRow(label, value) {
  return `
    <div style="display:flex;justify-content:space-between;gap:14px;border-bottom:1px solid rgba(255,255,255,0.1);padding:12px 0">
      <span style="color:#8f8f8f">${escapeHtml(label)}</span>
      <strong style="color:#fff;text-align:right">${escapeHtml(value || 'Not set')}</strong>
    </div>
  `
}

function metricCard(label, value) {
  return `
    <div style="background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:15px;min-width:0">
      <div style="color:#8f8f8f;font-size:12px;font-weight:800;margin-bottom:7px">${escapeHtml(label)}</div>
      <div style="color:#C8A13A;font-size:18px;font-weight:900;overflow-wrap:anywhere">${escapeHtml(value || '0')}</div>
    </div>
  `
}

function detailCard(label, value) {
  return `
    <div style="background:#0b0b0b;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:14px;min-width:0">
      <div style="color:#8f8f8f;font-size:12px;font-weight:800;margin-bottom:7px">${escapeHtml(label)}</div>
      <div style="color:#ffffff;font-size:15px;font-weight:800;overflow-wrap:anywhere">${escapeHtml(value || 'Not set')}</div>
    </div>
  `
}

function compactRow(label, value) {
  return `
    <div style="margin-bottom:10px">
      <div style="color:#8f8f8f;font-size:12px;font-weight:800;margin-bottom:5px">${escapeHtml(label)}</div>
      <div style="color:#ffffff;font-size:14px;font-weight:800;overflow-wrap:anywhere">${escapeHtml(value || 'Not set')}</div>
    </div>
  `
}

function formatCurrency(value) {
  if (!value) return 'Not set'

  return `TZS ${Number(value).toLocaleString()}`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function timeText(value) {
  if (!value) return 'Not set'
  return String(value).slice(0, 5)
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

function MiniBox({ label, value }) {
  return (
    <div className="bg-[#050505] border border-white/10 rounded-2xl p-3">
      <p className="text-gray-500 text-xs">{label}</p>
      <h4 className="font-bold mt-1">{value}</h4>
    </div>
  )
}

function ActionButton({ icon: Icon, danger = false, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 ${
      danger
        ? 'text-red-400 hover:bg-red-500/10'
        : 'text-gray-400 hover:text-[#C8A13A] hover:bg-white/5'
    }`}>
      <Icon size={17} />
    </button>
  )
}

function PanelMessage({ children, danger = false }) {
  return (
    <div className={`bg-[#111] border border-white/10 rounded-3xl p-8 text-center ${
      danger ? 'text-red-300' : 'text-gray-400'
    }`}>
      {children}
    </div>
  )
}
