import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api.js";
import Navbar from "../../components/Navbar.jsx";
import { Stethoscope, Calendar, User, X, Sparkles, AlertCircle, Loader2, Building2, DollarSign, Briefcase, Layers, HeartPulse } from "lucide-react";

// Premium Refactored Modal System
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A3C34]/40 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
    <div className="relative w-full max-w-lg overflow-hidden bg-white rounded-2xl border border-[#E8F5F0] shadow-xl animate-scaleUp" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-[#F0F7F4] bg-[#FDFEFF] px-6 py-4">
        <h3 className="text-base font-black text-[#1A3C34] tracking-tight">{title}</h3>
        <button onClick={onClose} className="rounded-lg p-1.5 text-[#4A7A6A] hover:bg-[#F0F7F4] hover:text-[#1A3C34] transition-all">
          <X size={16} />
        </button>
      </div>
      <div className="p-6 overflow-y-auto max-h-[calc(100vh-12rem)]">{children}</div>
    </div>
  </div>
);

const DoctorName = ({ doctor }) => (doctor.user ? `${doctor.user.firstName} ${doctor.user.lastName}` : doctor.name || "Dr. Name");

export default function DoctorsPage() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myProfile, setMyProfile] = useState(null);
  const [selfDoctorProfile, setSelfDoctorProfile] = useState(null);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null); // "profile" | "book" | "accept"
  const [appointments, setAppointments] = useState([]);
  const [apptFilter, setApptFilter] = useState("pending");
  const [bookingForm, setBookingForm] = useState({ requestedTime: "", reason: "" });
  const [acceptForm, setAcceptForm] = useState({ appointmentId: "", scheduledTime: "", notes: "" });
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/signin");
      return;
    }
    api
      .get("/doctor/profile")
      .then((r) => setSelfDoctorProfile(r.data.data))
      .catch(() => {});
    api
      .get("/patient/profile")
      .then((r) => setMyProfile(r.data.profile))
      .catch(() =>
        api
          .get("/profile/me")
          .then((r) => setMyProfile(r.data?.data?.profile))
          .catch(() => {}),
      );
    api
      .get("/doctors")
      .then((r) => {
        const p = r.data;
        setDoctors(Array.isArray(p) ? p : p?.data?.items || p?.data || p?.doctors || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  const isOwn = (doc) => selfDoctorProfile && (String(selfDoctorProfile._id) === String(doc._id) || String(selfDoctorProfile.user?._id || selfDoctorProfile.user) === String(doc.user?._id || doc.user));

  const fetchAppts = async (doctorId, status = apptFilter) => {
    const r = await api.get(`/appointment/get-doctor-appointment?doctorId=${doctorId}&status=${status}`);
    setAppointments(r.data.data || []);
  };

  const openModal = (type, doctor) => {
    setSelected(doctor);
    setModal(type);
  };
  const closeModal = () => {
    setSelected(null);
    setModal(null);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!myProfile?._id) return alert("Complete your patient profile first.");
    setIsBooking(true);
    try {
      await api.post("/appointment/book", {
        doctorId: selected._id,
        patientId: myProfile._id,
        requestedTime: bookingForm.requestedTime,
        reason: bookingForm.reason,
      });
      closeModal();
      setBookingForm({ requestedTime: "", reason: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Booking failed. Try a different time.");
    } finally {
      setIsBooking(false);
    }
  };

  const handleAccept = async (e) => {
    e.preventDefault();
    try {
      await api.patch("/appointment/accept", acceptForm);
      closeModal();
      fetchAppts(selected._id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept");
    }
  };

  const handleCancel = async (id) => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await api.patch("/appointment/cancel", { appointmentId: id });
      fetchAppts(selected._id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel");
    }
  };

  const myDoctor = selfDoctorProfile || doctors.find(isOwn);
  const otherDoctors = doctors.filter((d) => !isOwn(d));

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  // Reusable Page Header Layout
  const PageHeader = () => (
    <div className="relative overflow-hidden bg-white rounded-3xl border border-[#E8F5F0] p-6 md:p-8 shadow-sm mb-6">
      <div className="absolute top-0 right-0 w-[240px] h-[240px] bg-gradient-to-bl from-[#4CAF82]/5 to-transparent rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#2D7A5F]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#2D7A5F]">
            <Sparkles size={12} />
            Registry Directory
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1A3C34] sm:text-3xl">Doctors</h1>
          <p className="text-xs sm:text-sm font-medium text-[#4A7A6A] max-w-xl">Find and connect with healthcare practitioners, verify licensing parameters, and securely log dynamic wellness schedules.</p>
        </div>
        {!selfDoctorProfile && (
          <button
            className="self-start md:self-center inline-flex items-center gap-2 rounded-xl border-2 border-[#C8E6D8] bg-white px-4 py-2 text-xs font-extrabold text-[#2D7A5F] transition-all duration-200 hover:border-[#2D7A5F] hover:bg-[#2D7A5F]/5 active:scale-95 shadow-sm"
            onClick={() => navigate("/my-appointments")}>
            <Calendar size={14} />
            My Appointments
          </button>
        )}
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
            <p className="text-sm font-bold text-[#4A7A6A]">Retrieving secure clinical identity indexes...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F0F7F4] text-[#1A3C34] font-sans antialiased selection:bg-[#2D7A5F]/20 selection:text-[#1A3C34]">
      <Navbar onLogout={handleLogout} />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <PageHeader />

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 p-4 text-red-800 animate-fadeIn shadow-sm">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-red-600" />
            <div className="text-xs sm:text-sm font-semibold">{error}</div>
          </div>
        )}

        <div className="space-y-8">
          {/* Own Doctor Profile Node Block */}
          {myDoctor && (
            <div className="space-y-3 animate-fadeIn">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#4A7A6A]">Your Profile Struct</h2>
              <div className="bg-white rounded-2xl border-2 border-[#C8E6D8] p-6 shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-[#2D7A5F] text-white text-[10px] font-black uppercase tracking-widest rounded-bl-xl">Node Anchor</div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#2D7A5F]/10 border border-[#2D7A5F]/20 text-[#2D7A5F] rounded-xl flex items-center justify-center shadow-sm">
                    <Stethoscope size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1A3C34]">
                      <DoctorName doctor={myDoctor} /> <span className="text-[#4A7A6A] font-medium">(You)</span>
                    </h3>
                    <p className="text-[11px] font-bold text-[#4A7A6A]">{myDoctor.specialisation || myDoctor.specialization || "General Medicine"}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-[#4A7A6A] border-t border-b border-[#F0F7F4] py-3">
                  {myDoctor.fee && (
                    <span className="flex items-center gap-1">
                      <DollarSign size={14} className="text-[#2D7A5F]" />
                      Consultation Base: <strong className="text-[#1A3C34]">₹{myDoctor.fee}</strong>
                    </span>
                  )}
                  {myDoctor.licenseNumber && (
                    <span className="flex items-center gap-1">
                      <Layers size={14} className="text-[#2D7A5F]" />
                      Registry Reference: <strong className="text-[#1A3C34]">{myDoctor.licenseNumber}</strong>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button className="rounded-xl bg-[#2D7A5F] px-4 py-2.5 text-xs font-black text-white hover:bg-[#245F4A] active:scale-95 transition-all shadow-sm" onClick={() => navigate("/pending-appointments")}>
                    Pending Queue
                  </button>
                  <button className="rounded-xl border border-[#C8E6D8] bg-white px-4 py-2.5 text-xs font-extrabold text-[#4A7A6A] hover:bg-[#F6FFFC] hover:text-[#2D7A5F] active:scale-95 transition-all" onClick={() => navigate("/scheduled-appointments")}>
                    Scheduled Nodes
                  </button>
                  <button className="rounded-xl border border-[#C8E6D8] bg-white px-4 py-2.5 text-xs font-extrabold text-[#4A7A6A] hover:bg-[#F6FFFC] hover:text-[#2D7A5F] active:scale-95 transition-all" onClick={() => openModal("profile", myDoctor)}>
                    Full Metadata
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Peer Node Grids */}
          <div className="space-y-3">
            {myDoctor && <h2 className="text-xs font-black uppercase tracking-wider text-[#4A7A6A]">Peer Practitioners</h2>}

            {otherDoctors.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E8F5F0] p-12 text-center max-w-md mx-auto space-y-3 shadow-sm">
                <div className="w-12 h-12 bg-[#F6FFFC] border border-[#C8E6D8] text-[#2D7A5F] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <HeartPulse size={22} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wide text-[#1A3C34]">No Alternate Records</h3>
                  <p className="text-xs font-medium text-[#4A7A6A] leading-relaxed">There are no alternative clinical provider matrices cataloged within this ecosystem branch currently.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                {otherDoctors.map((doc, i) => (
                  <div key={doc._id || i} className="group bg-white rounded-2xl border border-[#E8F5F0] p-5 shadow-sm hover:border-[#C8E6D8] hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#F6FFFC] border border-[#C8E6D8] text-[#2D7A5F] rounded-xl flex items-center justify-center shadow-sm group-hover:bg-[#2D7A5F] group-hover:text-white transition-all">
                          <User size={16} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-[#1A3C34]">
                            <DoctorName doctor={doc} />
                          </h3>
                          <p className="text-[11px] font-bold text-[#2D7A5F]">{doc.specialisation || doc.specialization || "General Medicine"}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 border-t border-[#F0F7F4] pt-3 text-xs font-medium text-[#4A7A6A]">
                        {doc.affiliation && (
                          <div className="flex items-center gap-1.5">
                            <Building2 size={13} className="text-[#4A7A6A]/60 flex-shrink-0" />
                            <span className="line-clamp-1">
                              Affiliation: <strong className="text-[#1A3C34]">{doc.affiliation}</strong>
                            </span>
                          </div>
                        )}
                        {doc.fee && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign size={13} className="text-[#4A7A6A]/60 flex-shrink-0" />
                            <span>
                              Consultation: <strong className="text-[#1A3C34]">₹{doc.fee}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#F0F7F4]">
                      {!selfDoctorProfile && (
                        <button className="flex-1 rounded-xl bg-[#2D7A5F] px-3 py-2 text-[11px] font-black text-white hover:bg-[#245F4A] active:scale-95 transition-all shadow-sm" onClick={() => openModal("book", doc)}>
                          Book Slot
                        </button>
                      )}
                      <button className="flex-1 rounded-xl border border-[#C8E6D8] bg-white px-3 py-2 text-[11px] font-extrabold text-[#4A7A6A] hover:bg-[#F6FFFC] hover:text-[#2D7A5F] active:scale-95 transition-all" onClick={() => openModal("profile", doc)}>
                        View Info
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL SYSTEM INTERFACES */}

      {/* 1. Profile Modal */}
      {modal === "profile" && selected && (
        <Modal title="Clinical Identity Card" onClose={closeModal}>
          <div className="flex items-center gap-4 border-b border-[#F0F7F4] pb-4 mb-4">
            <div className="w-14 h-14 bg-[#F6FFFC] border border-[#C8E6D8] text-[#2D7A5F] rounded-2xl flex items-center justify-center text-2xl shadow-sm">👨‍⚕️</div>
            <div>
              <h2 className="text-base font-black text-[#1A3C34]">
                <DoctorName doctor={selected} />
              </h2>
              <p className="text-xs font-bold text-[#2D7A5F]">{selected.specialisation || selected.specialization}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              ["License Signature", selected.licenseNumber, <Layers size={13} />],
              ["Institution Affiliation", selected.affiliation, <Building2 size={13} />],
              ["Gender Vector", selected.gender, <User size={13} />],
              ["Valuation Fee", selected.fee ? `₹${selected.fee}` : null, <DollarSign size={13} />],
              ["Experience Matrix", selected.experience, <Briefcase size={13} />],
              ["Abstract Overview", selected.about, <HeartPulse size={13} />],
            ]
              .filter(([, v]) => v)
              .map(([label, val, icon]) => (
                <div key={label} className="p-3 rounded-xl border border-[#E8F5F0] bg-[#FDFEFF]">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-[#4A7A6A]/60 uppercase tracking-wider mb-0.5">
                    {icon}
                    {label}
                  </div>
                  <div className="text-xs font-bold text-[#1A3C34] leading-relaxed break-words">{val}</div>
                </div>
              ))}
          </div>

          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#F0F7F4]">
            {!isOwn(selected) && !selfDoctorProfile && (
              <button
                className="flex-1 rounded-xl bg-[#2D7A5F] px-4 py-2.5 text-xs font-black text-white hover:bg-[#245F4A] active:scale-95 transition-all shadow-sm"
                onClick={() => {
                  closeModal();
                  openModal("book", selected);
                }}>
                Book Structural Visit
              </button>
            )}
            <button className="flex-1 rounded-xl border border-[#C8E6D8] bg-white px-4 py-2.5 text-xs font-extrabold text-[#4A7A6A] hover:bg-[#F6FFFC] active:scale-95 transition-all" onClick={closeModal}>
              Exit Matrix
            </button>
          </div>
        </Modal>
      )}

      {/* 2. Book Appointment Modal */}
      {modal === "book" && selected && (
        <Modal title={`Initialize Appointment: Dr. ${selected.user?.firstName || selected.name}`} onClose={closeModal}>
          <form onSubmit={handleBook} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-[#1A3C34] uppercase tracking-wide">Preferred Time Registry</label>
              <input
                type="datetime-local"
                value={bookingForm.requestedTime}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => setBookingForm((p) => ({ ...p, requestedTime: e.target.value }))}
                className="w-full rounded-xl border border-[#C8E6D8] bg-white px-4 py-2.5 text-xs font-semibold text-[#1A3C34] focus:border-[#2D7A5F] focus:outline-none focus:ring-4 focus:ring-[#2D7A5F]/5"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-[#1A3C34] uppercase tracking-wide">Symptom Statement & Concern</label>
              <textarea
                rows="3"
                value={bookingForm.reason}
                placeholder="Detail physiological anomalies or operational objectives..."
                onChange={(e) => setBookingForm((p) => ({ ...p, reason: e.target.value }))}
                className="w-full rounded-xl border border-[#C8E6D8] bg-white px-4 py-2.5 text-xs font-semibold text-[#1A3C34] focus:border-[#2D7A5F] focus:outline-none focus:ring-4 focus:ring-[#2D7A5F]/5 placeholder:text-[#4A7A6A]/40"
              />
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-[#F0F7F4]">
              <button type="submit" className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2D7A5F] px-4 py-2.5 text-xs font-black text-white hover:bg-[#245F4A] active:scale-95 transition-all shadow-sm" disabled={isBooking}>
                {isBooking && <Loader2 size={12} className="animate-spin" />}
                {isBooking ? "Encrypting Request..." : "Commit Calendar Token"}
              </button>
              <button type="button" className="flex-1 rounded-xl border border-[#C8E6D8] bg-white px-4 py-2.5 text-xs font-extrabold text-[#4A7A6A] hover:bg-[#F6FFFC] active:scale-95 transition-all" onClick={closeModal}>
                Abort
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. Accept Appointment Modal */}
      {modal === "accept" && (
        <Modal title="Authorize Slot Reservation" onClose={closeModal}>
          <form onSubmit={handleAccept} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-[#1A3C34] uppercase tracking-wide">Adjusted Timetable Slot</label>
              <input
                type="datetime-local"
                value={acceptForm.scheduledTime}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => setAcceptForm((p) => ({ ...p, scheduledTime: e.target.value }))}
                className="w-full rounded-xl border border-[#C8E6D8] bg-white px-4 py-2.5 text-xs font-semibold text-[#1A3C34] focus:border-[#2D7A5F] focus:outline-none focus:ring-4 focus:ring-[#2D7A5F]/5"
              />
              <small className="text-[10px] font-bold text-[#4A7A6A]">Default references target configuration parameters directly if cleared.</small>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-[#1A3C34] uppercase tracking-wide">Practitioner Clinical Notes</label>
              <textarea
                rows="3"
                value={acceptForm.notes}
                placeholder="Append procedural directives or tracking requirements..."
                onChange={(e) => setAcceptForm((p) => ({ ...p, notes: e.target.value }))}
                className="w-full rounded-xl border border-[#C8E6D8] bg-white px-4 py-2.5 text-xs font-semibold text-[#1A3C34] focus:border-[#2D7A5F] focus:outline-none focus:ring-4 focus:ring-[#2D7A5F]/5 placeholder:text-[#4A7A6A]/40"
              />
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-[#F0F7F4]">
              <button type="submit" className="flex-1 rounded-xl bg-[#2D7A5F] px-4 py-2.5 text-xs font-black text-white hover:bg-[#245F4A] active:scale-95 transition-all shadow-sm">
                Confirm Allocation
              </button>
              <button type="button" className="flex-1 rounded-xl border border-[#C8E6D8] bg-white px-4 py-2.5 text-xs font-extrabold text-[#4A7A6A] hover:bg-[#F6FFFC] active:scale-95 transition-all" onClick={closeModal}>
                Discard
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
