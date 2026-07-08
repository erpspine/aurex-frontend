import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'

import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Clock,
  Dumbbell,
  Flame,
  GripVertical,
  Image,
  Plus,
  Save,
  Smartphone,
  Target,
  Trash2,
  Trophy,
} from 'lucide-react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

const emptyWorkout = {
  name: '',
  goal: 'General Fitness',
  workout_level: 'Beginner',
  workout_type: 'Full Body',
  duration: '',
  calories_burn: '',
  description: '',
  days_count: 1,
  workout_days: [{ day_number: 1, title: 'Day 1', notes: '', exercises: [] }],
  exercises: [],
  warm_up: '',
  trainer_notes: '',
  cool_down: '',
  cover_image_url: '',
  cover_image_file: null,
  publish_status: 'Published',
  show_in_mobile_app: true,
  access_type: 'Members Only',
}

export default function AddWorkout({ onBack, workoutId = null }) {
  const [formData, setFormData] = useState({ ...emptyWorkout })
  const [exerciseOptions, setExerciseOptions] = useState([])
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(Boolean(workoutId))
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let shouldUpdate = true

    const loadOptions = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/exercises`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
          },
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load exercises.')
        }

        if (shouldUpdate) setExerciseOptions(payload.exercises || [])
      } catch {
        if (shouldUpdate) setExerciseOptions([])
      }
    }

    loadOptions()

    return () => {
      shouldUpdate = false
    }
  }, [])

  useEffect(() => {
    if (!workoutId) return

    let shouldUpdate = true

    const loadWorkout = async () => {
      setIsLoading(true)

      try {
        const response = await fetch(`${apiBaseUrl}/workouts/${workoutId}`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
          },
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load workout.')
        }

        if (!shouldUpdate) return

        const workout = payload.workout

        const workoutDays = normalizeWorkoutDays(
          workout.workout_days,
          workout.days_count,
          workout.exercises,
        )

        setFormData({
          name: workout.name || '',
          goal: workout.goal || 'General Fitness',
          workout_level: workout.workout_level || 'Beginner',
          workout_type: workout.workout_type || 'Full Body',
          duration: workout.duration || '',
          calories_burn: workout.calories_burn || '',
          description: workout.description || '',
          days_count: workoutDays.length || 1,
          workout_days: workoutDays,
          exercises: flattenWorkoutDays(workoutDays),
          warm_up: workout.warm_up || '',
          trainer_notes: workout.trainer_notes || '',
          cool_down: workout.cool_down || '',
          cover_image_url: workout.cover_image_url || '',
          cover_image_file: null,
          publish_status: workout.publish_status || 'Published',
          show_in_mobile_app: Boolean(workout.show_in_mobile_app),
          access_type: workout.access_type || 'Members Only',
        })
        setSelectedDayIndex(0)
      } catch (caughtError) {
        await Swal.fire({
          title: 'Load failed',
          text: caughtError.message || 'Unable to load workout.',
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

    loadWorkout()

    return () => {
      shouldUpdate = false
    }
  }, [onBack, workoutId])

  const summary = useMemo(
    () => ({
      exercises: formData.exercises.length,
      days: formData.workout_days.length,
      duration: formData.duration || 'Not set',
      calories: formData.calories_burn || 'Not set',
      level: formData.workout_level,
      goal: formData.goal,
    }),
    [formData],
  )

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const updateDaysCount = (value) => {
    const count = Math.max(1, Math.min(31, Number.parseInt(value, 10) || 1))

    setFormData((current) => {
      const workoutDays = Array.from({ length: count }, (_, index) => {
        const existing = current.workout_days[index]

        return (
          existing || {
            day_number: index + 1,
            title: `Day ${index + 1}`,
            notes: '',
            exercises: [],
          }
        )
      }).map((day, index) => ({
        ...day,
        day_number: index + 1,
        title: day.title || `Day ${index + 1}`,
        exercises: Array.isArray(day.exercises) ? day.exercises : [],
      }))

      return {
        ...current,
        days_count: count,
        workout_days: workoutDays,
        exercises: flattenWorkoutDays(workoutDays),
      }
    })

    setSelectedDayIndex((current) => Math.min(current, count - 1))
  }

  const updateWorkoutDay = (dayIndex, field, value) => {
    setFormData((current) => {
      const workoutDays = current.workout_days.map((day, index) =>
        index === dayIndex ? { ...day, [field]: value } : day,
      )

      return {
        ...current,
        workout_days: workoutDays,
        exercises: flattenWorkoutDays(workoutDays),
      }
    })
  }

  const addExercise = () => {
    const selected = exerciseOptions.find((item) => item.id === selectedExerciseId)

    if (!selected) return

    setFormData((current) => {
      const workoutDays = current.workout_days.map((day, index) =>
        index === selectedDayIndex
          ? {
              ...day,
              exercises: [
                ...(Array.isArray(day.exercises) ? day.exercises : []),
                {
                  exercise_id: selected.id,
                  name: selected.name,
                  body_part: selected.body_part || '',
                  sets: selected.sets || '3',
                  reps: selected.reps || '10',
                  rest: selected.rest_time || '60 sec',
                },
              ],
            }
          : day,
      )

      return {
        ...current,
        workout_days: workoutDays,
        exercises: flattenWorkoutDays(workoutDays),
      }
    })
    setSelectedExerciseId('')
  }

  const updateExercise = (dayIndex, exerciseIndex, field, value) => {
    setFormData((current) => {
      const workoutDays = current.workout_days.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              exercises: day.exercises.map((item, itemIndex) =>
                itemIndex === exerciseIndex ? { ...item, [field]: value } : item,
              ),
            }
          : day,
      )

      return {
        ...current,
        workout_days: workoutDays,
        exercises: flattenWorkoutDays(workoutDays),
      }
    })
  }

  const removeExercise = (dayIndex, exerciseIndex) => {
    setFormData((current) => {
      const workoutDays = current.workout_days.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              exercises: day.exercises.filter(
                (_, itemIndex) => itemIndex !== exerciseIndex,
              ),
            }
          : day,
      )

      return {
        ...current,
        workout_days: workoutDays,
        exercises: flattenWorkoutDays(workoutDays),
      }
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const confirmation = await Swal.fire({
      title: workoutId ? 'Update workout?' : 'Save workout?',
      text: 'This workout program will be available in the admin dashboard and mobile app.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: workoutId ? 'Yes, update workout' : 'Yes, save workout',
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

      if (workoutId) payloadData.append('_method', 'PUT')

      Object.entries({
        name: formData.name,
        goal: formData.goal,
        workout_level: formData.workout_level,
        workout_type: formData.workout_type,
        duration: formData.duration,
        calories_burn: formData.calories_burn,
        description: formData.description,
        days_count: String(formData.days_count || 1),
        warm_up: formData.warm_up,
        trainer_notes: formData.trainer_notes,
        cool_down: formData.cool_down,
        publish_status: formData.publish_status,
        show_in_mobile_app: formData.show_in_mobile_app ? '1' : '0',
        access_type: formData.access_type,
      }).forEach(([key, value]) => payloadData.append(key, value || ''))

      formData.workout_days.forEach((day, dayIndex) => {
        payloadData.append(`workout_days[${dayIndex}][day_number]`, day.day_number)
        payloadData.append(`workout_days[${dayIndex}][title]`, day.title || '')
        payloadData.append(`workout_days[${dayIndex}][notes]`, day.notes || '')

        ;(day.exercises || []).forEach((exercise, exerciseIndex) => {
          Object.entries(exercise).forEach(([key, value]) => {
            payloadData.append(
              `workout_days[${dayIndex}][exercises][${exerciseIndex}][${key}]`,
              value || '',
            )
          })
        })
      })

      flattenWorkoutDays(formData.workout_days).forEach((exercise, index) => {
        Object.entries(exercise).forEach(([key, value]) => {
          payloadData.append(`exercises[${index}][${key}]`, value || '')
        })
      })

      if (formData.cover_image_file) {
        payloadData.append('cover_image_file', formData.cover_image_file)
      }

      const response = await fetch(
        `${apiBaseUrl}/workouts${workoutId ? `/${workoutId}` : ''}`,
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

        throw new Error(validationMessage || 'Unable to save workout.')
      }

      await Swal.fire({
        title: workoutId ? 'Workout updated' : 'Workout saved',
        text:
          payload.message ||
          `Workout ${workoutId ? 'updated' : 'created'} successfully.`,
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })

      onBack()
    } catch (caughtError) {
      await Swal.fire({
        title: 'Save failed',
        text: caughtError.message || 'Unable to save workout.',
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
            Back to Workouts
          </button>

          <h1 className="text-4xl font-black">
            {workoutId ? 'Edit Workout' : 'Add Workout'}
          </h1>
          <p className="text-gray-400 mt-1">
            Build a complete workout program using exercises, levels and goals.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="bg-[#C8A13A] disabled:opacity-60 text-black font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {isSubmitting ? 'Saving...' : 'Save Workout'}
        </button>
      </div>

      {isLoading ? (
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
          Loading workout...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Section title="Workout Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  icon={Activity}
                  label="Workout Name"
                  value={formData.name}
                  onChange={(value) => updateField('name', value)}
                  placeholder="Upper Body Strength"
                />
                <Select
                  label="Workout Goal"
                  value={formData.goal}
                  onChange={(value) => updateField('goal', value)}
                  options={[
                    'Weight Loss',
                    'Muscle Gain',
                    'Strength',
                    'Endurance',
                    'General Fitness',
                  ]}
                />
                <Select
                  label="Workout Level"
                  value={formData.workout_level}
                  onChange={(value) => updateField('workout_level', value)}
                  options={['Beginner', 'Intermediate', 'Advanced', 'Elite']}
                />
                <Select
                  label="Workout Type"
                  value={formData.workout_type}
                  onChange={(value) => updateField('workout_type', value)}
                  options={[
                    'Full Body',
                    'Upper Body',
                    'Lower Body',
                    'Push Day',
                    'Pull Day',
                    'Leg Day',
                    'Cardio',
                    'HIIT',
                  ]}
                />
                <Input
                  icon={Clock}
                  label="Duration"
                  value={formData.duration}
                  onChange={(value) => updateField('duration', value)}
                  placeholder="45 min"
                />
                <Input
                  icon={Flame}
                  label="Calories Burn"
                  value={formData.calories_burn}
                  onChange={(value) => updateField('calories_burn', value)}
                  placeholder="420 kcal"
                />
                <Input
                  icon={CalendarDays}
                  label="Number of Days"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.days_count}
                  onChange={updateDaysCount}
                  placeholder="7"
                />
              </div>

              <TextArea
                label="Workout Description"
                value={formData.description}
                onChange={(value) => updateField('description', value)}
                placeholder="A complete upper body strength workout."
              />
            </Section>

            <Section title="Workout Days & Exercises">
              <div className="flex gap-3 overflow-x-auto pb-3 mb-5">
                {formData.workout_days.map((day, index) => {
                  const active = selectedDayIndex === index

                  return (
                    <button
                      key={day.day_number}
                      type="button"
                      onClick={() => setSelectedDayIndex(index)}
                      className={`shrink-0 rounded-2xl border px-4 py-3 text-left ${
                        active
                          ? 'border-[#C8A13A] bg-[#C8A13A] text-black'
                          : 'border-white/10 bg-[#050505] text-white'
                      }`}
                    >
                      <span className="block text-xs font-black uppercase">
                        Day {day.day_number}
                      </span>
                      <span className="block text-sm font-bold max-w-[140px] truncate">
                        {day.title || `Day ${day.day_number}`}
                      </span>
                    </button>
                  )
                })}
              </div>

              {formData.workout_days[selectedDayIndex] && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <Input
                    label="Day Title"
                    value={formData.workout_days[selectedDayIndex].title || ''}
                    onChange={(value) =>
                      updateWorkoutDay(selectedDayIndex, 'title', value)
                    }
                    placeholder={`Day ${selectedDayIndex + 1}`}
                  />
                  <Input
                    label="Day Notes"
                    value={formData.workout_days[selectedDayIndex].notes || ''}
                    onChange={(value) =>
                      updateWorkoutDay(selectedDayIndex, 'notes', value)
                    }
                    placeholder="Chest and triceps focus"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
                <select
                  value={selectedExerciseId}
                  onChange={(event) => setSelectedExerciseId(event.target.value)}
                  className="md:col-span-3 appearance-none bg-[#050505] border border-white/10 rounded-2xl px-4 py-4 text-white outline-none [color-scheme:dark]"
                >
                  <option value="" className="bg-[#050505] text-white">
                    Select Exercise
                  </option>
                  {exerciseOptions.map((exercise) => (
                    <option
                      key={exercise.id}
                      value={exercise.id}
                      className="bg-[#050505] text-white"
                    >
                      {exercise.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={addExercise}
                  className="bg-[#C8A13A] text-black font-bold rounded-2xl flex items-center justify-center gap-2 py-4 md:py-0"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>

              <div className="space-y-4">
                {(formData.workout_days[selectedDayIndex]?.exercises || []).length === 0 && (
                  <div className="bg-[#050505] border border-white/10 rounded-3xl p-5 text-gray-400 text-center">
                    No exercises added for this day yet.
                  </div>
                )}

                {(formData.workout_days[selectedDayIndex]?.exercises || []).map((exercise, index) => (
                  <div
                    key={`${exercise.exercise_id}-${index}`}
                    className="bg-[#050505] border border-white/10 rounded-3xl p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                  >
                    <div className="md:col-span-1 text-gray-500">
                      <GripVertical size={20} />
                    </div>

                    <div className="md:col-span-4">
                      <h4 className="font-bold">{exercise.name}</h4>
                      <p className="text-gray-500 text-sm">
                        {exercise.body_part || 'Body part not set'}
                      </p>
                    </div>

                      <SmallInput
                        label="Sets"
                        value={exercise.sets}
                        onChange={(value) =>
                          updateExercise(selectedDayIndex, index, 'sets', value)
                        }
                      />
                      <SmallInput
                        label="Reps"
                        value={exercise.reps}
                        onChange={(value) =>
                          updateExercise(selectedDayIndex, index, 'reps', value)
                        }
                      />
                      <SmallInput
                        label="Rest"
                        value={exercise.rest}
                        onChange={(value) =>
                          updateExercise(selectedDayIndex, index, 'rest', value)
                        }
                      />

                    <div className="md:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeExercise(selectedDayIndex, index)}
                        className="w-10 h-10 rounded-xl border border-white/10 text-red-400 hover:bg-red-500/10 flex items-center justify-center"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Workout Instructions">
              <TextArea
                label="Warm Up"
                value={formData.warm_up}
                onChange={(value) => updateField('warm_up', value)}
                placeholder="5 minutes light cardio and mobility."
              />
              <TextArea
                label="Trainer Notes"
                value={formData.trainer_notes}
                onChange={(value) => updateField('trainer_notes', value)}
                placeholder="Maintain correct form and rest properly."
              />
              <TextArea
                label="Cool Down"
                value={formData.cool_down}
                onChange={(value) => updateField('cool_down', value)}
                placeholder="Stretch for 5 minutes."
              />
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="Workout Cover">
              <FileInput
                icon={Image}
                label="Cover Image"
                accept="image/*"
                currentUrl={formData.cover_image_url}
                file={formData.cover_image_file}
                onChange={(file) => updateField('cover_image_file', file)}
              />
            </Section>

            <Section title="Workout Summary">
              <SummaryItem icon={Dumbbell} label="Exercises" value={summary.exercises} />
              <SummaryItem icon={CalendarDays} label="Days" value={summary.days} />
              <SummaryItem icon={Clock} label="Duration" value={summary.duration} />
              <SummaryItem icon={Flame} label="Calories" value={summary.calories} />
              <SummaryItem icon={Trophy} label="Level" value={summary.level} />
              <SummaryItem icon={Target} label="Goal" value={summary.goal} />
            </Section>

            <Section title="Publishing">
              <div className="space-y-5">
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
                  options={['Free', 'Premium', 'Members Only']}
                />
              </div>
            </Section>
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
  min,
  max,
}) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <div className="flex items-center bg-[#050505] border border-white/10 rounded-2xl px-4">
        {Icon && <Icon size={18} className="text-[#C8A13A] mr-3 shrink-0" />}
        <input
          type={type}
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none py-4 text-white placeholder:text-gray-600"
        />
      </div>
    </div>
  )
}

function SmallInput({ label, value, onChange }) {
  return (
    <div className="md:col-span-2">
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <input
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
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
    <div className="mt-5 first:mt-0">
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

function normalizeWorkoutDays(workoutDays, daysCount, legacyExercises = []) {
  if (Array.isArray(workoutDays) && workoutDays.length > 0) {
    return workoutDays.map((day, index) => ({
      day_number: Number(day.day_number) || index + 1,
      title: day.title || `Day ${index + 1}`,
      notes: day.notes || '',
      exercises: Array.isArray(day.exercises) ? day.exercises : [],
    }))
  }

  const count = Math.max(1, Number.parseInt(daysCount, 10) || 1)
  const exercises = Array.isArray(legacyExercises) ? legacyExercises : []

  return Array.from({ length: count }, (_, index) => ({
    day_number: index + 1,
    title: `Day ${index + 1}`,
    notes: '',
    exercises: index === 0 ? exercises : [],
  }))
}

function flattenWorkoutDays(workoutDays) {
  if (!Array.isArray(workoutDays)) return []

  return workoutDays.flatMap((day) =>
    (Array.isArray(day.exercises) ? day.exercises : []).map((exercise) => ({
      ...exercise,
      day_number: day.day_number,
      day_title: day.title,
    })),
  )
}
