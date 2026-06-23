import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'

import {
  Activity,
  ArrowLeft,
  Clock,
  Dumbbell,
  Flame,
  Image,
  Save,
  Smartphone,
  Target,
  Trophy,
} from 'lucide-react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

const emptyLevel = {
  name: '',
  difficulty_rank: '1',
  recommended_duration: '',
  intensity: 'Low',
  recommended_sets: '',
  recommended_reps: '',
  description: '',
  calories_range: '',
  rest_time: '',
  training_frequency: '',
  suitable_for: 'New Members',
  trainer_instructions: '',
  safety_notes: '',
  linked_workouts: '0',
  linked_exercises: '0',
  status: 'Active',
  cover_image_url: '',
  cover_image_file: null,
  publish_status: 'Published',
  show_in_mobile_app: true,
  access_type: 'Free',
}

export default function AddWorkoutLevel({ onBack, levelId = null }) {
  const [formData, setFormData] = useState({ ...emptyLevel })
  const [isLoading, setIsLoading] = useState(Boolean(levelId))
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!levelId) return

    let shouldUpdate = true

    const loadLevel = async () => {
      setIsLoading(true)

      try {
        const response = await fetch(`${apiBaseUrl}/workout-levels/${levelId}`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
          },
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load workout level.')
        }

        if (!shouldUpdate) return

        const level = payload.workout_level

        setFormData({
          name: level.name || '',
          difficulty_rank: String(level.difficulty_rank || 1),
          recommended_duration: level.recommended_duration || '',
          intensity: level.intensity || 'Low',
          recommended_sets: level.recommended_sets || '',
          recommended_reps: level.recommended_reps || '',
          description: level.description || '',
          calories_range: level.calories_range || '',
          rest_time: level.rest_time || '',
          training_frequency: level.training_frequency || '',
          suitable_for: level.suitable_for || 'New Members',
          trainer_instructions: level.trainer_instructions || '',
          safety_notes: level.safety_notes || '',
          linked_workouts: String(level.linked_workouts ?? 0),
          linked_exercises: String(level.linked_exercises ?? 0),
          status: level.status || 'Active',
          cover_image_url: level.cover_image_url || '',
          cover_image_file: null,
          publish_status: level.publish_status || 'Published',
          show_in_mobile_app: Boolean(level.show_in_mobile_app),
          access_type: level.access_type || 'Free',
        })
      } catch (caughtError) {
        await Swal.fire({
          title: 'Load failed',
          text: caughtError.message || 'Unable to load workout level.',
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

    loadLevel()

    return () => {
      shouldUpdate = false
    }
  }, [levelId, onBack])

  const preview = useMemo(
    () => [
      `Rank ${formData.difficulty_rank}`,
      formData.intensity,
      formData.recommended_duration || 'No duration',
      formData.status,
    ],
    [formData],
  )

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const confirmation = await Swal.fire({
      title: levelId ? 'Update workout level?' : 'Save workout level?',
      text: 'This level will be available for workout filtering in the app.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: levelId ? 'Yes, update level' : 'Yes, save level',
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

      if (levelId) {
        payloadData.append('_method', 'PUT')
      }

      Object.entries({
        name: formData.name,
        difficulty_rank: formData.difficulty_rank,
        recommended_duration: formData.recommended_duration,
        intensity: formData.intensity,
        recommended_sets: formData.recommended_sets,
        recommended_reps: formData.recommended_reps,
        description: formData.description,
        calories_range: formData.calories_range,
        rest_time: formData.rest_time,
        training_frequency: formData.training_frequency,
        suitable_for: formData.suitable_for,
        trainer_instructions: formData.trainer_instructions,
        safety_notes: formData.safety_notes,
        linked_workouts: formData.linked_workouts || '0',
        linked_exercises: formData.linked_exercises || '0',
        status: formData.status,
        publish_status: formData.publish_status,
        show_in_mobile_app: formData.show_in_mobile_app ? '1' : '0',
        access_type: formData.access_type,
      }).forEach(([key, value]) => payloadData.append(key, value || ''))

      if (formData.cover_image_file) {
        payloadData.append('cover_image_file', formData.cover_image_file)
      }

      const response = await fetch(
        `${apiBaseUrl}/workout-levels${levelId ? `/${levelId}` : ''}`,
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

        throw new Error(validationMessage || 'Unable to save workout level.')
      }

      await Swal.fire({
        title: levelId ? 'Level updated' : 'Level saved',
        text:
          payload.message ||
          `Workout level ${levelId ? 'updated' : 'created'} successfully.`,
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })

      onBack()
    } catch (caughtError) {
      await Swal.fire({
        title: 'Save failed',
        text: caughtError.message || 'Unable to save workout level.',
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
            Back to Workout Levels
          </button>

          <h1 className="text-4xl font-black">
            {levelId ? 'Edit Workout Level' : 'Add Workout Level'}
          </h1>
          <p className="text-gray-400 mt-1">
            Create a difficulty level for exercises and workout programs.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="bg-[#C8A13A] disabled:opacity-60 text-black font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {isSubmitting ? 'Saving...' : 'Save Level'}
        </button>
      </div>

      {isLoading ? (
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
          Loading workout level...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Section title="Level Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  icon={Trophy}
                  label="Level Name"
                  value={formData.name}
                  onChange={(value) => updateField('name', value)}
                  placeholder="Beginner"
                />
                <Select
                  label="Difficulty Rank"
                  value={formData.difficulty_rank}
                  onChange={(value) => updateField('difficulty_rank', value)}
                  options={[
                    ['1', '1 - Easy'],
                    ['2', '2 - Moderate'],
                    ['3', '3 - Hard'],
                    ['4', '4 - Elite'],
                  ]}
                />
                <Input
                  icon={Clock}
                  label="Recommended Duration"
                  value={formData.recommended_duration}
                  onChange={(value) => updateField('recommended_duration', value)}
                  placeholder="15 - 30 min"
                />
                <Select
                  label="Intensity"
                  value={formData.intensity}
                  onChange={(value) => updateField('intensity', value)}
                  options={['Low', 'Medium', 'High', 'Very High']}
                />
                <Input
                  icon={Dumbbell}
                  label="Recommended Sets"
                  value={formData.recommended_sets}
                  onChange={(value) => updateField('recommended_sets', value)}
                  placeholder="3 - 4 sets"
                />
                <Input
                  icon={Activity}
                  label="Recommended Reps"
                  value={formData.recommended_reps}
                  onChange={(value) => updateField('recommended_reps', value)}
                  placeholder="10 - 15 reps"
                />
              </div>

              <TextArea
                label="Level Description"
                value={formData.description}
                onChange={(value) => updateField('description', value)}
                placeholder="This level is suitable for users who are new to training."
              />
            </Section>

            <Section title="Training Rules">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  icon={Flame}
                  label="Calories Range"
                  value={formData.calories_range}
                  onChange={(value) => updateField('calories_range', value)}
                  placeholder="100 - 300 kcal"
                />
                <Input
                  icon={Clock}
                  label="Rest Time"
                  value={formData.rest_time}
                  onChange={(value) => updateField('rest_time', value)}
                  placeholder="60 - 90 sec"
                />
                <Input
                  icon={Target}
                  label="Training Frequency"
                  value={formData.training_frequency}
                  onChange={(value) => updateField('training_frequency', value)}
                  placeholder="3 days per week"
                />
                <Select
                  label="Suitable For"
                  value={formData.suitable_for}
                  onChange={(value) => updateField('suitable_for', value)}
                  options={[
                    'New Members',
                    'Regular Members',
                    'Experienced Members',
                    'Athletes',
                  ]}
                />
                <Input
                  label="Linked Workouts"
                  type="number"
                  value={formData.linked_workouts}
                  onChange={(value) => updateField('linked_workouts', value)}
                  placeholder="0"
                />
                <Input
                  label="Linked Exercises"
                  type="number"
                  value={formData.linked_exercises}
                  onChange={(value) => updateField('linked_exercises', value)}
                  placeholder="0"
                />
              </div>
            </Section>

            <Section title="Guidance Notes">
              <TextArea
                label="Trainer Instructions"
                value={formData.trainer_instructions}
                onChange={(value) => updateField('trainer_instructions', value)}
                placeholder="Start with light weight and focus on form."
              />
              <TextArea
                label="Safety Notes"
                value={formData.safety_notes}
                onChange={(value) => updateField('safety_notes', value)}
                placeholder="Stop if there is unusual pain."
              />
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="Level Cover">
              <FileInput
                icon={Image}
                label="Cover Image"
                accept="image/*"
                currentUrl={formData.cover_image_url}
                file={formData.cover_image_file}
                onChange={(file) => updateField('cover_image_file', file)}
              />
            </Section>

            <Section title="Mobile App Settings">
              <div className="space-y-5">
                <Select
                  label="Status"
                  value={formData.status}
                  onChange={(value) => updateField('status', value)}
                  options={['Active', 'Draft', 'Hidden']}
                />
                <Select
                  label="Publish Status"
                  value={formData.publish_status}
                  onChange={(value) => updateField('publish_status', value)}
                  options={['Published', 'Draft', 'Hidden']}
                />
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
                  options={['Free', 'Premium']}
                />
              </div>
            </Section>

            <div className="bg-[#C8A13A]/10 border border-[#C8A13A]/30 rounded-3xl p-5">
              <h4 className="text-[#C8A13A] font-bold">Level Preview</h4>
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

function Input({
  label,
  placeholder,
  icon: Icon,
  value,
  onChange,
  type = 'text',
}) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <div className="flex items-center bg-[#050505] border border-white/10 rounded-2xl px-4">
        {Icon && <Icon size={18} className="text-[#C8A13A] mr-3 shrink-0" />}
        <input
          type={type}
          value={value}
          min={type === 'number' ? 0 : undefined}
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
        {options.map((item) => {
          const optionValue = Array.isArray(item) ? item[0] : item
          const labelText = Array.isArray(item) ? item[1] : item

          return (
            <option key={optionValue} value={optionValue} className="bg-[#050505] text-white">
              {labelText}
            </option>
          )
        })}
      </select>
    </div>
  )
}

function TextArea({ label, placeholder, value, onChange }) {
  return (
    <div className="mt-5">
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

function FileInput({ label, icon: Icon, accept, currentUrl, file, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <label className="block bg-[#050505] border border-dashed border-[#C8A13A]/45 rounded-2xl px-4 py-8 cursor-pointer hover:border-[#C8A13A]">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#C8A13A]/15 flex items-center justify-center">
            <Icon size={24} className="text-[#C8A13A]" />
          </div>
          <p className="font-bold mt-4">{file ? file.name : 'Choose cover image'}</p>
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
          View current cover
        </a>
      )}
    </div>
  )
}
