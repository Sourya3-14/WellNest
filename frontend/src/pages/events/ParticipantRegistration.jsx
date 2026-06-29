import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { User, Calendar, MapPin, ArrowLeft, AlertCircle, Clock, CheckSquare, ShieldAlert, Phone, Info } from "lucide-react";
import { blockchainApi } from "../../utils/api.js";
import Navbar from "../../components/Navbar.jsx";

const ParticipantRegistration = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const location = useLocation();
  const { eventDetails, onSuccess } = location.state || {};

  const [formData, setFormData] = useState({
    phone: "",
    medicalConditions: "",
    bloodType: "",
    age: "",
    consent: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const isBloodDonation = eventDetails?.eventType?.toLowerCase().includes("blood-donation");

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Phone validation (10–15 digits, optional +)
    const phoneRegex = /^\+?[0-9]{10,15}$/;

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number (10-15 digits)";
    }

    if (!formData.age) {
      newErrors.age = "Age is required";
    }

    if (isBloodDonation) {
      if (!formData.bloodType) {
        newErrors.bloodType = "Blood type is required for blood donation";
      }
      if (formData.age && (formData.age < 18 || formData.age > 60)) {
        newErrors.age = "Age must be between 18 and 60 for blood donation";
      }
    }

    if (!formData.consent) {
      newErrors.consent = "You must accept the terms and conditions to register";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const { consent, ...participantData } = formData;
      const { data } = await blockchainApi.post("/part/register", {
        eventId: eventId,
        participantDetails: participantData,
      });

      if (data.success) {
        alert("Successfully registered for the event!");
        if (onSuccess) onSuccess();
        navigate(-1);
      } else {
        alert(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert(error.response?.data?.error || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
      <Navbar onLogout={handleLogout} />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Navigation Action Header */}
        <div className="space-y-4">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Event
          </button>

          {/* Event Context Hero Box */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Registration Portal</span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">Event Registration</h1>
            </div>

            {eventDetails && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                <h2 className="text-base font-bold text-slate-800">{eventDetails.eventTypeName}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{formatDate(eventDetails.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      {formatTime(eventDetails.startTime)} - {formatTime(eventDetails.endTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">Organized by {eventDetails.organizerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{eventDetails.location}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tokenized Rewards Warning Callout Banner */}
            {isBloodDonation && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-950">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold">Blood Donation Health Protocol</h3>
                  <p className="text-xs text-amber-800 leading-relaxed">You will receive verified decentralized smart network crypto rewards upon successful system validation. Please cross-reference that your physical biological parameters align with standard clinical metrics before committing.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Interactive Configuration Form */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Participant Specifications</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Contact Matrix Field Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm transition focus:outline-none focus:bg-white focus:ring-2 ${errors.phone ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-sky-100 focus:border-sky-500"}`}
                />
                {errors.phone && <p className="text-xs font-medium text-rose-600">{errors.phone}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Age Metric *
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="Enter current chronological age"
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm transition focus:outline-none focus:bg-white focus:ring-2 ${errors.age ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-sky-100 focus:border-sky-500"}`}
                />
                {errors.age && <p className="text-xs font-medium text-rose-600">{errors.age}</p>}
              </div>
            </div>

            {/* Conditional Sub-typing Registry Parameter */}
            {isBloodDonation && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
                  <CheckSquare className="w-3.5 h-3.5 text-slate-400" /> Blood Classification *
                </label>
                <select
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm transition focus:outline-none focus:bg-white focus:ring-2 ${errors.bloodType ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-sky-100 focus:border-sky-500"}`}>
                  <option value="">Select structured blood index profile</option>
                  {bloodTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.bloodType && <p className="text-xs font-medium text-rose-600">{errors.bloodType}</p>}
              </div>
            )}

            {/* Medical History Descriptive Input */}
            <div className="space-y-1.5">
              <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" /> Pathological / Medical Conditions (Optional)
              </label>
              <textarea
                name="medicalConditions"
                value={formData.medicalConditions}
                onChange={handleInputChange}
                rows="3"
                placeholder="Disclose any vital parameters, ongoing pharmaceuticals, or active medical historical states..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm transition focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
              />
            </div>

            {/* Voluntary Legal Framework Compliance Box */}
            <div className="pt-2">
              <div className={`relative flex items-start gap-3 p-4 bg-slate-50 border rounded-xl transition ${errors.consent ? "border-rose-300 bg-rose-50/20" : "border-slate-200"}`}>
                <input type="checkbox" id="consent" name="consent" checked={formData.consent} onChange={handleInputChange} className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-800 mt-1 cursor-pointer" />
                <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <label htmlFor="consent" className="text-sm font-bold text-slate-800 block cursor-pointer select-none">
                    Regulatory Legal Consent Agreement *
                  </label>
                  <ul className="list-disc pl-4 space-y-1 text-slate-500 font-medium">
                    <li>I affirm that I am initiating system event participation voluntarily and assume operational risk.</li>
                    <li>I verify that all submitted physical screening indicators represent valid metadata tracking logs.</li>
                    <li>I agree to obey all health infrastructure safety and checklist protocols deployed on-site.</li>
                    {isBloodDonation && (
                      <>
                        <li className="text-amber-700 font-semibold">I certify that my physical health matches legal biological donor specifications.</li>
                        <li className="text-amber-700 font-semibold">I issue informed, express authorization for clinical blood sample extraction processing.</li>
                        <li className="text-amber-700 font-semibold">I acknowledge that system token drops depend directly on node organizer attendance validation.</li>
                      </>
                    )}
                    <li>I permit the platform to archive this operational block profile data payload for compliance tracking.</li>
                  </ul>
                </div>
              </div>
              {errors.consent && <p className="text-xs font-medium text-rose-600 mt-1.5">{errors.consent}</p>}
            </div>

            {/* Process Execution Button */}
            <div className="pt-4 border-t border-slate-100 text-right">
              <button type="submit" disabled={loading} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Writing Registration Log...</span>
                  </>
                ) : (
                  <span>Commit Event Registration</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Operational Checklist Information Callout Panel */}
        <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-5 sm:p-6 space-y-3.5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
            <Info className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">On-Site Logistics Checklist</h4>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs font-medium text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-slate-500 select-none">•</span>
              <span>Arrive approximately 15 minutes prior to the target scheduling window block.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-500 select-none">•</span>
              <span>Provide valid legal credentialing documentation to local node handlers.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-500 select-none">•</span>
              <span>Comply consistently with localized sanitary and medical facility directives.</span>
            </li>
            {isBloodDonation && (
              <>
                <li className="flex items-start gap-2 text-emerald-400">
                  <span className="text-emerald-600 select-none">•</span>
                  <span>Ingest nutrient-dense meals and stay highly hydrated before launching collection.</span>
                </li>
                <li className="flex items-start gap-2 text-emerald-400">
                  <span className="text-emerald-600 select-none">•</span>
                  <span>Rest and track bio-parameters inside recovery stations following extraction.</span>
                </li>
                <li className="flex items-start gap-2 text-emerald-400">
                  <span className="text-emerald-600 select-none">•</span>
                  <span>Cryptographic smart ledger verification drops post automatically once signed off.</span>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ParticipantRegistration;
