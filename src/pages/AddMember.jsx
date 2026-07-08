import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Save,
  Upload,
  User,
} from "lucide-react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
const turnstileAgentId = import.meta.env.VITE_TURNSTILE_AGENT_ID ?? "";

const emptyMember = {
  full_name: "",
  phone: "",
  email: "",
  access_code: "",
  gender: "Male",
  date_of_birth: "",
  address: "",
  membership_plan_id: "",
  membership_status: "Active",
  start_date: "",
  expiry_date: "",
  amount_paid: "",
  payment_method: "Cash",
  payment_status: "Paid",
  height_cm: "",
  weight_kg: "",
  fitness_goal: "General Fitness",
  workout_level: "Beginner",
  emergency_contact_name: "",
  emergency_contact_relationship: "",
  emergency_contact_phone: "",
};

export default function AddMember({ onBack, memberId = null }) {
  const [plans, setPlans] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(memberId));
  const [isFetchingCard, setIsFetchingCard] = useState(false);
  const [isPushingCard, setIsPushingCard] = useState(false);
  const [pushCardNow, setPushCardNow] = useState(false);
  const [formData, setFormData] = useState({ ...emptyMember });

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/membership-plans`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem("aurex_admin_token")}`,
          },
        });
        const payload = await response.json();

        if (response.ok) {
          setPlans(payload.plans || []);
        }
      } catch {
        setPlans([]);
      }
    };

    loadPlans();
  }, []);

  useEffect(() => {
    if (!memberId) {
      return;
    }

    let shouldUpdate = true;

    const loadMember = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`${apiBaseUrl}/members/${memberId}`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem("aurex_admin_token")}`,
          },
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || "Unable to load member.");
        }

        if (!shouldUpdate) return;

        const member = payload.member;

        setFormData({
          full_name: member.full_name || "",
          phone: member.phone || "",
          email: member.email || "",
          access_code: member.access_code || "",
          gender: member.gender || "Male",
          date_of_birth: dateInputValue(member.date_of_birth),
          address: member.address || "",
          membership_plan_id: member.membership_plan_id || "",
          membership_status: member.membership_status || "Active",
          start_date: dateInputValue(member.start_date),
          expiry_date: dateInputValue(member.expiry_date),
          amount_paid: String(member.amount_paid ?? ""),
          payment_method: member.payment_method || "Cash",
          payment_status: member.payment_status || "Paid",
          height_cm: member.height_cm ? String(member.height_cm) : "",
          weight_kg: member.weight_kg ? String(member.weight_kg) : "",
          fitness_goal: member.fitness_goal || "General Fitness",
          workout_level: member.workout_level || "Beginner",
          emergency_contact_name: member.emergency_contact_name || "",
          emergency_contact_relationship:
            member.emergency_contact_relationship || "",
          emergency_contact_phone: member.emergency_contact_phone || "",
        });
      } catch (caughtError) {
        await Swal.fire({
          title: "Load failed",
          text: caughtError.message || "Unable to load member.",
          icon: "error",
          background: "#101010",
          color: "#ffffff",
          confirmButtonColor: "#C8A13A",
        });
        onBack();
      } finally {
        if (shouldUpdate) {
          setIsLoading(false);
        }
      }
    };

    loadMember();

    return () => {
      shouldUpdate = false;
    };
  }, [memberId, onBack]);

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const authHeaders = () => ({
    Accept: "application/json",
    Authorization: `Bearer ${localStorage.getItem("aurex_admin_token")}`,
  });

  const fetchCardFromTurnstile = async () => {
    setIsFetchingCard(true);

    try {
      const response = await fetch(`${apiBaseUrl}/turnstile/latest-card`, {
        headers: authHeaders(),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Unable to fetch latest card.");
      }

      if (!payload.card_number) {
        throw new Error("No turnstile card scan found yet.");
      }

      updateField("access_code", String(payload.card_number));

      await Swal.fire({
        title: "Card captured",
        text: `Card ${payload.card_number} loaded from turnstile events.`,
        icon: "success",
        background: "#101010",
        color: "#ffffff",
        confirmButtonColor: "#C8A13A",
      });
    } catch (caughtError) {
      await Swal.fire({
        title: "Fetch failed",
        text: caughtError.message || "Unable to read card from turnstile.",
        icon: "error",
        background: "#101010",
        color: "#ffffff",
        confirmButtonColor: "#C8A13A",
      });
    } finally {
      setIsFetchingCard(false);
    }
  };

  const pushCardToTurnstile = async ({
    cardNumber,
    memberName,
    expiryDate,
  }) => {
    if (!cardNumber) {
      throw new Error("Turnstile Card Number is required before pushing.");
    }

    setIsPushingCard(true);

    try {
      const response = await fetch(`${apiBaseUrl}/turnstile/cards/push`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id: turnstileAgentId || null,
          card_number: cardNumber,
          member_name: memberName || null,
          expiry_date: expiryDate || null,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        const validationMessage = payload.errors
          ? Object.values(payload.errors).flat().join(" ")
          : payload.message;

        throw new Error(
          validationMessage || "Unable to push card to turnstile.",
        );
      }

      return payload.message || "Card push command queued.";
    } finally {
      setIsPushingCard(false);
    }
  };

  const handlePushCardOnly = async () => {
    try {
      const message = await pushCardToTurnstile({
        cardNumber: formData.access_code.trim(),
        memberName: formData.full_name.trim(),
        expiryDate: formData.expiry_date,
      });

      await Swal.fire({
        title: "Queued",
        text: message,
        icon: "success",
        background: "#101010",
        color: "#ffffff",
        confirmButtonColor: "#C8A13A",
      });
    } catch (caughtError) {
      await Swal.fire({
        title: "Push failed",
        text: caughtError.message || "Unable to push card to turnstile.",
        icon: "error",
        background: "#101010",
        color: "#ffffff",
        confirmButtonColor: "#C8A13A",
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const confirmation = await Swal.fire({
      title: memberId ? "Update member?" : "Save member?",
      text: memberId
        ? "This member profile and linked mobile app login account will be updated."
        : "This member will be added to the gym system and receive mobile app login credentials by email.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: memberId ? "Yes, update member" : "Yes, save member",
      cancelButtonText: "Cancel",
      background: "#101010",
      color: "#ffffff",
      confirmButtonColor: "#C8A13A",
      cancelButtonColor: "#2a2a2a",
    });

    if (!confirmation.isConfirmed) return;

    setIsSubmitting(true);

    Swal.fire({
      title: "Saving member...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      background: "#101010",
      color: "#ffffff",
      didOpen: () => Swal.showLoading(),
    });

    try {
      const response = await fetch(
        `${apiBaseUrl}/members${memberId ? `/${memberId}` : ""}`,
        {
          method: memberId ? "PUT" : "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem("aurex_admin_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            membership_plan_id: formData.membership_plan_id || null,
            access_code: formData.access_code.trim() || null,
            date_of_birth: formData.date_of_birth || null,
            start_date: formData.start_date || null,
            expiry_date: formData.expiry_date || null,
            amount_paid: Number(formData.amount_paid || 0),
            height_cm: formData.height_cm ? Number(formData.height_cm) : null,
            weight_kg: formData.weight_kg ? Number(formData.weight_kg) : null,
          }),
        },
      );
      const payload = await response.json();

      if (!response.ok) {
        const validationMessage = payload.errors
          ? Object.values(payload.errors).flat().join(" ")
          : payload.message;

        throw new Error(validationMessage || "Unable to save member.");
      }

      let pushMessage = "";

      if (pushCardNow && formData.access_code.trim()) {
        pushMessage = await pushCardToTurnstile({
          cardNumber: formData.access_code.trim(),
          memberName: payload.member?.full_name || formData.full_name.trim(),
          expiryDate: formData.expiry_date,
        });
      }

      await Swal.fire({
        title: memberId ? "Member updated" : "Member saved",
        text: [
          payload.message ||
            `Member ${memberId ? "updated" : "created"} successfully.`,
          pushMessage,
        ]
          .filter(Boolean)
          .join(" "),
        icon: "success",
        background: "#101010",
        color: "#ffffff",
        confirmButtonColor: "#C8A13A",
      });

      onBack();
    } catch (caughtError) {
      await Swal.fire({
        title: "Save failed",
        text: caughtError.message || "Unable to save member.",
        icon: "error",
        background: "#101010",
        color: "#ffffff",
        confirmButtonColor: "#C8A13A",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Back to Members
          </button>

          <h1 className="text-4xl font-black">
            {memberId ? "Edit Member" : "Add Member"}
          </h1>
          <p className="text-gray-400 mt-1">
            {memberId
              ? "Update member profile, membership and payment information."
              : "Register a new gym member and assign membership plan."}
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#C8A13A] text-black font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {isSubmitting
            ? "Saving..."
            : memberId
              ? "Update Member"
              : "Save Member"}
        </button>
      </div>

      {isLoading ? (
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
          Loading member...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Section title="Personal Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  icon={User}
                  label="Full Name"
                  placeholder="John Michael"
                  value={formData.full_name}
                  onChange={(event) =>
                    updateField("full_name", event.target.value)
                  }
                />
                <Input
                  icon={Phone}
                  label="Phone Number"
                  placeholder="+255 712 345 678"
                  value={formData.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                />
                <Input
                  icon={Mail}
                  label="Email Address"
                  placeholder="john@email.com"
                  value={formData.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
                <Select
                  label="Gender"
                  value={formData.gender}
                  onChange={(event) =>
                    updateField("gender", event.target.value)
                  }
                  options={["Male", "Female"]}
                />
                <Input
                  icon={Calendar}
                  label="Date of Birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(event) =>
                    updateField("date_of_birth", event.target.value)
                  }
                />
                <Input
                  icon={MapPin}
                  label="Address"
                  placeholder="Arusha, Tanzania"
                  value={formData.address}
                  onChange={(event) =>
                    updateField("address", event.target.value)
                  }
                />
              </div>
            </Section>

            <Section title="Membership Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select
                  label="Membership Plan"
                  value={formData.membership_plan_id}
                  onChange={(event) =>
                    updateField("membership_plan_id", event.target.value)
                  }
                  options={[
                    { label: "Select Plan", value: "" },
                    ...plans.map((plan) => ({
                      label: plan.name,
                      value: plan.id,
                    })),
                  ]}
                />
                <Select
                  label="Membership Status"
                  value={formData.membership_status}
                  onChange={(event) =>
                    updateField("membership_status", event.target.value)
                  }
                  options={["Active", "Pending", "Expired", "Suspended"]}
                />
                <Input
                  icon={CreditCard}
                  label="Turnstile Card Number"
                  placeholder="Numeric card number, e.g. 100245"
                  value={formData.access_code}
                  onChange={(event) =>
                    updateField("access_code", event.target.value)
                  }
                />
                <div className="md:col-span-2 flex flex-wrap gap-3 items-center">
                  <button
                    type="button"
                    onClick={fetchCardFromTurnstile}
                    disabled={isFetchingCard || isSubmitting || isLoading}
                    className="px-4 py-2 rounded-xl border border-[#C8A13A]/60 text-[#C8A13A] hover:bg-[#C8A13A]/10 disabled:opacity-50"
                  >
                    {isFetchingCard
                      ? "Reading from turnstile..."
                      : "Read Card From Turnstile"}
                  </button>
                  <button
                    type="button"
                    onClick={handlePushCardOnly}
                    disabled={isPushingCard || isSubmitting || isLoading}
                    className="px-4 py-2 rounded-xl border border-white/20 text-white hover:border-[#C8A13A]/60 hover:text-[#C8A13A] disabled:opacity-50"
                  >
                    {isPushingCard
                      ? "Queueing push..."
                      : "Push Entered Card To Turnstile"}
                  </button>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={pushCardNow}
                      onChange={(event) => setPushCardNow(event.target.checked)}
                      className="accent-[#C8A13A]"
                    />
                    Auto-push card when saving this member
                  </label>
                </div>
                <Input
                  icon={Calendar}
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(event) =>
                    updateField("start_date", event.target.value)
                  }
                />
                <Input
                  icon={Calendar}
                  label="Expiry Date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(event) =>
                    updateField("expiry_date", event.target.value)
                  }
                />
                <Input
                  icon={CreditCard}
                  label="Amount Paid"
                  placeholder="100000"
                  type="number"
                  value={formData.amount_paid}
                  onChange={(event) =>
                    updateField("amount_paid", event.target.value)
                  }
                />
                <Select
                  label="Payment Method"
                  value={formData.payment_method}
                  onChange={(event) =>
                    updateField("payment_method", event.target.value)
                  }
                  options={[
                    "Cash",
                    "M-Pesa",
                    "Airtel Money",
                    "Bank Transfer",
                    "Card",
                  ]}
                />
                <Select
                  label="Payment Status"
                  value={formData.payment_status}
                  onChange={(event) =>
                    updateField("payment_status", event.target.value)
                  }
                  options={["Paid", "Pending", "Failed"]}
                />
              </div>
            </Section>

            <Section title="Fitness Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Height"
                  placeholder="180"
                  type="number"
                  value={formData.height_cm}
                  onChange={(event) =>
                    updateField("height_cm", event.target.value)
                  }
                />
                <Input
                  label="Weight"
                  placeholder="85"
                  type="number"
                  value={formData.weight_kg}
                  onChange={(event) =>
                    updateField("weight_kg", event.target.value)
                  }
                />
                <Select
                  label="Fitness Goal"
                  value={formData.fitness_goal}
                  onChange={(event) =>
                    updateField("fitness_goal", event.target.value)
                  }
                  options={[
                    "Weight Loss",
                    "Muscle Gain",
                    "Strength",
                    "General Fitness",
                  ]}
                />
                <Select
                  label="Workout Level"
                  value={formData.workout_level}
                  onChange={(event) =>
                    updateField("workout_level", event.target.value)
                  }
                  options={["Beginner", "Intermediate", "Advanced"]}
                />
              </div>
            </Section>
          </div>

          <div className="space-y-6">
            <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
              <h3 className="text-xl font-bold mb-5">Profile Photo</h3>

              <div className="h-56 rounded-3xl border border-dashed border-[#C8A13A]/50 bg-[#050505] flex flex-col items-center justify-center text-center">
                <Upload className="text-[#C8A13A]" size={34} />
                <p className="font-bold mt-3">Upload Photo</p>
                <p className="text-gray-500 text-sm mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
              <h3 className="text-xl font-bold mb-4">Emergency Contact</h3>

              <div className="space-y-5">
                <Input
                  label="Contact Name"
                  placeholder="Jane Michael"
                  value={formData.emergency_contact_name}
                  onChange={(event) =>
                    updateField("emergency_contact_name", event.target.value)
                  }
                />
                <Input
                  label="Relationship"
                  placeholder="Sister"
                  value={formData.emergency_contact_relationship}
                  onChange={(event) =>
                    updateField(
                      "emergency_contact_relationship",
                      event.target.value,
                    )
                  }
                />
                <Input
                  label="Phone Number"
                  placeholder="+255 700 000 000"
                  value={formData.emergency_contact_phone}
                  onChange={(event) =>
                    updateField("emergency_contact_phone", event.target.value)
                  }
                />
              </div>
            </div>

            <div className="bg-[#C8A13A]/10 border border-[#C8A13A]/30 rounded-3xl p-5">
              <h4 className="text-[#C8A13A] font-bold">Member Summary</h4>
              <p className="text-gray-400 text-sm mt-2">
                New member will be added to the gym system and receive mobile
                app login credentials by email.
              </p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function dateInputValue(value) {
  if (!value) return "";

  return String(value).slice(0, 10);
}

function Section({ title, children }) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
      <h2 className="text-xl font-bold mb-5">{title}</h2>
      {children}
    </div>
  );
}

function Input({
  label,
  placeholder,
  icon: Icon,
  type = "text",
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
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full bg-transparent outline-none py-4 text-white placeholder:text-gray-600"
        />
      </div>
    </div>
  );
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
        {options.map((option) => (
          <option
            key={typeof option === "string" ? option : option.value}
            value={typeof option === "string" ? option : option.value}
            className="bg-[#050505] text-white"
          >
            {typeof option === "string" ? option : option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
