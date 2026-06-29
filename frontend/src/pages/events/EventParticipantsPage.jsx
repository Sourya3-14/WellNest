import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Coins
} from "lucide-react";
import Navbar from "../../components/Navbar.jsx";
import { blockchainApi } from "../../utils/api.js";

const EventParticipantsPage = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const location = useLocation();
  const { eventType } = location.state || {};
  
  const userRole = localStorage.getItem("userRole");
  const currentUserId = localStorage.getItem("userId");
  
  const [participants, setParticipants] = useState([]);
  const [eventDetails, setEventDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Fetch all events organized by current user
        const eventResp = await blockchainApi.get("/organise/all");
        if (eventResp.data.success) {
          const evt = (eventResp.data.orgs || []).find(
            (e) => e._id === eventId,
          );
          setEventDetails(evt || null);
        }

        // Fetch participants for the event
        const resp = await blockchainApi.get(`/part/participants/${eventId}`);
        if (resp.data.success) {
          setParticipants(resp.data.participants || []);
        }
      } catch (err) {
        console.error("Error loading participants:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [eventId]);

  const handleVerifyParticipant = async (participantId) => {
    try {
      setVerifying(participantId);
      const resp = await blockchainApi.post(`/part/verify/${participantId}`);
      if (resp.data.success) {
        setParticipants((prev) =>
          prev.map((p) =>
            p._id === participantId ? { ...p, verified: true } : p,
          ),
        );
      } else {
        alert(resp.data.error || "Verification failed");
      }
    } catch (err) {
      console.error("Verify error:", err);
    } finally {
      setVerifying(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  const canVerify =
    ["ngo", "health_worker"].includes(userRole || "") &&
    eventDetails &&
    eventDetails.shortId === currentUserId;

  // Render Time Cleanly Helper
  const renderFormattedTime = (timeString) => {
    if (!timeString) return "";
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans flex flex-col">
        <Navbar onLogout={handleLogout} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading ledger data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
      <Navbar onLogout={handleLogout} />
      
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Navigation Action Header */}
        <div className="space-y-4">
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </button>

          {/* Event Metadata Hero Header Box */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
                Administrative Control Panel
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
                Event Verification Dashboard
              </h1>
            </div>

            {eventDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Organizer</span>
                  <p className="text-sm font-semibold text-slate-800 truncate">{eventDetails.name}</p>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" /> Date
                  </span>
                  <p className="text-sm font-semibold text-slate-800">
                    {new Date(eventDetails.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> Time Window
                  </span>
                  <p className="text-sm font-semibold text-slate-800 text-xs">
                    {renderFormattedTime(eventDetails.startTime)} - {renderFormattedTime(eventDetails.endTime)}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> Location Target
                  </span>
                  <p className="text-sm font-semibold text-slate-800 truncate">{eventDetails.location}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Crypto-incentives Notification Banner Block */}
        {eventType === "blood-donation" && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex gap-3 text-emerald-950">
            <Coins className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold">Automated Blood Donation Rewards Active</h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Verified medical event configuration active. Checked-in and processed donors will receive authorized, cryptographic network token drops systematically directly following successful manual node operator verification.
              </p>
            </div>
          </div>
        )}

        {/* Participants Registry Data Structure Block */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Registered Roster Pool ({participants.length})
            </h2>
          </div>

          {participants.length === 0 ? (
            <div className="p-12 text-center max-w-sm mx-auto space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800">No registrants found</p>
                <p className="text-xs text-slate-400 leading-relaxed">No users have initiated cryptographic registration requests for this targeted administrative block tracking window.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Participant Profile Name</th>
                    <th className="px-6 py-3.5">Registration Stamp</th>
                    <th className="px-6 py-3.5">Verification Node Status</th>
                    {canVerify && <th className="px-6 py-3.5 text-right">System Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {participants.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition duration-150">
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-slate-100 text-slate-600 rounded-md flex items-center justify-center text-[11px] font-bold uppercase">
                            {(p.userId?.firstName?.[0] || "") + (p.userId?.lastName?.[0] || "") || "U"}
                          </div>
                          <span>
                            {`${p.userId?.firstName || ""} ${p.userId?.lastName || ""}`.trim() || "Anonymous Participant"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(p.registeredAt).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short"
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {p.verified ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100">
                            <AlertCircle className="w-3.5 h-3.5" /> Pending Signature
                          </span>
                        )}
                      </td>
                      {canVerify && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleVerifyParticipant(p._id)}
                            disabled={verifying === p._id || p.verified}
                            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold tracking-wide transition shadow-sm ${
                              p.verified
                                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                                : "bg-slate-900 hover:bg-slate-800 text-white border border-transparent disabled:opacity-50"
                            }`}
                          >
                            {verifying === p._id ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Signing...</span>
                              </>
                            ) : p.verified ? (
                              <span>Cleared</span>
                            ) : (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Verify Attendance</span>
                              </>
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventParticipantsPage;