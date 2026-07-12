import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle,
  Clock,
  CreditCard,
  QrCode,
  Save,
  Search,
  ShieldCheck,
  Smartphone,
  UserCheck,
  Users,
} from 'lucide-react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

const today = new Date().toISOString().slice(0, 10)
const currentTime = new Date().toTimeString().slice(0, 5)

export default function ManualCheckIn({ onBack }) {
  const [members, setMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    check_in_date: today,
    check_in_time: currentTime,
    entry_method: 'Manual Entry',
    gym_zone: 'Main Gym Floor',
    staff_notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let shouldUpdate = true

    const loadMembers = async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/attendance-members?search=${encodeURIComponent(searchTerm)}`,
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
            },
          },
        )
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load members.')
        }

        if (shouldUpdate) {
          setMembers(payload.members || [])
          if (!selectedMember && payload.members?.length) {
            setSelectedMember(payload.members[0])
          }
        }
      } catch {
        if (shouldUpdate) setMembers([])
      }
    }

    loadMembers()

    return () => {
      shouldUpdate = false
    }
  }, [searchTerm, selectedMember])

  const selectedPlan = useMemo(
    () => selectedMember?.membership_plan?.name || selectedMember?.membership_status || 'Not set',
    [selectedMember],
  )

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!selectedMember) {
      await Swal.fire({
        title: 'Select member',
        text: 'Choose a member before confirming check-in.',
        icon: 'warning',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
      return
    }

    const confirmation = await Swal.fire({
      title: 'Confirm check-in?',
      text: `${selectedMember.full_name} will be checked into the gym.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, check in',
      cancelButtonText: 'Cancel',
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      cancelButtonColor: '#2a2a2a',
    })

    if (!confirmation.isConfirmed) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`${apiBaseUrl}/attendance`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          member_id: selectedMember.id,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        const validationMessage = payload.errors
          ? Object.values(payload.errors).flat().join(' ')
          : payload.message

        throw new Error(validationMessage || 'Unable to check in member.')
      }

      await Swal.fire({
        title: 'Checked in',
        text: payload.message || 'Member checked in successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })

      onBack()
    } catch (caughtError) {
      await Swal.fire({
        title: 'Check-in failed',
        text: caughtError.message || 'Unable to check in member.',
        icon: 'error',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-5 sm:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-[#C8A13A] mb-4"
          >
            <ArrowLeft size={18} />
            Back to Attendance
          </button>

          <h1 className="text-4xl font-black">Manual Check-In</h1>
          <p className="text-gray-400 mt-1">
            Check a member into the gym when scanning is not available.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-[#C8A13A] disabled:opacity-60 text-black font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {isSubmitting ? 'Checking in...' : 'Confirm Check-In'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Section title="Find Member">
            <div className="flex items-center gap-3 bg-[#050505] border border-[#C8A13A]/40 rounded-2xl px-4 py-1 mb-5">
              <Search size={22} className="text-[#C8A13A] shrink-0" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, phone, member ID or email..."
                className="w-full bg-transparent outline-none py-4 text-white placeholder:text-gray-600"
              />
            </div>

            <div className="space-y-3">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedMember(member)}
                  className={`w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${
                    selectedMember?.id === member.id
                      ? 'border-[#C8A13A]/70 bg-[#C8A13A]/10'
                      : 'border-white/10 bg-[#050505] hover:border-[#C8A13A]/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#C8A13A]/15 text-[#C8A13A] flex items-center justify-center font-black shrink-0">
                      {member.full_name?.charAt(0) || 'M'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{member.full_name}</p>
                      <p className="text-gray-500 text-sm truncate">
                        {member.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:justify-end">
                    <span className="text-gray-400 text-sm">
                      {member.membership_plan?.name || member.membership_status}
                    </span>
                    <StatusBadge status={member.membership_status} />
                  </div>
                </button>
              ))}
              {members.length === 0 && (
                <div className="bg-[#050505] border border-white/10 rounded-2xl p-5 text-center text-gray-400">
                  No members found.
                </div>
              )}
            </div>
          </Section>

          <Section title="Check-In Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                icon={CalendarDays}
                label="Check-In Date"
                type="date"
                value={formData.check_in_date}
                onChange={(value) => updateField('check_in_date', value)}
              />
              <Input
                icon={Clock}
                label="Check-In Time"
                type="time"
                value={formData.check_in_time}
                onChange={(value) => updateField('check_in_time', value)}
              />
              <Select
                label="Entry Method"
                value={formData.entry_method}
                onChange={(value) => updateField('entry_method', value)}
                options={['Manual Entry', 'QR Code', 'Mobile App', 'Front Desk']}
              />
              <Select
                label="Gym Zone"
                value={formData.gym_zone}
                onChange={(value) => updateField('gym_zone', value)}
                options={[
                  'Main Gym Floor',
                  'Strength Zone',
                  'Cardio Zone',
                  'Class Studio',
                  'Personal Training',
                ]}
              />
            </div>

            <div className="mt-5">
              <TextArea
                label="Staff Notes"
                value={formData.staff_notes}
                onChange={(value) => updateField('staff_notes', value)}
                placeholder="Optional notes about this check-in."
              />
            </div>
          </Section>

          <Section title="Alternative Check-In">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <OptionCard icon={QrCode} title="Scan QR" desc="Use member QR code." />
              <OptionCard icon={CreditCard} title="Membership Card" desc="Enter card number." />
              <OptionCard icon={Smartphone} title="Mobile ID" desc="Use app account ID." />
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Selected Member">
            <div className="bg-[#050505] border border-[#C8A13A]/50 rounded-3xl p-5">
              {selectedMember ? (
                <>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-[#C8A13A]/15 text-[#C8A13A] flex items-center justify-center text-2xl font-black">
                      {selectedMember.full_name?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <h3 className="text-xl font-black">{selectedMember.full_name}</h3>
                      <p className="text-gray-500 text-sm">{selectedMember.phone}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mt-6">
                    <SummaryItem icon={CreditCard} label="Plan" value={selectedPlan} />
                    <SummaryItem icon={CalendarDays} label="Expires" value={formatDate(selectedMember.expiry_date)} />
                    <SummaryItem icon={CheckCircle} label="Payment" value={selectedMember.payment_status || 'Not set'} />
                    <SummaryItem icon={Users} label="Goal" value={selectedMember.fitness_goal || 'Not set'} />
                  </div>
                </>
              ) : (
                <p className="text-gray-400">Select a member to continue.</p>
              )}
            </div>
          </Section>

          <Section title="Access Status">
            <div className="flex gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
              <ShieldCheck className="text-green-400 shrink-0" />
              <div>
                <h4 className="font-bold text-green-400">
                  {selectedMember?.membership_status === 'Active' ? 'Allowed' : 'Review'}
                </h4>
                <p className="text-gray-400 text-sm mt-1">
                  {selectedMember?.membership_status === 'Active'
                    ? 'Membership is active.'
                    : 'Confirm membership status before entry.'}
                </p>
              </div>
            </div>
          </Section>

          <Section title="Today Summary">
            <SummaryItem icon={UserCheck} label="Current Inside" value="Live" />
            <SummaryItem icon={Clock} label="Entry Time" value={formData.check_in_time} />
            <SummaryItem icon={Users} label="Selected Plan" value={selectedPlan} />
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
      <h2 className="text-xl font-bold mb-5">{title}</h2>
      {children}
    </div>
  )
}

function Input({ label, icon: Icon, type = 'text', placeholder, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <div className="flex items-center bg-[#050505] border border-white/10 rounded-2xl px-4">
        {Icon && <Icon size={18} className="text-[#C8A13A] mr-3 shrink-0" />}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none py-4 text-white placeholder:text-gray-600 [color-scheme:dark]"
        />
      </div>
    </div>
  )
}

function Select({ label, options, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none bg-[#050505] border border-white/10 rounded-2xl px-4 py-4 text-white outline-none [color-scheme:dark]"
      >
        {options.map((item) => (
          <option key={item} className="bg-[#050505] text-white">
            {item}
          </option>
        ))}
      </select>
    </div>
  )
}

function TextArea({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <textarea
        rows="5"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#050505] border border-white/10 rounded-2xl px-4 py-4 text-white outline-none placeholder:text-gray-600 resize-none"
      />
    </div>
  )
}

function OptionCard({ icon: Icon, title, desc }) {
  return (
    <button
      type="button"
      className="bg-[#050505] border border-white/10 rounded-2xl p-5 text-left hover:border-[#C8A13A]/50 transition"
    >
      <Icon size={26} className="text-[#C8A13A]" />
      <h3 className="font-bold mt-4">{title}</h3>
      <p className="text-gray-500 text-sm mt-1">{desc}</p>
    </button>
  )
}

function SummaryItem({ icon: Icon, label, value }) {
  return (
    <div className="flex justify-between items-center gap-4 py-4 border-b border-white/10 last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <Icon size={18} className="text-[#C8A13A] shrink-0" />
        <span className="text-gray-400 text-sm truncate">{label}</span>
      </div>
      <span className="font-bold text-right">{value}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const active = status === 'Active'

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold ${
        active ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
      }`}
    >
      {status}
    </span>
  )
}

function formatDate(value) {
  if (!value) return 'Not set'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}
