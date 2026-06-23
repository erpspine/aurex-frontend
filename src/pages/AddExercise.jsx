import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'

import {
  ArrowLeft,
  Clock,
  Dumbbell,
  FileText,
  Image,
  Save,
  Smartphone,
  Target,
  Trophy,
  Video,
} from 'lucide-react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

const emptyExercise = {
  name: '',
  category: 'Equipment Based',
  body_part: 'Shoulders',
  equipment: 'Machine',
  workout_level: 'Beginner',
  duration: '',
  sets: '',
  reps: '',
  rest_time: '',
  status: 'Active',
  description: '',
  instructions: ['', '', '', ''],
  muscle_tags: '',
  image_url: '',
  video_url: '',
  image_file: null,
  video_file: null,
  show_in_mobile_app: true,
  access_type: 'Members Only',
  publish_status: 'Published',
}

export default function AddExercise({ onBack, exerciseId = null }) {
  const [formData, setFormData] = useState({ ...emptyExercise })
  const [isLoading, setIsLoading] = useState(Boolean(exerciseId))
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!exerciseId) return

    let shouldUpdate = true

    const loadExercise = async () => {
      setIsLoading(true)

      try {
        const response = await fetch(`${apiBaseUrl}/exercises/${exerciseId}`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
          },
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load exercise.')
        }

        if (!shouldUpdate) return

        const exercise = payload.exercise
        const instructions = Array.isArray(exercise.instructions)
          ? [...exercise.instructions]
          : []

        setFormData({
          name: exercise.name || '',
          category: exercise.category || 'Equipment Based',
          body_part: exercise.body_part || 'Shoulders',
          equipment: exercise.equipment || 'Machine',
          workout_level: exercise.workout_level || 'Beginner',
          duration: exercise.duration || '',
          sets: exercise.sets || '',
          reps: exercise.reps || '',
          rest_time: exercise.rest_time || '',
          status: exercise.status || 'Active',
          description: exercise.description || '',
          instructions: [...instructions, '', '', '', ''].slice(0, 4),
          muscle_tags: Array.isArray(exercise.muscle_tags)
            ? exercise.muscle_tags.join(', ')
            : '',
          image_url: exercise.image_url || '',
          video_url: exercise.video_url || '',
          image_file: null,
          video_file: null,
          show_in_mobile_app: Boolean(exercise.show_in_mobile_app),
          access_type: exercise.access_type || 'Members Only',
          publish_status: exercise.publish_status || 'Published',
        })
      } catch (caughtError) {
        await Swal.fire({
          title: 'Load failed',
          text: caughtError.message || 'Unable to load exercise.',
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

    loadExercise()

    return () => {
      shouldUpdate = false
    }
  }, [exerciseId, onBack])

  const summary = useMemo(
    () => [
      formData.category,
      formData.body_part,
      formData.workout_level,
      formData.duration || 'No duration',
    ],
    [formData],
  )

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const updateInstruction = (index, value) => {
    setFormData((current) => ({
      ...current,
      instructions: current.instructions.map((item, itemIndex) =>
        itemIndex === index ? value : item,
      ),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const confirmation = await Swal.fire({
      title: exerciseId ? 'Update exercise?' : 'Save exercise?',
      text: 'This exercise will be available to the admin dashboard and mobile app.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: exerciseId ? 'Yes, update exercise' : 'Yes, save exercise',
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
      const instructions = formData.instructions
        .map((item) => item.trim())
        .filter(Boolean)
      const muscleTags = formData.muscle_tags
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

      if (exerciseId) {
        payloadData.append('_method', 'PUT')
      }

      Object.entries({
        name: formData.name,
        category: formData.category,
        body_part: formData.body_part,
        equipment: formData.equipment,
        workout_level: formData.workout_level,
        duration: formData.duration,
        sets: formData.sets,
        reps: formData.reps,
        rest_time: formData.rest_time,
        status: formData.status,
        description: formData.description,
        show_in_mobile_app: formData.show_in_mobile_app ? '1' : '0',
        access_type: formData.access_type,
        publish_status: formData.publish_status,
      }).forEach(([key, value]) => {
        payloadData.append(key, value || '')
      })

      instructions.forEach((item) => payloadData.append('instructions[]', item))
      muscleTags.forEach((item) => payloadData.append('muscle_tags[]', item))

      if (formData.image_file) {
        payloadData.append('image_file', formData.image_file)
      }

      if (formData.video_file) {
        payloadData.append('video_file', formData.video_file)
      }

      const response = await fetch(
        `${apiBaseUrl}/exercises${exerciseId ? `/${exerciseId}` : ''}`,
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

        throw new Error(validationMessage || 'Unable to save exercise.')
      }

      await Swal.fire({
        title: exerciseId ? 'Exercise updated' : 'Exercise saved',
        text:
          payload.message ||
          `Exercise ${exerciseId ? 'updated' : 'created'} successfully.`,
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })

      onBack()
    } catch (caughtError) {
      await Swal.fire({
        title: 'Save failed',
        text: caughtError.message || 'Unable to save exercise.',
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
            Back to Exercises
          </button>

          <h1 className="text-4xl font-black">
            {exerciseId ? 'Edit Exercise' : 'Add Exercise'}
          </h1>
          <p className="text-gray-400 mt-1">
            Manage the exercise library used by members in the mobile app.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="bg-[#C8A13A] disabled:opacity-60 text-black font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {isSubmitting ? 'Saving...' : 'Save Exercise'}
        </button>
      </div>

      {isLoading ? (
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
          Loading exercise...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Section title="Exercise Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  icon={Dumbbell}
                  label="Exercise Name"
                  value={formData.name}
                  onChange={(value) => updateField('name', value)}
                  placeholder="Shoulder Press Machine"
                />
                <Select
                  label="Category"
                  value={formData.category}
                  onChange={(value) => updateField('category', value)}
                  options={['Equipment Based', 'Body Part Exercise', 'Workout']}
                />
                <Select
                  label="Body Part"
                  value={formData.body_part}
                  onChange={(value) => updateField('body_part', value)}
                  options={[
                    'Shoulders',
                    'Chest',
                    'Back',
                    'Arms',
                    'Legs',
                    'Abs',
                    'Full Body',
                  ]}
                />
                <Select
                  label="Equipment"
                  value={formData.equipment}
                  onChange={(value) => updateField('equipment', value)}
                  options={[
                    'Machine',
                    'Dumbbell',
                    'Barbell',
                    'Kettlebell',
                    'Resistance Bands',
                    'No Equipment',
                  ]}
                />
                <Select
                  label="Workout Level"
                  value={formData.workout_level}
                  onChange={(value) => updateField('workout_level', value)}
                  options={['Beginner', 'Intermediate', 'Advanced', 'Elite']}
                />
                <Input
                  icon={Clock}
                  label="Duration"
                  value={formData.duration}
                  onChange={(value) => updateField('duration', value)}
                  placeholder="12 min"
                />
              </div>
            </Section>

            <Section title="Training Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  icon={Trophy}
                  label="Sets"
                  value={formData.sets}
                  onChange={(value) => updateField('sets', value)}
                  placeholder="3-4 Sets"
                />
                <Input
                  icon={Target}
                  label="Reps"
                  value={formData.reps}
                  onChange={(value) => updateField('reps', value)}
                  placeholder="8-12 Reps"
                />
                <Input
                  label="Rest Time"
                  value={formData.rest_time}
                  onChange={(value) => updateField('rest_time', value)}
                  placeholder="60 sec"
                />
                <Select
                  label="Status"
                  value={formData.status}
                  onChange={(value) => updateField('status', value)}
                  options={['Active', 'Draft', 'Hidden', 'Archived']}
                />
              </div>
              <Textarea
                label="Short Description"
                value={formData.description}
                onChange={(value) => updateField('description', value)}
                placeholder="Build strong shoulders with controlled movement."
              />
            </Section>

            <Section title="How To Perform">
              <div className="space-y-4">
                {formData.instructions.map((item, index) => (
                  <InstructionInput
                    key={index}
                    step={index + 1}
                    value={item}
                    onChange={(value) => updateInstruction(index, value)}
                  />
                ))}
              </div>
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="Media Uploads">
              <div className="space-y-5">
                <FileInput
                  icon={Image}
                  label="Exercise Image"
                  accept="image/*"
                  currentUrl={formData.image_url}
                  file={formData.image_file}
                  onChange={(file) => updateField('image_file', file)}
                />
                <FileInput
                  icon={Video}
                  label="Demo Video"
                  accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska"
                  currentUrl={formData.video_url}
                  file={formData.video_file}
                  onChange={(file) => updateField('video_file', file)}
                />
                <Input
                  icon={Dumbbell}
                  label="Muscle Tags"
                  value={formData.muscle_tags}
                  onChange={(value) => updateField('muscle_tags', value)}
                  placeholder="Shoulders, Triceps, Stabilizer"
                />
              </div>
            </Section>

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
                  label="Access Type"
                  value={formData.access_type}
                  onChange={(value) => updateField('access_type', value)}
                  options={['Free', 'Premium', 'Members Only']}
                />
                <Select
                  label="Publish Status"
                  value={formData.publish_status}
                  onChange={(value) => updateField('publish_status', value)}
                  options={['Published', 'Draft', 'Hidden']}
                />
              </div>
            </Section>

            <div className="bg-[#C8A13A]/10 border border-[#C8A13A]/30 rounded-3xl p-5">
              <h4 className="text-[#C8A13A] font-bold">Exercise Summary</h4>
              <div className="flex flex-wrap gap-2 mt-4">
                {summary.map((item) => (
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

function Input({ label, placeholder, icon: Icon, value, onChange, type = 'text' }) {
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
          className="w-full bg-transparent outline-none py-4 text-white placeholder:text-gray-600"
        />
      </div>
    </div>
  )
}

function Textarea({ label, placeholder, value, onChange }) {
  return (
    <div className="mt-5">
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#050505] border border-white/10 rounded-2xl px-4 py-4 text-white outline-none placeholder:text-gray-600 resize-none"
      />
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

function FileInput({ label, icon: Icon, accept, currentUrl, file, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <label className="block bg-[#050505] border border-dashed border-[#C8A13A]/45 rounded-2xl px-4 py-5 cursor-pointer hover:border-[#C8A13A]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#C8A13A]/15 flex items-center justify-center shrink-0">
            <Icon size={20} className="text-[#C8A13A]" />
          </div>
          <div className="min-w-0">
            <p className="font-bold">{file ? file.name : 'Choose file'}</p>
            <p className="text-gray-500 text-sm truncate">
              {currentUrl && !file ? currentUrl : 'Click to upload from your device'}
            </p>
          </div>
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
          View current file
        </a>
      )}
    </div>
  )
}

function InstructionInput({ step, value, onChange }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-9 h-9 rounded-full bg-[#C8A13A]/15 border border-[#C8A13A]/40 text-[#C8A13A] flex items-center justify-center font-bold shrink-0">
        {step}
      </div>
      <div className="flex items-center bg-[#050505] border border-white/10 rounded-2xl px-4 flex-1">
        <FileText size={18} className="text-[#C8A13A] mr-3 shrink-0" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={`Instruction step ${step}`}
          className="w-full bg-transparent outline-none py-4 text-white placeholder:text-gray-600"
        />
      </div>
    </div>
  )
}
