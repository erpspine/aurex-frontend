import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

import {
  Activity,
  ArrowLeft,
  Calendar,
  Dumbbell,
  Hash,
  MapPin,
  Save,
  ShieldCheck,
  Upload,
  Video,
  Wallet,
  Wrench,
} from 'lucide-react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

const emptyEquipment = {
  name: '',
  category: 'Machines',
  brand: '',
  model: '',
  serial_number: '',
  location: '',
  primary_muscle_group: 'Shoulders',
  secondary_muscle_group: 'None',
  supported_level: 'All Levels',
  linked_exercises: '',
  purchase_date: '',
  purchase_price: '',
  last_service_date: '',
  next_service_date: '',
  status: 'Active',
  maintenance_priority: 'Low',
  description: '',
  safety_instructions: '',
  operation_video_url: '',
  operation_video_file: null,
  show_in_mobile_app: true,
  access_type: 'Members Only',
  publish_status: 'Published',
}

export default function AddEquipment({ onBack, equipmentId = null }) {
  const [formData, setFormData] = useState({ ...emptyEquipment })
  const [isLoading, setIsLoading] = useState(Boolean(equipmentId))
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!equipmentId) return

    let shouldUpdate = true

    const loadEquipment = async () => {
      setIsLoading(true)

      try {
        const response = await fetch(`${apiBaseUrl}/equipment/${equipmentId}`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
          },
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load equipment.')
        }

        if (!shouldUpdate) return

        const equipment = payload.equipment

        setFormData({
          name: equipment.name || '',
          category: equipment.category || 'Machines',
          brand: equipment.brand || '',
          model: equipment.model || '',
          serial_number: equipment.serial_number || '',
          location: equipment.location || '',
          primary_muscle_group: equipment.primary_muscle_group || 'Shoulders',
          secondary_muscle_group: equipment.secondary_muscle_group || 'None',
          supported_level: equipment.supported_level || 'All Levels',
          linked_exercises: String(equipment.linked_exercises ?? ''),
          purchase_date: dateInputValue(equipment.purchase_date),
          purchase_price: equipment.purchase_price
            ? String(equipment.purchase_price)
            : '',
          last_service_date: dateInputValue(equipment.last_service_date),
          next_service_date: dateInputValue(equipment.next_service_date),
          status: equipment.status || 'Active',
          maintenance_priority: equipment.maintenance_priority || 'Low',
          description: equipment.description || '',
          safety_instructions: equipment.safety_instructions || '',
          operation_video_url: equipment.operation_video_url || '',
          operation_video_file: null,
          show_in_mobile_app: Boolean(equipment.show_in_mobile_app),
          access_type: equipment.access_type || 'Members Only',
          publish_status: equipment.publish_status || 'Published',
        })
      } catch (caughtError) {
        await Swal.fire({
          title: 'Load failed',
          text: caughtError.message || 'Unable to load equipment.',
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

    loadEquipment()

    return () => {
      shouldUpdate = false
    }
  }, [equipmentId, onBack])

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const videoPreviewUrl = useVideoPreview(
    formData.operation_video_file,
    formData.operation_video_url,
  )

  const handleSubmit = async (event) => {
    event.preventDefault()

    const confirmation = await Swal.fire({
      title: equipmentId ? 'Update equipment?' : 'Save equipment?',
      text: 'This equipment record will be available in the admin dashboard.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: equipmentId ? 'Yes, update equipment' : 'Yes, save equipment',
      cancelButtonText: 'Cancel',
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      cancelButtonColor: '#2a2a2a',
    })

    if (!confirmation.isConfirmed) return

    setIsSubmitting(true)

    try {
      const payloadData = new FormData()
      const payloadFields = {
        ...formData,
        serial_number: formData.serial_number || '',
        brand: formData.brand || '',
        model: formData.model || '',
        location: formData.location || '',
        linked_exercises: String(Number(formData.linked_exercises || 0)),
        purchase_date: formData.purchase_date || '',
        purchase_price: formData.purchase_price
          ? String(Number(formData.purchase_price))
          : '',
        last_service_date: formData.last_service_date || '',
        next_service_date: formData.next_service_date || '',
        description: formData.description || '',
        safety_instructions: formData.safety_instructions || '',
        show_in_mobile_app: formData.show_in_mobile_app ? '1' : '0',
      }

      delete payloadFields.operation_video_url
      delete payloadFields.operation_video_file

      if (equipmentId) {
        payloadData.append('_method', 'PUT')
      }

      Object.entries(payloadFields).forEach(([key, value]) => {
        payloadData.append(key, value)
      })

      if (formData.operation_video_file) {
        payloadData.append('operation_video_file', formData.operation_video_file)
      }

      const response = await fetch(
        `${apiBaseUrl}/equipment${equipmentId ? `/${equipmentId}` : ''}`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
          },
          body: payloadData,
        },
      )
      const payload = await response.json()

      if (!response.ok) {
        const validationMessage = payload.errors
          ? Object.values(payload.errors).flat().join(' ')
          : payload.message

        throw new Error(validationMessage || 'Unable to save equipment.')
      }

      await Swal.fire({
        title: equipmentId ? 'Equipment updated' : 'Equipment saved',
        text:
          payload.message ||
          `Equipment ${equipmentId ? 'updated' : 'created'} successfully.`,
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })

      onBack()
    } catch (caughtError) {
      await Swal.fire({
        title: 'Save failed',
        text: caughtError.message || 'Unable to save equipment.',
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
            Back to Equipment
          </button>

          <h1 className="text-4xl font-black">
            {equipmentId ? 'Edit Equipment' : 'Add Equipment'}
          </h1>
          <p className="text-gray-400 mt-1">
            Register gym equipment and link it to exercises in the mobile app.
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
            : equipmentId
              ? 'Update Equipment'
              : 'Save Equipment'}
        </button>
      </div>

      {isLoading ? (
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
          Loading equipment...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Section title="Basic Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  icon={Dumbbell}
                  label="Equipment Name"
                  value={formData.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Shoulder Press Machine"
                />
                <Select
                  label="Category"
                  value={formData.category}
                  onChange={(event) => updateField('category', event.target.value)}
                  options={[
                    'Machines',
                    'Free Weights',
                    'Cardio',
                    'Benches',
                    'Accessories',
                  ]}
                />
                <Input
                  label="Brand"
                  value={formData.brand}
                  onChange={(event) => updateField('brand', event.target.value)}
                  placeholder="Technogym"
                />
                <Input
                  label="Model"
                  value={formData.model}
                  onChange={(event) => updateField('model', event.target.value)}
                  placeholder="SP-900"
                />
                <Input
                  icon={Hash}
                  label="Serial Number"
                  value={formData.serial_number}
                  onChange={(event) =>
                    updateField('serial_number', event.target.value)
                  }
                  placeholder="AUX-SP-0001"
                />
                <Input
                  icon={MapPin}
                  label="Location"
                  value={formData.location}
                  onChange={(event) => updateField('location', event.target.value)}
                  placeholder="Strength Zone"
                />
              </div>
            </Section>

            <Section title="Training Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select
                  label="Primary Muscle Group"
                  value={formData.primary_muscle_group}
                  onChange={(event) =>
                    updateField('primary_muscle_group', event.target.value)
                  }
                  options={[
                    'Shoulders',
                    'Chest',
                    'Back',
                    'Arms',
                    'Abs',
                    'Legs',
                    'Full Body',
                  ]}
                />
                <Select
                  label="Secondary Muscle Group"
                  value={formData.secondary_muscle_group}
                  onChange={(event) =>
                    updateField('secondary_muscle_group', event.target.value)
                  }
                  options={[
                    'Triceps',
                    'Biceps',
                    'Core',
                    'Upper Chest',
                    'Glutes',
                    'None',
                  ]}
                />
                <Select
                  label="Supported Level"
                  value={formData.supported_level}
                  onChange={(event) =>
                    updateField('supported_level', event.target.value)
                  }
                  options={[
                    'Beginner',
                    'Intermediate',
                    'Advanced',
                    'Elite',
                    'All Levels',
                  ]}
                />
                <Input
                  icon={Activity}
                  label="Linked Exercises"
                  type="number"
                  value={formData.linked_exercises}
                  onChange={(event) =>
                    updateField('linked_exercises', event.target.value)
                  }
                  placeholder="12"
                />
              </div>
            </Section>

            <Section title="Purchase & Maintenance">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  icon={Calendar}
                  label="Purchase Date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(event) =>
                    updateField('purchase_date', event.target.value)
                  }
                />
                <Input
                  icon={Wallet}
                  label="Purchase Price"
                  type="number"
                  value={formData.purchase_price}
                  onChange={(event) =>
                    updateField('purchase_price', event.target.value)
                  }
                  placeholder="3500000"
                />
                <Input
                  icon={Calendar}
                  label="Last Service Date"
                  type="date"
                  value={formData.last_service_date}
                  onChange={(event) =>
                    updateField('last_service_date', event.target.value)
                  }
                />
                <Input
                  icon={Calendar}
                  label="Next Service Date"
                  type="date"
                  value={formData.next_service_date}
                  onChange={(event) =>
                    updateField('next_service_date', event.target.value)
                  }
                />
                <Select
                  label="Equipment Status"
                  value={formData.status}
                  onChange={(event) => updateField('status', event.target.value)}
                  options={['Active', 'Maintenance', 'Inactive', 'Damaged']}
                />
                <Select
                  label="Maintenance Priority"
                  value={formData.maintenance_priority}
                  onChange={(event) =>
                    updateField('maintenance_priority', event.target.value)
                  }
                  options={['Low', 'Medium', 'High', 'Urgent']}
                />
              </div>
            </Section>

            <Section title="Description & Safety Notes">
              <TextArea
                label="Equipment Description"
                value={formData.description}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Shoulder press machine used for seated overhead pressing exercises."
              />
              <div className="mt-5">
                <TextArea
                  label="Safety Instructions"
                  value={formData.safety_instructions}
                  onChange={(event) =>
                    updateField('safety_instructions', event.target.value)
                  }
                  placeholder="Adjust seat height before use. Keep back against the pad."
                />
              </div>
            </Section>

            <Section title="Machine Operation Video">
              <VideoFileInput
                currentUrl={formData.operation_video_url}
                file={formData.operation_video_file}
                onChange={(file) => updateField('operation_video_file', file)}
              />
              <p className="text-gray-500 text-sm mt-3">
                Upload a short MP4, MOV, AVI, WEBM or MKV video showing members
                how to use this machine correctly.
              </p>

              <div className="mt-5">
                <VideoPreview url={videoPreviewUrl} />
              </div>
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="Equipment Image">
              <UploadBox title="Upload Equipment Photo" desc="PNG / JPG / WEBP" />
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
                  label="Access Type"
                  value={formData.access_type}
                  onChange={(event) =>
                    updateField('access_type', event.target.value)
                  }
                  options={['Free', 'Premium', 'Members Only']}
                />
              </div>
              <div className="mt-5">
                <Select
                  label="Publish Status"
                  value={formData.publish_status}
                  onChange={(event) =>
                    updateField('publish_status', event.target.value)
                  }
                  options={['Published', 'Draft', 'Hidden']}
                />
              </div>
            </Section>

            <div className="bg-[#C8A13A]/10 border border-[#C8A13A]/30 rounded-3xl p-5">
              <div className="flex gap-3">
                <ShieldCheck className="text-[#C8A13A] shrink-0" />
                <div>
                  <h4 className="font-bold text-[#C8A13A]">Equipment Preview</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    This equipment will appear under Equipment Based Exercises in
                    the mobile app.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
              <h3 className="text-xl font-bold mb-4">Maintenance Summary</h3>
              <SummaryItem icon={Wrench} label="Status" value={formData.status} />
              <SummaryItem
                icon={Activity}
                label="Exercises"
                value={formData.linked_exercises || '0'}
              />
              <SummaryItem
                icon={MapPin}
                label="Location"
                value={formData.location || 'Not set'}
              />
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
    <div className="h-44 rounded-3xl bg-[#050505] border border-dashed border-[#C8A13A]/40 flex flex-col items-center justify-center text-center">
      <Upload size={34} className="text-[#C8A13A]" />
      <h4 className="font-bold mt-3">{title}</h4>
      <p className="text-gray-500 text-sm mt-1">{desc}</p>
    </div>
  )
}

function VideoFileInput({ currentUrl, file, onChange }) {
  return (
    <label className="block bg-[#050505] border border-dashed border-[#C8A13A]/45 rounded-3xl p-5 cursor-pointer hover:border-[#C8A13A]">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#C8A13A]/15 flex items-center justify-center shrink-0">
          <Video size={22} className="text-[#C8A13A]" />
        </div>
        <div className="min-w-0">
          <p className="font-bold">
            {file ? file.name : currentUrl ? 'Replace operation video' : 'Upload operation video'}
          </p>
          <p className="text-gray-500 text-sm truncate">
            {currentUrl && !file
              ? currentUrl
              : 'Choose video from your device'}
          </p>
        </div>
      </div>
      <input
        type="file"
        accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
        className="sr-only"
      />
    </label>
  )
}

function VideoPreview({ url }) {
  if (!url) {
    return (
      <div className="h-56 rounded-3xl bg-[#050505] border border-dashed border-white/10 flex flex-col items-center justify-center text-center px-5">
        <Video size={34} className="text-[#C8A13A]" />
        <h4 className="font-bold mt-3">No video added</h4>
        <p className="text-gray-500 text-sm mt-1">
          Paste a video URL above to preview the operation guide.
        </p>
      </div>
    )
  }

  return (
    <div className="aspect-video overflow-hidden rounded-3xl border border-white/10 bg-black">
      <video
        title="Equipment operation video preview"
        src={url}
        className="h-full w-full"
        controls
      />
    </div>
  )
}

function useVideoPreview(file, currentUrl) {
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '')

  useEffect(() => {
    if (!file) {
      setPreviewUrl(currentUrl || '')
      return undefined
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [currentUrl, file])

  return previewUrl
}

function SummaryItem({ icon: Icon, label, value }) {
  return (
    <div className="flex justify-between items-center gap-4 py-4 border-b border-white/10 last:border-b-0">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-[#C8A13A]" />
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <span className="font-bold text-right">{value}</span>
    </div>
  )
}
