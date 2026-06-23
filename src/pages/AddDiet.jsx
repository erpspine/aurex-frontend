import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'

import {
  ArrowLeft,
  Beef,
  Droplet,
  Flame,
  Image,
  Plus,
  Save,
  Smartphone,
  Target,
  Trash2,
  Utensils,
  Wheat,
} from 'lucide-react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

const emptyDiet = {
  name: '',
  goal: 'General Fitness',
  workout_level: 'All Levels',
  diet_type: 'Normal',
  daily_calories: '',
  duration: '',
  description: '',
  protein: '',
  carbs: '',
  fat: '',
  fiber: '',
  meals: [],
  meal_instructions: '',
  nutritionist_notes: '',
  cover_image_url: '',
  cover_image_file: null,
  show_in_mobile_app: true,
  access_type: 'Members Only',
  publish_status: 'Published',
}

export default function AddDiet({ onBack, dietId = null }) {
  const [formData, setFormData] = useState({ ...emptyDiet })
  const [mealDraft, setMealDraft] = useState({
    name: 'Breakfast',
    food: '',
    calories: '',
  })
  const [isLoading, setIsLoading] = useState(Boolean(dietId))
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!dietId) return

    let shouldUpdate = true

    const loadDiet = async () => {
      setIsLoading(true)

      try {
        const response = await fetch(`${apiBaseUrl}/diet-plans/${dietId}`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
          },
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load diet plan.')
        }

        if (!shouldUpdate) return

        const diet = payload.diet_plan

        setFormData({
          name: diet.name || '',
          goal: diet.goal || 'General Fitness',
          workout_level: diet.workout_level || 'All Levels',
          diet_type: diet.diet_type || 'Normal',
          daily_calories: diet.daily_calories || '',
          duration: diet.duration || '',
          description: diet.description || '',
          protein: diet.protein || '',
          carbs: diet.carbs || '',
          fat: diet.fat || '',
          fiber: diet.fiber || '',
          meals: Array.isArray(diet.meals) ? diet.meals : [],
          meal_instructions: diet.meal_instructions || '',
          nutritionist_notes: diet.nutritionist_notes || '',
          cover_image_url: diet.cover_image_url || '',
          cover_image_file: null,
          show_in_mobile_app: Boolean(diet.show_in_mobile_app),
          access_type: diet.access_type || 'Members Only',
          publish_status: diet.publish_status || 'Published',
        })
      } catch (caughtError) {
        await Swal.fire({
          title: 'Load failed',
          text: caughtError.message || 'Unable to load diet plan.',
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

    loadDiet()

    return () => {
      shouldUpdate = false
    }
  }, [dietId, onBack])

  const summary = useMemo(
    () => ({
      calories: formData.daily_calories || 'Not set',
      protein: formData.protein || 'Not set',
      carbs: formData.carbs || 'Not set',
      fat: formData.fat || 'Not set',
      meals: formData.meals.length,
    }),
    [formData],
  )

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const addMeal = () => {
    if (!mealDraft.food.trim()) return

    setFormData((current) => ({
      ...current,
      meals: [...current.meals, { ...mealDraft }],
    }))
    setMealDraft({ name: 'Breakfast', food: '', calories: '' })
  }

  const removeMeal = (index) => {
    setFormData((current) => ({
      ...current,
      meals: current.meals.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const confirmation = await Swal.fire({
      title: dietId ? 'Update diet plan?' : 'Save diet plan?',
      text: 'This diet plan will be available in the admin dashboard and mobile app.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: dietId ? 'Yes, update diet plan' : 'Yes, save diet plan',
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

      if (dietId) payloadData.append('_method', 'PUT')

      Object.entries({
        name: formData.name,
        goal: formData.goal,
        workout_level: formData.workout_level,
        diet_type: formData.diet_type,
        daily_calories: formData.daily_calories,
        duration: formData.duration,
        description: formData.description,
        protein: formData.protein,
        carbs: formData.carbs,
        fat: formData.fat,
        fiber: formData.fiber,
        meal_instructions: formData.meal_instructions,
        nutritionist_notes: formData.nutritionist_notes,
        show_in_mobile_app: formData.show_in_mobile_app ? '1' : '0',
        access_type: formData.access_type,
        publish_status: formData.publish_status,
      }).forEach(([key, value]) => payloadData.append(key, value || ''))

      formData.meals.forEach((meal, index) => {
        Object.entries(meal).forEach(([key, value]) => {
          payloadData.append(`meals[${index}][${key}]`, value || '')
        })
      })

      if (formData.cover_image_file) {
        payloadData.append('cover_image_file', formData.cover_image_file)
      }

      const response = await fetch(
        `${apiBaseUrl}/diet-plans${dietId ? `/${dietId}` : ''}`,
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

        throw new Error(validationMessage || 'Unable to save diet plan.')
      }

      await Swal.fire({
        title: dietId ? 'Diet plan updated' : 'Diet plan saved',
        text:
          payload.message ||
          `Diet plan ${dietId ? 'updated' : 'created'} successfully.`,
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })

      onBack()
    } catch (caughtError) {
      await Swal.fire({
        title: 'Save failed',
        text: caughtError.message || 'Unable to save diet plan.',
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
            Back to Diet Plans
          </button>

          <h1 className="text-4xl font-black">
            {dietId ? 'Edit Diet Plan' : 'Add Diet Plan'}
          </h1>
          <p className="text-gray-400 mt-1">
            Create meal plans, calories, macros and nutrition guidance.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="bg-[#C8A13A] disabled:opacity-60 text-black font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {isSubmitting ? 'Saving...' : 'Save Diet Plan'}
        </button>
      </div>

      {isLoading ? (
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
          Loading diet plan...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Section title="Diet Plan Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  icon={Utensils}
                  label="Diet Plan Name"
                  value={formData.name}
                  onChange={(value) => updateField('name', value)}
                  placeholder="Weight Loss Plan"
                />
                <Select
                  label="Fitness Goal"
                  value={formData.goal}
                  onChange={(value) => updateField('goal', value)}
                  options={[
                    'Weight Loss',
                    'Muscle Gain',
                    'General Fitness',
                    'High Protein',
                    'Balanced Diet',
                  ]}
                />
                <Select
                  label="Workout Level"
                  value={formData.workout_level}
                  onChange={(value) => updateField('workout_level', value)}
                  options={[
                    'Beginner',
                    'Intermediate',
                    'Advanced',
                    'Elite',
                    'All Levels',
                  ]}
                />
                <Select
                  label="Diet Type"
                  value={formData.diet_type}
                  onChange={(value) => updateField('diet_type', value)}
                  options={[
                    'Normal',
                    'Vegetarian',
                    'Vegan',
                    'Keto',
                    'Low Carb',
                    'High Protein',
                  ]}
                />
                <Input
                  icon={Flame}
                  label="Daily Calories"
                  value={formData.daily_calories}
                  onChange={(value) => updateField('daily_calories', value)}
                  placeholder="1,800 kcal"
                />
                <Input
                  icon={Target}
                  label="Duration"
                  value={formData.duration}
                  onChange={(value) => updateField('duration', value)}
                  placeholder="30 Days"
                />
              </div>

              <TextArea
                label="Diet Description"
                value={formData.description}
                onChange={(value) => updateField('description', value)}
                placeholder="A balanced diet plan designed for fat loss."
              />
            </Section>

            <Section title="Macro Targets">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <Input
                  icon={Beef}
                  label="Protein"
                  value={formData.protein}
                  onChange={(value) => updateField('protein', value)}
                  placeholder="140g"
                />
                <Input
                  icon={Wheat}
                  label="Carbs"
                  value={formData.carbs}
                  onChange={(value) => updateField('carbs', value)}
                  placeholder="180g"
                />
                <Input
                  icon={Droplet}
                  label="Fat"
                  value={formData.fat}
                  onChange={(value) => updateField('fat', value)}
                  placeholder="55g"
                />
                <Input
                  label="Fiber"
                  value={formData.fiber}
                  onChange={(value) => updateField('fiber', value)}
                  placeholder="30g"
                />
              </div>
            </Section>

            <Section title="Meal Planner">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-5">
                <select
                  value={mealDraft.name}
                  onChange={(event) =>
                    setMealDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="appearance-none bg-[#050505] border border-white/10 rounded-2xl px-4 py-4 text-white outline-none [color-scheme:dark]"
                >
                  {['Breakfast', 'Snack 1', 'Lunch', 'Snack 2', 'Dinner'].map(
                    (item) => (
                      <option key={item} className="bg-[#050505] text-white">
                        {item}
                      </option>
                    ),
                  )}
                </select>
                <input
                  value={mealDraft.food}
                  onChange={(event) =>
                    setMealDraft((current) => ({
                      ...current,
                      food: event.target.value,
                    }))
                  }
                  placeholder="Food items"
                  className="md:col-span-2 bg-[#050505] border border-white/10 rounded-2xl px-4 py-4 text-white outline-none placeholder:text-gray-600"
                />
                <input
                  value={mealDraft.calories}
                  onChange={(event) =>
                    setMealDraft((current) => ({
                      ...current,
                      calories: event.target.value,
                    }))
                  }
                  placeholder="Calories"
                  className="bg-[#050505] border border-white/10 rounded-2xl px-4 py-4 text-white outline-none placeholder:text-gray-600"
                />
                <button
                  type="button"
                  onClick={addMeal}
                  className="bg-[#C8A13A] text-black font-bold rounded-2xl flex items-center justify-center gap-2 py-4"
                >
                  <Plus size={18} />
                  Add Meal
                </button>
              </div>

              <div className="space-y-4">
                {formData.meals.length === 0 && (
                  <div className="bg-[#050505] border border-white/10 rounded-3xl p-5 text-center text-gray-400">
                    No meals added yet.
                  </div>
                )}
                {formData.meals.map((meal, index) => (
                  <div
                    key={`${meal.name}-${index}`}
                    className="bg-[#050505] border border-white/10 rounded-3xl p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-[#C8A13A]">{meal.name}</h4>
                      <p className="text-gray-300 mt-1">{meal.food}</p>
                      <p className="text-gray-500 text-sm mt-1">
                        {meal.calories || 'Calories not set'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMeal(index)}
                      className="w-10 h-10 rounded-xl border border-white/10 text-red-400 hover:bg-red-500/10 flex items-center justify-center shrink-0"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Nutrition Instructions">
              <TextArea
                label="Meal Instructions"
                value={formData.meal_instructions}
                onChange={(value) => updateField('meal_instructions', value)}
                placeholder="Eat meals at consistent times."
              />
              <TextArea
                label="Trainer / Nutritionist Notes"
                value={formData.nutritionist_notes}
                onChange={(value) => updateField('nutritionist_notes', value)}
                placeholder="Adjust portions based on progress."
              />
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="Diet Cover Image">
              <FileInput
                icon={Image}
                label="Cover Image"
                accept="image/*"
                currentUrl={formData.cover_image_url}
                file={formData.cover_image_file}
                onChange={(file) => updateField('cover_image_file', file)}
              />
            </Section>

            <Section title="Diet Summary">
              <SummaryItem label="Calories" value={summary.calories} />
              <SummaryItem label="Protein" value={summary.protein} />
              <SummaryItem label="Carbs" value={summary.carbs} />
              <SummaryItem label="Fat" value={summary.fat} />
              <SummaryItem label="Meals / Day" value={summary.meals} />
            </Section>

            <Section title="Mobile App Settings">
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

function SummaryItem({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-4 border-b border-white/10 last:border-b-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-bold text-right">{value}</span>
    </div>
  )
}
