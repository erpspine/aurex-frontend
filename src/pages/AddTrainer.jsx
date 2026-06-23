import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

import {
  ArrowLeft,
  CalendarDays,
  Dumbbell,
  Mail,
  MapPin,
  Phone,
  Save,
  Star,
  Upload,
  UserCog,
  Wallet,
} from 'lucide-react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'
const weekDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const emptyTrainer = {
  full_name: '',
  phone: '',
  email: '',
  gender: 'Male',
  date_of_birth: '',
  address: '',
  specialty: 'Strength Training',
  experience: '',
  certification: '',
  status: 'Active',
  assigned_classes: '',
  assigned_clients: '',
  rating: '0',
  bio: '',
  availability_days: [],
  start_time: '',
  end_time: '',
  payment_type: 'Monthly Salary',
  rate_amount: '',
  payment_method: 'M-Pesa',
  payment_reference: '',
  allow_dashboard_login: false,
  trainer_app_access: true,
  role: 'Trainer',
}

export default function AddTrainer({ onBack, trainerId = null }) {
  const [formData, setFormData] = useState({ ...emptyTrainer })
  const [isLoading, setIsLoading] = useState(Boolean(trainerId))
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!trainerId) return

    let shouldUpdate = true

    const loadTrainer = async () => {
      setIsLoading(true)

      try {
        const response = await fetch(`${apiBaseUrl}/trainers/${trainerId}`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
          },
        })
        const payload = await response.json()

        if (!response.ok) throw new Error(payload.message || 'Unable to load trainer.')
        if (!shouldUpdate) return

        const trainer = payload.trainer

        setFormData({
          full_name: trainer.full_name || '',
          phone: trainer.phone || '',
          email: trainer.email || '',
          gender: trainer.gender || 'Male',
          date_of_birth: dateInputValue(trainer.date_of_birth),
          address: trainer.address || '',
          specialty: trainer.specialty || 'Strength Training',
          experience: trainer.experience || '',
          certification: trainer.certification || '',
          status: trainer.status || 'Active',
          assigned_classes: String(trainer.assigned_classes ?? ''),
          assigned_clients: String(trainer.assigned_clients ?? ''),
          rating: String(trainer.rating ?? 0),
          bio: trainer.bio || '',
          availability_days: trainer.availability_days || [],
          start_time: timeInputValue(trainer.start_time),
          end_time: timeInputValue(trainer.end_time),
          payment_type: trainer.payment_type || 'Monthly Salary',
          rate_amount: trainer.rate_amount ? String(trainer.rate_amount) : '',
          payment_method: trainer.payment_method || 'M-Pesa',
          payment_reference: trainer.payment_reference || '',
          allow_dashboard_login: Boolean(trainer.allow_dashboard_login),
          trainer_app_access: Boolean(trainer.trainer_app_access),
          role: trainer.role || 'Trainer',
        })
      } catch (caughtError) {
        await Swal.fire({
          title: 'Load failed',
          text: caughtError.message || 'Unable to load trainer.',
          icon: 'error',
          background: '#101010',
          color: '#ffffff',
          confirmButtonColor: '#C8A13A',
        })
        onBack()
      } finally {
        if (shouldUpdate) setIsLoading(false)
      }
    }

    loadTrainer()

    return () => {
      shouldUpdate = false
    }
  }, [onBack, trainerId])

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const toggleAvailabilityDay = (day) => {
    setFormData((current) => ({
      ...current,
      availability_days: current.availability_days.includes(day)
        ? current.availability_days.filter((item) => item !== day)
        : [...current.availability_days, day],
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const confirmation = await Swal.fire({
      title: trainerId ? 'Update trainer?' : 'Save trainer?',
      text: 'This trainer profile will be available in the admin dashboard.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: trainerId ? 'Yes, update trainer' : 'Yes, save trainer',
      cancelButtonText: 'Cancel',
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      cancelButtonColor: '#2a2a2a',
    })

    if (!confirmation.isConfirmed) return

    setIsSubmitting(true)

    try {
      const response = await fetch(
        `${apiBaseUrl}/trainers${trainerId ? `/${trainerId}` : ''}`,
        {
          method: trainerId ? 'PUT' : 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            email: formData.email || null,
            date_of_birth: formData.date_of_birth || null,
            address: formData.address || null,
            experience: formData.experience || null,
            certification: formData.certification || null,
            assigned_classes: Number(formData.assigned_classes || 0),
            assigned_clients: Number(formData.assigned_clients || 0),
            rating: Number(formData.rating || 0),
            bio: formData.bio || null,
            start_time: formData.start_time || null,
            end_time: formData.end_time || null,
            payment_type: formData.payment_type || null,
            rate_amount: formData.rate_amount ? Number(formData.rate_amount) : null,
            payment_method: formData.payment_method || null,
            payment_reference: formData.payment_reference || null,
          }),
        },
      )
      const payload = await response.json()

      if (!response.ok) {
        const validationMessage = payload.errors
          ? Object.values(payload.errors).flat().join(' ')
          : payload.message
        throw new Error(validationMessage || 'Unable to save trainer.')
      }

      await Swal.fire({
        title: trainerId ? 'Trainer updated' : 'Trainer saved',
        text:
          payload.message ||
          `Trainer ${trainerId ? 'updated' : 'created'} successfully.`,
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })

      onBack()
    } catch (caughtError) {
      await Swal.fire({
        title: 'Save failed',
        text: caughtError.message || 'Unable to save trainer.',
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
    <form
      onSubmit={handleSubmit}
      className="min-h-screen bg-[#050505] text-white p-5 sm:p-8"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-[#C8A13A] mb-4"
          >
            <ArrowLeft size={18} />
            Back to Trainers
          </button>
          <h1 className="text-4xl font-black">
            {trainerId ? 'Edit Trainer' : 'Add Trainer'}
          </h1>
          <p className="text-gray-400 mt-1">
            Register trainers, specialties, availability and payment details.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#C8A13A] text-black font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {isSubmitting
            ? 'Saving...'
            : trainerId
              ? 'Update Trainer'
              : 'Save Trainer'}
        </button>
      </div>

      {isLoading ? (
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
          Loading trainer...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Section title="Personal Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input icon={UserCog} label="Full Name" value={formData.full_name} onChange={(event) => updateField('full_name', event.target.value)} placeholder="Coach Daniel" />
                <Input icon={Phone} label="Phone Number" value={formData.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="+255 712 345 678" />
                <Input icon={Mail} label="Email Address" value={formData.email} onChange={(event) => updateField('email', event.target.value)} placeholder="coach@aurex.com" />
                <Select label="Gender" value={formData.gender} onChange={(event) => updateField('gender', event.target.value)} options={['Male', 'Female']} />
                <Input icon={CalendarDays} label="Date of Birth" type="date" value={formData.date_of_birth} onChange={(event) => updateField('date_of_birth', event.target.value)} />
                <Input icon={MapPin} label="Address" value={formData.address} onChange={(event) => updateField('address', event.target.value)} placeholder="Arusha, Tanzania" />
              </div>
            </Section>

            <Section title="Professional Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select label="Specialty" value={formData.specialty} onChange={(event) => updateField('specialty', event.target.value)} options={['Strength Training', 'HIIT & Weight Loss', 'Bodybuilding', 'Beginner Fitness', 'Cardio', 'Nutrition Coach']} />
                <Input icon={Dumbbell} label="Experience" value={formData.experience} onChange={(event) => updateField('experience', event.target.value)} placeholder="5 years" />
                <Input icon={Star} label="Certification" value={formData.certification} onChange={(event) => updateField('certification', event.target.value)} placeholder="ACE / NASM / Local Certificate" />
                <Select label="Trainer Status" value={formData.status} onChange={(event) => updateField('status', event.target.value)} options={['Active', 'Inactive', 'On Leave']} />
                <Input label="Assigned Classes" type="number" value={formData.assigned_classes} onChange={(event) => updateField('assigned_classes', event.target.value)} placeholder="12" />
                <Input label="Assigned Clients" type="number" value={formData.assigned_clients} onChange={(event) => updateField('assigned_clients', event.target.value)} placeholder="34" />
                <Input label="Rating" type="number" value={formData.rating} onChange={(event) => updateField('rating', event.target.value)} placeholder="4.8" />
              </div>
              <div className="mt-5">
                <TextArea label="Trainer Bio" value={formData.bio} onChange={(event) => updateField('bio', event.target.value)} placeholder="Experienced coach specializing in transformation programs." />
              </div>
            </Section>

            <Section title="Availability">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {weekDays.map((day) => (
                  <label key={day} className="flex items-center gap-2 bg-[#050505] border border-white/10 rounded-2xl px-4 py-3 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.availability_days.includes(day)}
                      onChange={() => toggleAvailabilityDay(day)}
                      className="accent-[#C8A13A]"
                    />
                    {day}
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                <Input label="Start Time" type="time" value={formData.start_time} onChange={(event) => updateField('start_time', event.target.value)} />
                <Input label="End Time" type="time" value={formData.end_time} onChange={(event) => updateField('end_time', event.target.value)} />
              </div>
            </Section>

            <Section title="Payment Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select label="Payment Type" value={formData.payment_type} onChange={(event) => updateField('payment_type', event.target.value)} options={['Monthly Salary', 'Per Class', 'Per Client', 'Commission']} />
                <Input icon={Wallet} label="Rate / Salary" type="number" value={formData.rate_amount} onChange={(event) => updateField('rate_amount', event.target.value)} placeholder="800000" />
                <Select label="Payment Method" value={formData.payment_method} onChange={(event) => updateField('payment_method', event.target.value)} options={['Cash', 'M-Pesa', 'Bank Transfer']} />
                <Input label="Payment Reference / Account" value={formData.payment_reference} onChange={(event) => updateField('payment_reference', event.target.value)} placeholder="Bank or mobile number" />
              </div>
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="Trainer Photo">
              <UploadBox title="Upload Trainer Photo" desc="PNG / JPG / WEBP" />
            </Section>
            <Section title="System Access">
              <Select label="Allow Dashboard Login" value={formData.allow_dashboard_login ? 'Yes' : 'No'} onChange={(event) => updateField('allow_dashboard_login', event.target.value === 'Yes')} options={['Yes', 'No']} />
              <div className="mt-5">
                <Select label="Trainer App Access" value={formData.trainer_app_access ? 'Yes' : 'No'} onChange={(event) => updateField('trainer_app_access', event.target.value === 'Yes')} options={['Yes', 'No']} />
              </div>
              <div className="mt-5">
                <Select label="Role" value={formData.role} onChange={(event) => updateField('role', event.target.value)} options={['Trainer', 'Senior Trainer', 'Head Coach']} />
              </div>
            </Section>
            <div className="bg-[#111] border border-[#C8A13A]/50 rounded-3xl p-6">
              <h3 className="text-xl font-bold mb-4">Trainer Preview</h3>
              <div className="w-24 h-24 rounded-3xl bg-[#C8A13A] text-black text-4xl font-black flex items-center justify-center mb-5">
                {(formData.full_name || 'T').charAt(0)}
              </div>
              <h4 className="text-2xl font-black">{formData.full_name || 'Trainer Name'}</h4>
              <p className="text-gray-500 text-sm mt-1">{formData.specialty}</p>
              <div className="grid grid-cols-2 gap-3 mt-5">
                <MiniBox label="Classes" value={formData.assigned_classes || '0'} />
                <MiniBox label="Clients" value={formData.assigned_clients || '0'} />
                <MiniBox label="Rating" value={formData.rating || '0'} />
                <MiniBox label="Status" value={formData.status} />
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}

function dateInputValue(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function timeInputValue(value) {
  if (!value) return ''
  return String(value).slice(0, 5)
}

function Section({ title, children }) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
      <h2 className="text-xl font-bold mb-5">{title}</h2>
      {children}
    </div>
  )
}

function Input({ label, placeholder, icon: Icon, type = 'text', value, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <div className="flex items-center bg-[#050505] border border-white/10 rounded-2xl px-4">
        {Icon && <Icon size={18} className="text-[#C8A13A] mr-3 shrink-0" />}
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-transparent outline-none py-4 text-white placeholder:text-gray-600 [color-scheme:dark]" />
      </div>
    </div>
  )
}

function Select({ label, options, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <select value={value} onChange={onChange} className="w-full appearance-none bg-[#050505] border border-white/10 rounded-2xl px-4 py-4 text-white outline-none [color-scheme:dark]">
        {options.map((item) => (
          <option key={item} value={item} className="bg-[#050505] text-white">
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
      <textarea rows="5" value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-[#050505] border border-white/10 rounded-2xl px-4 py-4 text-white outline-none placeholder:text-gray-600 resize-none" />
    </div>
  )
}

function UploadBox({ title, desc }) {
  return (
    <div className="h-44 rounded-3xl bg-[#050505] border border-dashed border-[#C8A13A]/40 flex flex-col items-center justify-center text-center">
      <Upload size={34} className="text-[#C8A13A]" />
      <h4 className="font-bold mt-3">{title}</h4>
      <p className="text-gray-500 text-sm mt-1">{desc}</p>
    </div>
  )
}

function MiniBox({ label, value }) {
  return (
    <div className="bg-[#050505] border border-white/10 rounded-2xl p-3">
      <p className="text-gray-500 text-xs">{label}</p>
      <h4 className="font-bold text-sm mt-1">{value}</h4>
    </div>
  )
}
