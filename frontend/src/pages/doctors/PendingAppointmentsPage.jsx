import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api.js";
import Navbar from "../../components/Navbar.jsx";
import { CalendarClock, ArrowLeft, X, Sparkles, AlertCircle, Loader2, Mail, Phone, MessageSquare, FileText, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function PendingAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [acceptForm, setAcceptForm] = useState({
    appointmentId: "",
    scheduledTime: "",
    notes: "",
  });
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }
    fetchDoctorProfile();
  }, [navigate]);

  useEffect(() => {
    if (currentUser) {
      fetchAppointments();
    }
  }, [currentUser]);

  const fetchDoctorProfile = async () => {
    try {
      const res = await api.get("/doctor/profile");
      setCurrentUser(res?.data?.data || null);
    } catch (err) {
      console.error("Error fetching doctor profile:", err);
      setError("Access denied. Only doctors can view this page.");
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      if (!currentUser?._id) {
        setError("Access denied. Only doctors can view this page.");
        return;
      }
      const doctorId = currentUser._id;
      const response = await api.get(`/appointment/get-doctor-appointment?doctorId=${doctorId}&status=pending`);
      const data = response?.data?.data || [];
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError("Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  const handleAcceptAppointment = (appointment) => {
    setAcceptForm({
      appointmentId: appointment._id,
      scheduledTime: appointment.requestedTime ? new Date(appointment.requestedTime).toISOString().slice(0, 16) : "",
      notes: "",
    });
    setShowAcceptModal(true);
  };

  const handleAcceptSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.patch("/appointment/accept", acceptForm);

      if (response.data.success) {
        alert("Appointment accepted successfully!");
        setShowAcceptModal(false);
        await fetchAppointments();
      }
    } catch (err) {
      console.error("Error accepting appointment:", err);
      alert(err.response?.data?.message || "Failed to accept appointment");
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        const response = await api.patch(`/appointment/cancel`, {
          appointmentId,
        });

        if (response.data.success) {
          alert("Appointment cancelled successfully!");
          await fetchAppointments();
        }
      } catch (err) {
        console.error("Error cancelling appointment:", err);
        alert(err.response?.data?.message || "Failed to cancel appointment");
      }
    }
  };

  const closeModal = () => {
    setShowAcceptModal(false);
  };

  // Reusable Component Header
  const PageHeader = () => (
    <div className="relative overflow-hidden bg-white rounded-3xl border border-[#E8F5F0] p-6 md:p-8 shadow-sm mb-6">
      <div className="absolute top-0 right-0 w-[240px] h-[240px] bg-gradient-to-bl from-[#4CAF82]/5 to-transparent rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#2D7A5F]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#2D7A5F]">
            <CalendarClock size={12} />
            Incoming Requests
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1A3C34] sm:text-3xl">Pending Appointments</h1>
          <p className="text-xs sm:text-sm font-medium text-[#4A7A6A] max-w-xl">Review triage priorities, evaluate custom timetables, and coordinate secure communications before committing slots to the registry.</p>
        </div>
        <button
          className="self-start md:self-center inline-flex items-center gap-2 rounded-xl border border-[#C8E6D8] bg-white px-4 py-2 text-xs font-extrabold text-[#4A7A6A] transition-all duration-200 hover:border-[#2D7A5F] hover:text-[#2D7A5F] hover:bg-[#2D7A5F]/5 active:scale-95 shadow-sm"
          onClick={() => navigate("/doctors")}>
          <ArrowLeft size={14} />
          Back to Doctors
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#F0F7F4] text-[#1A3C34] font-sans antialiased">
        <Navbar onLogout={handleLogout} />
        <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <PageHeader />
          <div className="bg-white rounded-3xl border border-[#E8F5F0] p-16 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-10 h-10 text-[#2D7A5F] animate-spin" />
            <p className="text-sm font-bold text-[#4A7A6A]">Retrieving secure clinical triage vectors...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-[#F0F7F4] text-[#1A3C34] font-sans antialiased">
        <Navbar onLogout={handleLogout} />
        <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <PageHeader />
          <div className="bg-white rounded-3xl border border-[#E8F5F0] p-12 text-center max-w-xl mx-auto space-y-6 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-red-700 font-bold bg-red-50 border border-red-100 p-4 rounded-xl text-sm">
              <AlertCircle size={16} className="flex-shrink-0 text-red-600" />
              {error}
            </div>
            <button className="rounded-xl bg-[#2D7A5F] px-5 py-2.5 text-xs font-black text-white hover:bg-[#245F4A] transition-all shadow-sm active:scale-95" onClick={() => navigate("/doctors")}>
              Return to Doctor Matrix
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F0F7F4] text-[#1A3C34] font-sans antialiased selection:bg-[#2D7A5F]/20">
      <Navbar onLogout={handleLogout} />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <PageHeader />

        <div className="space-y-6">
          {appointments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E8F5F0] p-16 text-center max-w-md mx-auto space-y-4 shadow-sm animate-fadeIn">
              <div className="w-14 h-14 bg-[#F6FFFC] border border-[#C8E6D8] text-[#2D7A5F] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <CalendarClock size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-wide text-[#1A3C34]">No Pending Allocations</h3>
                <p className="text-xs font-medium text-[#4A7A6A] leading-relaxed">Your inbound structural triage queue is empty. No alternative token requests await action parameters.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
              {appointments.map((appointment) => (
                <div key={appointment._id} className="bg-white rounded-2xl border border-[#E8F5F0] p-6 shadow-sm hover:border-[#C8E6D8] hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4 border-b border-[#F0F7F4] pb-3">
                      <div>
                        <h3 className="text-base font-black text-[#1A3C34]">{appointment.patientId?.name || "Patient Name"}</h3>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#4A7A6A]/60 uppercase tracking-wider mt-0.5">
                          <Clock size={11} />
                          Log Root: {new Date(appointment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-800 shadow-sm">Pending</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl border border-[#F0F7F4] bg-[#FDFEFF] space-y-0.5">
                        <span className="text-[10px] font-black text-[#4A7A6A]/60 uppercase tracking-wider block">Target Window</span>
                        <span className="font-bold text-[#1A3C34] break-words">{new Date(appointment.requestedTime).toLocaleString()}</span>
                      </div>

                      <div className="p-2.5 rounded-xl border border-[#F0F7F4] bg-[#FDFEFF] space-y-0.5">
                        <span className="text-[10px] font-black text-[#4A7A6A]/60 uppercase tracking-wider block flex items-center gap-1">
                          <Mail size={10} /> Email Registry
                        </span>
                        <span className="font-semibold text-[#4A7A6A] block truncate" title={appointment.patientId?.email}>
                          {appointment.patientId?.email || "Not provided"}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl border border-[#F0F7F4] bg-[#FDFEFF] space-y-0.5">
                        <span className="text-[10px] font-black text-[#4A7A6A]/60 uppercase tracking-wider block flex items-center gap-1">
                          <Phone size={10} /> Comm Interface
                        </span>
                        <span className="font-bold text-[#1A3C34]">{appointment.patientId?.phone || "Not provided"}</span>
                      </div>

                      <div className="p-2.5 rounded-xl border border-[#F0F7F4] bg-[#FDFEFF] space-y-0.5 sm:col-span-2">
                        <span className="text-[10px] font-black text-[#4A7A6A]/60 uppercase tracking-wider block flex items-center gap-1">
                          <FileText size={10} /> Case Manifest / Statement
                        </span>
                        <p className="font-medium text-[#4A7A6A] leading-relaxed break-words">{appointment.reason || "No written statement compiled by patient."}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#F0F7F4]">
                    <button className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2D7A5F] px-3 py-2.5 text-xs font-black text-white hover:bg-[#245F4A] active:scale-95 transition-all shadow-sm" onClick={() => handleAcceptAppointment(appointment)}>
                      <CheckCircle2 size={13} />
                      Accept Track
                    </button>
                    <button className="rounded-xl border border-[#C8E6D8] bg-white px-3 py-2.5 text-xs font-extrabold text-red-600 hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all" onClick={() => handleCancelAppointment(appointment._id)}>
                      Cancel
                    </button>
                    <button
                      className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#C8E6D8] bg-white px-3 py-2.5 text-xs font-extrabold text-[#2D7A5F] hover:bg-[#F6FFFC] active:scale-95 transition-all"
                      onClick={() => {
                        localStorage.setItem(
                          "currentAppointment",
                          JSON.stringify({
                            appointmentId: appointment._id,
                            doctorId: appointment.doctorId?._id || appointment.doctorId,
                            patientId: appointment.patientId?._id || appointment.patientId,
                            doctorName: appointment.doctorId?.name || "Doctor",
                            patientName: appointment.patientId?.name || "Patient",
                          }),
                        );
                        navigate(`/chat/${appointment._id}`);
                      }}>
                      <MessageSquare size={13} />
                      Chat Node
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Accept Appointment Modal Configuration */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A3C34]/40 backdrop-blur-sm animate-fadeIn" onClick={closeModal}>
          <div className="relative w-full max-w-lg overflow-hidden bg-white rounded-2xl border border-[#E8F5F0] shadow-xl animate-scaleUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#F0F7F4] bg-[#FDFEFF] px-6 py-4">
              <h3 className="text-base font-black text-[#1A3C34] tracking-tight">Authorize Timetable Commitment</h3>
              <button onClick={closeModal} className="rounded-lg p-1.5 text-[#4A7A6A] hover:bg-[#F0F7F4] hover:text-[#1A3C34] transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleAcceptSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="scheduledTime" className="text-xs font-black text-[#1A3C34] uppercase tracking-wide">
                    Confirmed Appointment Registry Time
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduledTime"
                    value={acceptForm.scheduledTime}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={(e) =>
                      setAcceptForm({
                        ...acceptForm,
                        scheduledTime: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-[#C8E6D8] bg-white px-4 py-2.5 text-xs font-semibold text-[#1A3C34] focus:border-[#2D7A5F] focus:outline-none focus:ring-4 focus:ring-[#2D7A5F]/5"
                  />
                  <small className="text-[10px] font-bold text-[#4A7A6A]">Leave transparent to reference client's requested entry criteria automatically.</small>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="notes" className="text-xs font-black text-[#1A3C34] uppercase tracking-wide">
                    Append Clinical Directives
                  </label>
                  <textarea
                    id="notes"
                    value={acceptForm.notes}
                    placeholder="Provide diagnostic advice, entry conditions, or coordination remarks for the patient dashboard..."
                    rows="3"
                    onChange={(e) => setAcceptForm({ ...acceptForm, notes: e.target.value })}
                    className="w-full rounded-xl border border-[#C8E6D8] bg-white px-4 py-2.5 text-xs font-semibold text-[#1A3C34] focus:border-[#2D7A5F] focus:outline-none focus:ring-4 focus:ring-[#2D7A5F]/5 placeholder:text-[#4A7A6A]/40"
                  />
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-[#F0F7F4]">
                  <button type="submit" className="flex-1 rounded-xl bg-[#2D7A5F] px-4 py-2.5 text-xs font-black text-white hover:bg-[#245F4A] active:scale-95 transition-all shadow-sm">
                    Commit Track Allocation
                  </button>
                  <button type="button" className="flex-1 rounded-xl border border-[#C8E6D8] bg-white px-4 py-2.5 text-xs font-extrabold text-[#4A7A6A] hover:bg-[#F6FFFC] active:scale-95 transition-all" onClick={closeModal}>
                    Abort Verification
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
