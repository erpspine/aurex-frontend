import { useMemo, useState } from 'react'
import Swal from 'sweetalert2'

import {
  ArrowLeft,
  CalendarDays,
  Eye,
  Image,
  Link,
  Save,
  Smartphone,
  Target,
  Upload,
} from 'lucide-react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

const emptyBanner = {
  title: '',
  subtitle: '',
  banner_type: 'Home Banner',
  target_audience: 'All Users',
  button_text: '',
  button_action: 'Open Workouts',
  action_url: '',
  display_order: '1',
  start_date: '',
  end_date: '',
  publish_status: 'Published',
  show_in_mobile_app: true,
  priority: 'Normal',
  allow_dismiss: true,
  background_style: 'Image',
  text_alignment: 'Left',
  background_color: '#050505',
  accent_color: '#C8A13A',
  description: '',
  image_file: null,
}

export default function AddBanner({ onBack }) {
  const [formData, setFormData] = useState({ ...emptyBanner })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const previewTitle = formData.title || 'Start Your Transformation'
  const previewSubtitle =
    formData.subtitle || 'Join today and unlock premium workouts'
  const previewButton = formData.button_text || 'Start Now'

  const previewStyle = useMemo(
    () => ({
      background:
        formData.background_style === 'Solid Color'
          ? formData.background_color
          : `linear-gradient(135deg, ${formData.accent_color}, #8A6A18)`,
    }),
    [formData.accent_color, formData.background_color, formData.background_style],
  )

  const handleSubmit = async (event) => {
    event.preventDefault()

    const confirmation = await Swal.fire({
      title: 'Save app banner?',
      text: 'This banner will be available to the mobile app dashboard.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, save banner',
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

      Object.entries({
        title: formData.title,
        subtitle: formData.subtitle,
        banner_type: formData.banner_type,
        target_audience: formData.target_audience,
        button_text: formData.button_text,
        button_action: formData.button_action,
        action_url: formData.action_url,
        display_order: formData.display_order || '1',
        start_date: formData.start_date,
        end_date: formData.end_date,
        publish_status: formData.publish_status,
        show_in_mobile_app: formData.show_in_mobile_app ? '1' : '0',
        priority: formData.priority,
        allow_dismiss: formData.allow_dismiss ? '1' : '0',
        background_style: formData.background_style,
        text_alignment: formData.text_alignment,
        background_color: formData.background_color,
        accent_color: formData.accent_color,
        description: formData.description,
      }).forEach(([key, value]) => payloadData.append(key, value || ''))

      if (formData.image_file) {
        payloadData.append('image_file', formData.image_file)
      }

      const response = await fetch(`${apiBaseUrl}/app-banners`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
        },
        body: payloadData,
      })
      const payload = await response.json()

      if (!response.ok) {
        const validationMessage = payload.errors
          ? Object.values(payload.errors).flat().join(' ')
          : payload.message

        throw new Error(validationMessage || 'Unable to save banner.')
      }

      await Swal.fire({
        title: 'Banner saved',
        text: payload.message || 'App banner created successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })

      onBack()
    } catch (caughtError) {
      await Swal.fire({
        title: 'Save failed',
        text: caughtError.message || 'Unable to save banner.',
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
            Back to Mobile App
          </button>

          <h1 className="text-4xl font-black">Add App Banner</h1>
          <p className="text-gray-400 mt-1">
            Create promotional banners for the mobile app home screen.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#C8A13A] disabled:opacity-60 text-black font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {isSubmitting ? 'Saving...' : 'Save Banner'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Section title="Banner Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                icon={Image}
                label="Banner Title"
                value={formData.title}
                onChange={(value) => updateField('title', value)}
                placeholder="Start Your Transformation"
              />
              <Input
                icon={Target}
                label="Subtitle"
                value={formData.subtitle}
                onChange={(value) => updateField('subtitle', value)}
                placeholder="Join today and unlock premium workouts"
              />

              <Select
                label="Banner Type"
                value={formData.banner_type}
                onChange={(value) => updateField('banner_type', value)}
                options={[
                  'Home Banner',
                  'Workout Banner',
                  'Diet Banner',
                  'Membership Banner',
                  'Class Banner',
                ]}
              />

              <Select
                label="Target Audience"
                value={formData.target_audience}
                onChange={(value) => updateField('target_audience', value)}
                options={[
                  'All Users',
                  'Free Users',
                  'Premium Users',
                  'Members Only',
                  'New Users',
                ]}
              />

              <Input
                icon={Link}
                label="Button Text"
                value={formData.button_text}
                onChange={(value) => updateField('button_text', value)}
                placeholder="Start Now"
              />

              <Select
                label="Button Action"
                value={formData.button_action}
                onChange={(value) => updateField('button_action', value)}
                options={[
                  'Open Workouts',
                  'Open Diet Plans',
                  'Open Membership Plans',
                  'Open Classes',
                  'External Link',
                ]}
              />

              <Input
                icon={Link}
                label="Action URL / Route"
                value={formData.action_url}
                onChange={(value) => updateField('action_url', value)}
                placeholder="/workouts"
              />
              <Input
                label="Display Order"
                type="number"
                value={formData.display_order}
                onChange={(value) => updateField('display_order', value)}
                placeholder="1"
              />
            </div>
          </Section>

          <Section title="Schedule & Visibility">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                icon={CalendarDays}
                label="Start Date"
                type="date"
                value={formData.start_date}
                onChange={(value) => updateField('start_date', value)}
              />
              <Input
                icon={CalendarDays}
                label="End Date"
                type="date"
                value={formData.end_date}
                onChange={(value) => updateField('end_date', value)}
              />
              <Select
                label="Publish Status"
                value={formData.publish_status}
                onChange={(value) => updateField('publish_status', value)}
                options={['Published', 'Draft', 'Hidden']}
              />
              <ToggleSelect
                label="Show In Mobile App"
                value={formData.show_in_mobile_app}
                onChange={(value) => updateField('show_in_mobile_app', value)}
              />
              <Select
                label="Priority"
                value={formData.priority}
                onChange={(value) => updateField('priority', value)}
                options={['Normal', 'High', 'Featured']}
              />
              <ToggleSelect
                label="Allow Close / Dismiss"
                value={formData.allow_dismiss}
                onChange={(value) => updateField('allow_dismiss', value)}
              />
            </div>
          </Section>

          <Section title="Banner Design">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select
                label="Background Style"
                value={formData.background_style}
                onChange={(value) => updateField('background_style', value)}
                options={['Image', 'Gradient', 'Solid Color', 'Video Banner']}
              />
              <Select
                label="Text Alignment"
                value={formData.text_alignment}
                onChange={(value) => updateField('text_alignment', value)}
                options={['Left', 'Center', 'Right']}
              />
              <Input
                label="Background Color"
                value={formData.background_color}
                onChange={(value) => updateField('background_color', value)}
                placeholder="#050505"
              />
              <Input
                label="Accent Color"
                value={formData.accent_color}
                onChange={(value) => updateField('accent_color', value)}
                placeholder="#C8A13A"
              />
            </div>

            <div className="mt-5">
              <TextArea
                label="Banner Description"
                value={formData.description}
                onChange={(value) => updateField('description', value)}
                placeholder="Short message shown inside the mobile app banner."
              />
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Banner Image">
            <FileInput
              file={formData.image_file}
              onChange={(file) => updateField('image_file', file)}
            />
          </Section>

          <Section title="Mobile Preview">
            <div className="mx-auto w-full max-w-[260px] h-[520px] rounded-[36px] bg-black border-4 border-[#222] p-4">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-xl font-black">
                    AUR<span className="text-[#C8A13A]">EX</span>
                  </h3>
                  <p className="text-gray-500 text-xs">Home</p>
                </div>
                <div className="w-9 h-9 bg-[#C8A13A] rounded-full" />
              </div>

              <div
                style={previewStyle}
                className="h-40 rounded-3xl text-black p-5 flex flex-col justify-between"
              >
                <div className={formData.text_alignment === 'Center' ? 'text-center' : formData.text_alignment === 'Right' ? 'text-right' : ''}>
                  <h4 className="font-black text-xl leading-tight">
                    {previewTitle}
                  </h4>
                  <p className="text-xs mt-2">{previewSubtitle}</p>
                </div>

                <button
                  type="button"
                  className="bg-black text-[#C8A13A] text-xs font-bold px-4 py-2 rounded-xl w-fit"
                >
                  {previewButton}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <MiniAppCard title="Body Parts" />
                <MiniAppCard title="Equipment" />
                <MiniAppCard title="Workouts" />
                <MiniAppCard title="Diet" />
              </div>
            </div>
          </Section>

          <div className="bg-[#C8A13A]/10 border border-[#C8A13A]/30 rounded-3xl p-5">
            <div className="flex gap-3">
              <Smartphone className="text-[#C8A13A] shrink-0" />
              <div>
                <h4 className="font-bold text-[#C8A13A]">Banner Summary</h4>
                <p className="text-gray-400 text-sm mt-1">
                  This banner will appear on the selected mobile app screen based
                  on status, dates and target audience.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="w-full border border-[#C8A13A]/40 text-[#C8A13A] font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#C8A13A]/10"
          >
            <Eye size={18} />
            Preview Banner
          </button>
        </div>
      </div>
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
          min={type === 'number' ? 1 : undefined}
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
        {options.map((item) => (
          <option key={item} className="bg-[#050505] text-white">
            {item}
          </option>
        ))}
      </select>
    </div>
  )
}

function ToggleSelect({ label, value, onChange }) {
  return (
    <Select
      label={label}
      value={value ? 'Yes' : 'No'}
      onChange={(nextValue) => onChange(nextValue === 'Yes')}
      options={['Yes', 'No']}
    />
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

function FileInput({ file, onChange }) {
  return (
    <label className="h-52 rounded-3xl bg-[#050505] border border-dashed border-[#C8A13A]/40 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#C8A13A]">
      <Upload size={36} className="text-[#C8A13A]" />
      <h4 className="font-bold mt-3">
        {file ? file.name : 'Upload Banner Image'}
      </h4>
      <p className="text-gray-500 text-sm mt-1">Recommended: 1080 x 480 px</p>
      <input
        type="file"
        accept="image/*"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
        className="sr-only"
      />
    </label>
  )
}

function MiniAppCard({ title }) {
  return (
    <div className="bg-[#111] rounded-2xl p-3">
      <p className="text-xs font-bold">{title}</p>
      <p className="text-[10px] text-gray-500 mt-1">Open</p>
    </div>
  )
}
