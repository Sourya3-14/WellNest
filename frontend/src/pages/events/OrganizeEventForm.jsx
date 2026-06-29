import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Calendar, MapPin, Clock, Save, ArrowLeft, AlertCircle, Heart, Droplets, Plus, Truck, Apple, CheckCircle, XCircle, Link, DollarSign } from "lucide-react";

import Navbar from "../../components/Navbar.jsx";
import { blockchainApi } from "../../utils/api.js";
import { removeToken } from "../../utils/auth.js";

// Event type mapping
const eventTypeMapping = {
  "health-checkup": "Free Health CheckUp",
  vaccination: "Vaccination Drive",
  "blood-donation": "Blood Donation Camp",
  "mobile-health": "Mobile Health Camp",
  nutrition: "Nutrition & Diet Camps",
  other: "Other",
};

// Persistent state hook
const usePersistentState = (key, initialValue) => {
  const [state, setState] = useState(() => {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};

const OrganizeEventForm = () => {
  const navigate = useNavigate();
  const { eventType } = useParams();
  const location = useLocation();
  const eventTypeName = location.state?.eventTypeName || "Event";

  const [formData, setFormData] = usePersistentState("organizeFormData", {
    eventType: eventType,
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    locationURL: "",
    description: "",
    customEventName: "", // Added for "Other" event type
    donationNeeded: false, // Added for backend compatibility
    upiId: "", // Added for backend compatibility
  });

  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [status, setStatus] = useState(""); // success | failed | error
  const [errors, setErrors] = useState({});

  const eventIcons = {
    "health-checkup": <Heart className="w-6 h-6 text-sky-600" />,
    vaccination: <Plus className="w-6 h-6 text-emerald-600" />,
    "blood-donation": <Droplets className="w-6 h-6 text-rose-600" />,
    "mobile-health": <Truck className="w-6 h-6 text-indigo-600" />,
    nutrition: <Apple className="w-6 h-6 text-amber-600" />,
    other: <Calendar className="w-6 h-6 text-slate-500" />,
  };

  const isBloodDonation = eventType === "blood-donation";
  const isOtherEvent = eventType === "other";
  const role = localStorage.getItem("userRole");
  const canOrganize = ["ngo", "health_worker"].includes(role);

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
    const now = new Date();

    if (!formData.date) {
      newErrors.date = "Date is required";
    }
    if (!formData.startTime) {
      newErrors.startTime = "Start time is required";
    }
    if (!formData.endTime) {
      newErrors.endTime = "End time is required";
    }

    if (formData.date && formData.startTime && formData.endTime) {
      const eventDate = new Date(formData.date);

      const [sh, sm] = formData.startTime.split(":");
      const [eh, em] = formData.endTime.split(":");

      const startDateTime = new Date(eventDate);
      startDateTime.setHours(parseInt(sh), parseInt(sm), 0, 0);

      const endDateTime = new Date(eventDate);
      endDateTime.setHours(parseInt(eh), parseInt(em), 0, 0);

      if (startDateTime < now) {
        newErrors.date = "Event must be scheduled in the future";
      }

      if (endDateTime <= startDateTime) {
        newErrors.endTime = "End time must be after start time";
      }
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }
    if (!formData.locationURL.trim()) {
      newErrors.locationURL = "Location URL is required";
    }

    if (isOtherEvent && !formData.customEventName.trim()) {
      newErrors.customEventName = "Custom event name is required";
    }

    if (formData.donationNeeded && !formData.upiId.trim()) {
      newErrors.upiId = "UPI ID is required when donations are needed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setStatus("");
      const eventDate = new Date(formData.date);
      const [startHours, startMinutes] = formData.startTime.split(":");
      const [endHours, endMinutes] = formData.endTime.split(":");

      const startDateTime = new Date(eventDate);
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

      const endDateTime = new Date(eventDate);
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

      const backendData = {
        eventType: eventTypeMapping[eventType] || eventType,
        customEventName: isOtherEvent ? formData.customEventName : undefined,
        location: formData.location,
        locationURL: formData.locationURL,
        date: eventDate.toISOString(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        donationNeeded: formData.donationNeeded,
        upiId: formData.donationNeeded ? formData.upiId : undefined,
      };

      const { data } = await blockchainApi.post("/organise/set", backendData);

      if (data.success) {
        setStatus("success");
        setPopupMessage("✅ Event created successfully!");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);

        localStorage.removeItem("organizeFormData");
        navigate(`/events/${eventType}`);
      } else {
        setStatus("failed");
        setPopupMessage(data.error || "Failed to create event");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
      }
    } catch (error) {
      console.error("Error creating event:", error);
      setStatus("error");
      setPopupMessage(error.response?.data?.error || "Something went wrong. Try again.");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate("/events");
  const handleLogout = () => {
    removeToken();
    navigate("/signin");
  };

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case "failed":
      case "error":
        return <XCircle className="w-5 h-5 text-rose-600" />;
      default:
        return null;
    }
  };

  if (!canOrganize) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        <Navbar onLogout={handleLogout} />
        <div className="max-w-xl mx-auto px-4 py-16">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Not authorized</h2>
              <p className="text-sm text-slate-500">Only NGOs and Health Workers can organize events.</p>
            </div>
            <button onClick={handleBack} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition">
              <ArrowLeft className="w-4 h-4" /> Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
      <Navbar onLogout={handleLogout} />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Navigation Action Header */}
        <div className="space-y-4">
          <button onClick={handleBack} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </button>

          <div className="flex items-center gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl shrink-0">{eventIcons[eventType]}</div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Organize {eventTypeName}</h1>
          </div>

          {/* Blood Donation Warning Callout */}
          {isBloodDonation && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex gap-3 text-rose-950">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold">Important Clinical Compliance Notice</h3>
                <p className="text-xs text-rose-800 leading-relaxed">
                  Participants will receive automated cryptographic rewards upon decentralized screening token verification. Please ensure standard legal medical infrastructure, sterile collection logistics, and licensed donor screening personnel are active on-site.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Configuration Processing Form */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6">Event Management Specifications</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Custom Event Name for "Other" configuration indices */}
            {isOtherEvent && (
              <div className="space-y-1.5">
                <label htmlFor="customEventName" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Custom Event Name *
                </label>
                <input
                  type="text"
                  id="customEventName"
                  name="customEventName"
                  value={formData.customEventName}
                  onChange={handleInputChange}
                  placeholder="Enter customized scheduling baseline name"
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm transition focus:outline-none focus:bg-white focus:ring-2 ${errors.customEventName ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-sky-100 focus:border-sky-500"}`}
                />
                {errors.customEventName && <p className="text-xs font-medium text-rose-600">{errors.customEventName}</p>}
              </div>
            )}

            {/* Timeline Matrix Parameter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label htmlFor="date" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Operational Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm transition focus:outline-none focus:bg-white focus:ring-2 ${errors.date ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-sky-100 focus:border-sky-500"}`}
                />
                {errors.date && <p className="text-xs font-medium text-rose-600">{errors.date}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="startTime" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Start Time *
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm transition focus:outline-none focus:bg-white focus:ring-2 ${errors.startTime ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-sky-100 focus:border-sky-500"}`}
                />
                {errors.startTime && <p className="text-xs font-medium text-rose-600">{errors.startTime}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="endTime" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> End Time *
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm transition focus:outline-none focus:bg-white focus:ring-2 ${errors.endTime ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-sky-100 focus:border-sky-500"}`}
                />
                {errors.endTime && <p className="text-xs font-medium text-rose-600">{errors.endTime}</p>}
              </div>
            </div>

            {/* Location Reference Fields */}
            <div className="space-y-1.5">
              <label htmlFor="location" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Location Physical Address *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Enter verified physical structural location descriptor"
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm transition focus:outline-none focus:bg-white focus:ring-2 ${errors.location ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-sky-100 focus:border-sky-500"}`}
              />
              {errors.location && <p className="text-xs font-medium text-rose-600">{errors.location}</p>}
            </div>

            {/* Geographical Navigation Mapping System Anchor */}
            <div className="space-y-1.5">
              <label htmlFor="locationURL" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
                <Link className="w-3.5 h-3.5 text-slate-400" /> Mapping API / Navigation Coordinates URL *
              </label>
              <input
                type="url"
                id="locationURL"
                name="locationURL"
                value={formData.locationURL}
                onChange={handleInputChange}
                placeholder="https://maps.google.com/..."
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm transition focus:outline-none focus:bg-white focus:ring-2 ${errors.locationURL ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-sky-100 focus:border-sky-500"}`}
              />
              {errors.locationURL && <p className="text-xs font-medium text-rose-600">{errors.locationURL}</p>}
            </div>

            {/* Micro-Donations Protocol Registry Toggle */}
            <div className="pt-2">
              <label className="relative flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer select-none hover:bg-slate-100/70 transition">
                <input type="checkbox" id="donationNeeded" name="donationNeeded" checked={formData.donationNeeded} onChange={handleInputChange} className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-slate-500" /> Accept Public Operational Micro-Donations
                  </span>
                  <p className="text-xs text-slate-500">Enables a peer-to-peer decentralized crowdsourcing interface within the consumer event profile index.</p>
                </div>
              </label>
            </div>

            {/* Financial Ledger Router Profile Anchor - UPI Target */}
            {formData.donationNeeded && (
              <div className="space-y-1.5 bg-slate-50/50 p-4 border border-slate-200 border-dashed rounded-xl space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <label htmlFor="upiId" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Target Network UPI Address *
                  </label>
                  <input
                    type="text"
                    id="upiId"
                    name="upiId"
                    value={formData.upiId}
                    onChange={handleInputChange}
                    placeholder="merchant-identifier@pspnetwork"
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm transition focus:outline-none focus:ring-2 ${errors.upiId ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-sky-100 focus:border-sky-500"}`}
                  />
                  {errors.upiId && <p className="text-xs font-medium text-rose-600">{errors.upiId}</p>}
                </div>
              </div>
            )}

            {/* Commit Request Dispatch Row */}
            <div className="pt-4 border-t border-slate-100">
              <button type="submit" disabled={loading} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Deploying Logistical Block...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Create Event Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Localized Event Pipeline Diagnostic Metrics */}
        {status && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-3.5 shadow-sm">
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl shrink-0">{getStatusIcon()}</div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">System Transaction Log</h3>
              <p className={`text-xs font-medium ${status === "success" ? "text-emerald-700" : "text-rose-700"}`}>{popupMessage}</p>
            </div>
          </div>
        )}

        {/* Global Level System Popups / Native Floating Notifications */}
        {showPopup && <div className={`fixed top-5 right-5 text-white px-5 py-3 rounded-xl shadow-lg z-[9999] text-sm font-semibold max-w-xs transition transform translate-y-0 animate-bounce ${status === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>{popupMessage}</div>}
      </div>
    </div>
  );
};

export default OrganizeEventForm;
