import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'

import {
  ArrowLeft,
  Image,
  Save,
  Smartphone,
  Target,
} from 'lucide-react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

const emptyBodyPart = {
  name: '',
  description: '',
  image_url: '',
  image_file: null,
  status: 'Active',
  show_in_mobile_app: true,
  publish_status: 'Published',
}

export default function AddBodyPart({ onBack, bodyPartId = null }) {
  const [formData, setFormData] = useState({ ...emptyBodyPart })
  const [isLoading, setIsLoading] = useState(Boolean(bodyPartId))
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!bodyPartId) return

    let shouldUpdate = true

    const loadBodyPart = async () => {
      setIsLoading(true)

      try {
        const response = await fetch(`${apiBaseUrl}/body-parts/${bodyPartId}`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
          },
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load body part.')
        }

        if (!shouldUpdate) return

        const bodyPart = payload.body_part

        setFormData({
          name: bodyPart.name || '',
          description: bodyPart.description || '',
          image_url: bodyPart.image_url || '',
          image_file: null,
          status: bodyPart.status || 'Active',
          show_in_mobile_app: Boolean(bodyPart.show_in_mobile_app),
          publish_status: bodyPart.publish_status || 'Published',
        })
      } catch (caughtError) {
        await Swal.fire({
          title: 'Load failed',
          text: caughtError.message || 'Unable to load body part.',
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

    loadBodyPart()

    return () => {
      shouldUpdate = false
    }
  }, [bodyPartId, onBack])

  const preview = useMemo(
    () => [formData.name || 'Body part', formData.status, formData.publish_status],
    [formData],
  )

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const confirmation = await Swal.fire({
      title: bodyPartId ? 'Update body part?' : 'Save body part?',
      text: 'This body part can be linked to exercises and shown in the mobile app.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: bodyPartId ? 'Yes, update body part' : 'Yes, save body part',
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

      if (bodyPartId) {
        payloadData.append('_method', 'PUT')
      }

      Object.entries({
        name: formData.name,
        description: formData.description,
        status: formData.status,
        show_in_mobile_app: formData.show_in_mobile_app ? '1' : '0',
        publish_status: formData.publish_status,
      }).forEach(([key, value]) => payloadData.append(key, value || ''))

      if (formData.image_file) {
        payloadData.append('image_file', formData.image_file)
      }

      const response = await fetch(
        `${apiBaseUrl}/body-parts${bodyPartId ? `/${bodyPartId}` : ''}`,
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

        throw new Error(validationMessage || 'Unable to save body part.')
      }

      await Swal.fire({
        title: bodyPartId ? 'Body part updated' : 'Body part saved',
        text: payload.message || 'Body part saved successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })

      onBack()
    } catch (caughtError) {
      await Swal.fire({
        title: 'Save failed',
        text: caughtError.message || 'Unable to save body part.',
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
            Back to Body Parts
          </button>

          <h1 className="text-4xl font-black">
            {bodyPartId ? 'Edit Body Part' : 'Add Body Part'}
          </h1>
          <p className="text-gray-400 mt-1">
            Create body-part categories for exercise grouping in the mobile app.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="bg-[#C8A13A] disabled:opacity-60 text-black font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {isSubmitting ? 'Saving...' : 'Save Body Part'}
        </button>
      </div>

      {isLoading ? (
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
          Loading body part...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Section title="Body Part Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  icon={Target}
                  label="Body Part Name"
                  value={formData.name}
                  onChange={(value) => updateField('name', value)}
                  placeholder="Chest"
                />
                <Select
                  label="Status"
                  value={formData.status}
                  onChange={(value) => updateField('status', value)}
                  options={['Active', 'Draft', 'Hidden']}
                />
              </div>
              <Textarea
                label="Description"
                value={formData.description}
                onChange={(value) => updateField('description', value)}
                placeholder="Exercises focused on chest strength and control."
              />
            </Section>

            <Section title="Body Part Image">
              <FileInput
                icon={Image}
                label="Upload Image"
                accept="image/*"
                currentUrl={formData.image_url}
                file={formData.image_file}
                onChange={(file) => updateField('image_file', file)}
              />
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="Mobile App">
              <div className="space-y-5">
                <label className="flex items-center justify-between gap-4 bg-[#050505] border border-white/10 rounded-2xl px-4 py-4">
                  <span className="flex items-center gap-3 text-sm font-bold">
                    <Smartphone size={18} className="text-[#C8A13A]" />
                    Show in mobile app
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.show_in_mobile_app}
                    onChange={(event) =>
                      updateField('show_in_mobile_app', event.target.checked)
                    }
                    className="h-5 w-5 accent-[#C8A13A]"
                  />
                </label>
                <Select
                  label="Publish Status"
                  value={formData.publish_status}
                  onChange={(value) => updateField('publish_status', value)}
                  options={['Published', 'Draft', 'Hidden']}
                />
              </div>
            </Section>

            <div className="bg-[#C8A13A]/10 border border-[#C8A13A]/30 rounded-3xl p-5">
              <h4 className="text-[#C8A13A] font-bold">Body Part Preview</h4>
              <div className="flex flex-wrap gap-2 mt-4">
                {preview.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-2 rounded-xl bg-black/30 text-gray-200 text-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
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

function Input({ label, placeholder, icon: Icon, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <div className="flex items-center bg-[#050505] border border-white/10 rounded-2xl px-4">
        {Icon && <Icon size={18} className="text-[#C8A13A] mr-3 shrink-0" />}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none py-4 text-white placeholder:text-gray-600"
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
        {options.map((option) => (
          <option key={option} className="bg-[#050505] text-white">
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

function Textarea({ label, placeholder, value, onChange }) {
  return (
    <div className="mt-5">
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <textarea
        rows={5}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#050505] border border-white/10 rounded-2xl px-4 py-4 text-white outline-none placeholder:text-gray-600 resize-none"
      />
    </div>
  )
}

function FileInput({ label, icon: Icon, accept, currentUrl, file, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <label className="block bg-[#050505] border border-dashed border-[#C8A13A]/45 rounded-2xl px-4 py-8 cursor-pointer hover:border-[#C8A13A]">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#C8A13A]/15 flex items-center justify-center">
            <Icon size={24} className="text-[#C8A13A]" />
          </div>
          <p className="font-bold mt-4">{file ? file.name : 'Choose image'}</p>
          <p className="text-gray-500 text-sm mt-1 max-w-full truncate">
            {currentUrl && !file ? currentUrl : 'PNG, JPG or WEBP'}
          </p>
        </div>
        <input
          type="file"
          accept={accept}
          onChange={(event) => onChange(event.target.files?.[0] || null)}
          className="sr-only"
        />
      </label>
      {currentUrl && (
        <a
          href={currentUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-[#C8A13A] hover:text-white inline-block mt-2"
        >
          View current image
        </a>
      )}
    </div>
  )
}
