import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Dumbbell,
  MapPin,
  Save,
  Upload,
  Users,
  Wallet,
} from 'lucide-react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

const emptyClass = {
  name: '',
  class_type: 'HIIT',
  workout_level: 'All Levels',
  status: 'Active',
  capacity: '',
  booked_slots: '0',
  location: '',
  description: '',
  trainer_name: '',
  class_date: '',
  start_time: '',
  end_time: '',
  repeat_schedule: 'Does Not Repeat',
  booking_required: true,
  booking_deadline: '',
  cancellation_deadline: '',
  late_entry_limit: '',
  waitlist_limit: '',
  notes: '',
  price_amount: '',
  currency: 'TZS',
  show_in_mobile_app: true,
  allow_booking_from_app: true,
  access_type: 'Members Only',
}

export default function AddClass({ onBack, classId = null }) {
  const [formData, setFormData] = useState({ ...emptyClass })
  const [isLoading, setIsLoading] = useState(Boolean(classId))
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!classId) return

    let shouldUpdate = true

    const loadClass = async () => {
      setIsLoading(true)

      try {
        const response = await fetch(`${apiBaseUrl}/classes/${classId}`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
          },
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load class.')
        }

        if (!shouldUpdate) return

        const gymClass = payload.class

        setFormData({
          name: gymClass.name || '',
          class_type: gymClass.class_type || 'HIIT',
          workout_level: gymClass.workout_level || 'All Levels',
          status: gymClass.status || 'Active',
          capacity: String(gymClass.capacity ?? ''),
          booked_slots: String(gymClass.booked_slots ?? 0),
          location: gymClass.location || '',
          description: gymClass.description || '',
          trainer_name: gymClass.trainer_name || '',
          class_date: dateInputValue(gymClass.class_date),
          start_time: timeInputValue(gymClass.start_time),
          end_time: timeInputValue(gymClass.end_time),
          repeat_schedule: gymClass.repeat_schedule || 'Does Not Repeat',
          booking_required: Boolean(gymClass.booking_required),
          booking_deadline: gymClass.booking_deadline || '',
          cancellation_deadline: gymClass.cancellation_deadline || '',
          late_entry_limit: gymClass.late_entry_limit || '',
          waitlist_limit: gymClass.waitlist_limit
            ? String(gymClass.waitlist_limit)
            : '',
          notes: gymClass.notes || '',
          price_amount: String(gymClass.price_amount ?? ''),
          currency: gymClass.currency || 'TZS',
          show_in_mobile_app: Boolean(gymClass.show_in_mobile_app),
          allow_booking_from_app: Boolean(gymClass.allow_booking_from_app),
          access_type: gymClass.access_type || 'Members Only',
        })
      } catch (caughtError) {
        await Swal.fire({
          title: 'Load failed',
          text: caughtError.message || 'Unable to load class.',
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

    loadClass()

    return () => {
      shouldUpdate = false
    }
  }, [classId, onBack])

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const confirmation = await Swal.fire({
      title: classId ? 'Update class?' : 'Save class?',
      text: 'This class will be available in the admin dashboard.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: classId ? 'Yes, update class' : 'Yes, save class',
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
        `${apiBaseUrl}/classes${classId ? `/${classId}` : ''}`,
        {
          method: classId ? 'PUT' : 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            capacity: Number(formData.capacity || 0),
            booked_slots: Number(formData.booked_slots || 0),
            waitlist_limit: formData.waitlist_limit
              ? Number(formData.waitlist_limit)
              : null,
            price_amount: Number(formData.price_amount || 0),
            class_date: formData.class_date || null,
            start_time: formData.start_time || null,
            end_time: formData.end_time || null,
            location: formData.location || null,
            description: formData.description || null,
            trainer_name: formData.trainer_name || null,
            booking_deadline: formData.booking_deadline || null,
            cancellation_deadline: formData.cancellation_deadline || null,
            late_entry_limit: formData.late_entry_limit || null,
            notes: formData.notes || null,
          }),
        },
      )
      const payload = await response.json()

      if (!response.ok) {
        const validationMessage = payload.errors
          ? Object.values(payload.errors).flat().join(' ')
          : payload.message

        throw new Error(validationMessage || 'Unable to save class.')
      }

      await Swal.fire({
        title: classId ? 'Class updated' : 'Class saved',
        text:
          payload.message || `Class ${classId ? 'updated' : 'created'} successfully.`,
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })

      onBack()
    } catch (caughtError) {
      await Swal.fire({
        title: 'Save failed',
        text: caughtError.message || 'Unable to save class.',
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
            Back to Classes
          </button>

          <h1 className="text-4xl font-black">
            {classId ? 'Edit Class' : 'Add Class'}
          </h1>
          <p className="text-gray-400 mt-1">
            Create gym classes, assign trainers, schedule sessions and set
            capacity.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#C8A13A] text-black font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {isSubmitting ? 'Saving...' : classId ? 'Update Class' : 'Save Class'}
        </button>
      </div>

      {isLoading ? (
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
          Loading class...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Section title="Class Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  icon={Dumbbell}
                  label="Class Name"
                  value={formData.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Morning HIIT"
                />
                <Select
                  label="Class Type"
                  value={formData.class_type}
                  onChange={(event) =>
                    updateField('class_type', event.target.value)
                  }
                  options={[
                    'HIIT',
                    'Strength',
                    'Cardio',
                    'Yoga',
                    'Beginner Fitness',
                    'Bodybuilding',
                  ]}
                />
                <Select
                  label="Workout Level"
                  value={formData.workout_level}
                  onChange={(event) =>
                    updateField('workout_level', event.target.value)
                  }
                  options={[
                    'Beginner',
                    'Intermediate',
                    'Advanced',
                    'Elite',
                    'All Levels',
                  ]}
                />
                <Select
                  label="Class Status"
                  value={formData.status}
                  onChange={(event) => updateField('status', event.target.value)}
                  options={['Active', 'Draft', 'Cancelled', 'Hidden']}
                />
                <Input
                  icon={Users}
                  label="Class Capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(event) => updateField('capacity', event.target.value)}
                  placeholder="25"
                />
                <Input
                  icon={MapPin}
                  label="Location / Room"
                  value={formData.location}
                  onChange={(event) => updateField('location', event.target.value)}
                  placeholder="Main Training Hall"
                />
                <Input
                  icon={Wallet}
                  label="Class Price"
                  type="number"
                  value={formData.price_amount}
                  onChange={(event) =>
                    updateField('price_amount', event.target.value)
                  }
                  placeholder="15000"
                />
                <Input
                  label="Booked Slots"
                  type="number"
                  value={formData.booked_slots}
                  onChange={(event) =>
                    updateField('booked_slots', event.target.value)
                  }
                  placeholder="0"
                />
              </div>

              <div className="mt-5">
                <TextArea
                  label="Class Description"
                  value={formData.description}
                  onChange={(event) =>
                    updateField('description', event.target.value)
                  }
                  placeholder="High intensity class designed to burn calories and improve endurance."
                />
              </div>
            </Section>

            <Section title="Trainer & Schedule">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Assign Trainer"
                  value={formData.trainer_name}
                  onChange={(event) =>
                    updateField('trainer_name', event.target.value)
                  }
                  placeholder="Coach Daniel"
                />
                <Input
                  icon={CalendarDays}
                  label="Class Date"
                  type="date"
                  value={formData.class_date}
                  onChange={(event) =>
                    updateField('class_date', event.target.value)
                  }
                />
                <Input
                  icon={Clock}
                  label="Start Time"
                  type="time"
                  value={formData.start_time}
                  onChange={(event) =>
                    updateField('start_time', event.target.value)
                  }
                />
                <Input
                  icon={Clock}
                  label="End Time"
                  type="time"
                  value={formData.end_time}
                  onChange={(event) => updateField('end_time', event.target.value)}
                />
                <Select
                  label="Repeat Schedule"
                  value={formData.repeat_schedule}
                  onChange={(event) =>
                    updateField('repeat_schedule', event.target.value)
                  }
                  options={['Does Not Repeat', 'Daily', 'Weekly', 'Monthly']}
                />
                <Select
                  label="Booking Required"
                  value={formData.booking_required ? 'Yes' : 'No'}
                  onChange={(event) =>
                    updateField('booking_required', event.target.value === 'Yes')
                  }
                  options={['Yes', 'No']}
                />
              </div>
            </Section>

            <Section title="Class Rules">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Booking Deadline"
                  value={formData.booking_deadline}
                  onChange={(event) =>
                    updateField('booking_deadline', event.target.value)
                  }
                  placeholder="2 hours before class"
                />
                <Input
                  label="Cancellation Deadline"
                  value={formData.cancellation_deadline}
                  onChange={(event) =>
                    updateField('cancellation_deadline', event.target.value)
                  }
                  placeholder="1 hour before class"
                />
                <Input
                  label="Late Entry Limit"
                  value={formData.late_entry_limit}
                  onChange={(event) =>
                    updateField('late_entry_limit', event.target.value)
                  }
                  placeholder="10 minutes"
                />
                <Input
                  label="Waitlist Limit"
                  type="number"
                  value={formData.waitlist_limit}
                  onChange={(event) =>
                    updateField('waitlist_limit', event.target.value)
                  }
                  placeholder="10"
                />
              </div>

              <div className="mt-5">
                <TextArea
                  label="Class Notes"
                  value={formData.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  placeholder="Members should arrive early, carry water and wear proper training shoes."
                />
              </div>
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="Class Cover Image">
              <UploadBox title="Upload Class Photo" desc="PNG / JPG / WEBP" />
            </Section>

            <Section title="Mobile App Settings">
              <Select
                label="Show In Mobile App"
                value={formData.show_in_mobile_app ? 'Yes' : 'No'}
                onChange={(event) =>
                  updateField('show_in_mobile_app', event.target.value === 'Yes')
                }
                options={['Yes', 'No']}
              />

              <div className="mt-5">
                <Select
                  label="Allow Booking From App"
                  value={formData.allow_booking_from_app ? 'Yes' : 'No'}
                  onChange={(event) =>
                    updateField(
                      'allow_booking_from_app',
                      event.target.value === 'Yes',
                    )
                  }
                  options={['Yes', 'No']}
                />
              </div>

              <div className="mt-5">
                <Select
                  label="Access Type"
                  value={formData.access_type}
                  onChange={(event) =>
                    updateField('access_type', event.target.value)
                  }
                  options={['Free', 'Members Only', 'Premium']}
                />
              </div>
            </Section>

            <div className="bg-[#111] border border-[#C8A13A]/50 rounded-3xl p-6">
              <h3 className="text-xl font-bold mb-4">Class Preview</h3>
              <div className="h-36 rounded-3xl bg-gradient-to-br from-[#151515] to-black flex items-center justify-center mb-5">
                <Dumbbell size={55} className="text-[#C8A13A]" />
              </div>
              <h4 className="text-2xl font-black">
                {formData.name || 'Class Name'}
              </h4>
              <p className="text-gray-500 text-sm mt-1">
                {formData.trainer_name || 'Trainer'} - {formData.start_time || 'Time'}
              </p>
              <div className="grid grid-cols-2 gap-3 mt-5">
                <MiniBox label="Capacity" value={formData.capacity || '0'} />
                <MiniBox label="Level" value={formData.workout_level} />
                <MiniBox label="Type" value={formData.class_type} />
                <MiniBox
                  label="Price"
                  value={`TZS ${Number(formData.price_amount || 0).toLocaleString()}`}
                />
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

function Input({
  label,
  placeholder,
  icon: Icon,
  type = 'text',
  value,
  onChange,
}) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <div className="flex items-center bg-[#050505] border border-white/10 rounded-2xl px-4">
        {Icon && <Icon size={18} className="text-[#C8A13A] mr-3 shrink-0" />}
        <input
          type={type}
          value={value}
          onChange={onChange}
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
        onChange={onChange}
        className="w-full appearance-none bg-[#050505] border border-white/10 rounded-2xl px-4 py-4 text-white outline-none [color-scheme:dark]"
      >
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
      <textarea
        rows="5"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[#050505] border border-white/10 rounded-2xl px-4 py-4 text-white outline-none placeholder:text-gray-600 resize-none"
      />
    </div>
  )
}

function UploadBox({ title, desc }) {
  return (
    <div className="h-48 rounded-3xl bg-[#050505] border border-dashed border-[#C8A13A]/40 flex flex-col items-center justify-center text-center">
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
      <h4 className="font-bold text-sm mt-1 break-words">{value}</h4>
    </div>
  )
}
