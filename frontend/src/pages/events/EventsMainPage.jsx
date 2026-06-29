import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Heart, Droplets, Plus, Truck, Apple, Users, Award, TrendingUp } from "lucide-react";
import Navbar from "../../components/Navbar.jsx";
import { blockchainApi } from "../../utils/api.js";

const EventsMainPage = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("patient");
  const [userId, setUserId] = useState("");
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalParticipants: 0,
    upcomingEvents: 0,
  });

  const eventTypes = [
    {
      id: "health-checkup",
      name: "Free Health CheckUp",
      icon: <Heart className="w-5 h-5 text-sky-600" />,
      bgClass: "hover:border-sky-300 hover:bg-sky-50/30",
      iconBg: "bg-sky-50 text-sky-600 border-sky-100",
      description: "Comprehensive health screening and checkup services",
    },
    {
      id: "vaccination",
      name: "Vaccination Drive",
      icon: <Plus className="w-5 h-5 text-emerald-600" />,
      bgClass: "hover:border-emerald-300 hover:bg-emerald-50/30",
      iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
      description: "Immunization programs for various diseases",
    },
    {
      id: "blood-donation",
      name: "Blood Donation Camp",
      icon: <Droplets className="w-5 h-5 text-rose-600" />,
      bgClass: "hover:border-rose-300 hover:bg-rose-50/30",
      iconBg: "bg-rose-50 text-rose-600 border-rose-100",
      description: "Blood donation drives with crypto rewards",
      hasRewards: true,
    },
    {
      id: "mobile-health",
      name: "Mobile Health Camp",
      icon: <Truck className="w-5 h-5 text-indigo-600" />,
      bgClass: "hover:border-indigo-300 hover:bg-indigo-50/30",
      iconBg: "bg-indigo-50 text-indigo-600 border-indigo-100",
      description: "Healthcare services in remote and underserved areas",
    },
    {
      id: "nutrition",
      name: "Nutrition & Diet Camps",
      icon: <Apple className="w-5 h-5 text-amber-600" />,
      bgClass: "hover:border-amber-300 hover:bg-amber-50/30",
      iconBg: "bg-amber-50 text-amber-600 border-amber-100",
      description: "Nutritional counseling and dietary guidance",
    },
    {
      id: "other",
      name: "Other Events",
      icon: <Calendar className="w-5 h-5 text-slate-500" />,
      bgClass: "hover:border-slate-400 hover:bg-slate-50/50",
      iconBg: "bg-slate-100 text-slate-600 border-slate-200",
      description: "Miscellaneous healthcare events and programs",
    },
  ];

  const canOrganize = ["ngo", "health_worker"].includes(userRole);

  useEffect(() => {
    fetchUserData();
    fetchStats();
  }, []);

  const fetchUserData = () => {
    const role = localStorage.getItem("userRole") || "patient";
    const id = localStorage.getItem("userId") || "";
    setUserRole(role);
    setUserId(id);
  };

  const fetchStats = async () => {
    try {
      const response = await blockchainApi.get("/organise/all", {
        headers: {
          Authorization: undefined,
        },
      });

      const data = response.data;

      if (data.success && data.orgs) {
        const events = data.orgs;
        const now = new Date();

        const upcoming = events.filter((event) => {
          const eventDate = new Date(event.date);
          return eventDate > now;
        }).length;

        let totalParticipants = 0;

        try {
          const participantPromises = events.map(async (event) => {
            try {
              const participantResponse = await blockchainApi.get(`/part/participants/${event._id}`);
              if (participantResponse.data.success && participantResponse.data.participants) {
                return participantResponse.data.participants.length;
              }
              return 0;
            } catch (error) {
              return 0;
            }
          });

          const participantCounts = await Promise.allSettled(participantPromises);

          totalParticipants = participantCounts.reduce((sum, result) => {
            if (result.status === "fulfilled") {
              return sum + result.value;
            }
            return sum;
          }, 0);
        } catch (participantError) {
          totalParticipants = events.length * 2;
        }

        setStats({
          totalEvents: events.length,
          totalParticipants,
          upcomingEvents: upcoming,
        });
      } else {
        setStats({ totalEvents: 0, totalParticipants: 0, upcomingEvents: 0 });
      }
    } catch (error) {
      setStats({ totalEvents: 0, totalParticipants: 0, upcomingEvents: 0 });
    }
  };

  const handleEventSelect = (eventType, eventName) => {
    navigate(`/events/${eventType}`, {
      state: { eventTypeName: eventName, userRole, userId },
    });
  };

  const handleOrganizeEvent = (eventType, eventName) => {
    navigate(`/events/organize/${eventType}`, {
      state: { eventTypeName: eventName },
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar onLogout={handleLogout} />

      {/* Top Hero Banner Section */}
      <header className="bg-white border-b border-slate-200 py-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Healthcare Events</h1>
              <p className="text-sm text-slate-500 mt-1">Discover and participate in healthcare events in your community</p>
            </div>
            {canOrganize && (
              <div className="inline-flex items-center gap-1.5 self-start sm:self-center px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold shadow-sm">
                <span>✨ Authorized Organizer Mode</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Core Platform Analytics Dashboard */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center gap-4">
            <div className="p-3 bg-sky-50 text-sky-600 border border-sky-100 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Events</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.totalEvents}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Registrations</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.totalParticipants}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active & Upcoming</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.upcomingEvents}</p>
            </div>
          </div>
        </section>

        {/* Categories Browsing Architecture */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Browse Events by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {eventTypes.map((event) => (
              <div key={event.id} onClick={() => handleEventSelect(event.id, event.name)} className={`bg-white border border-slate-200 p-5 rounded-xl shadow-sm cursor-pointer flex flex-col justify-between transition duration-200 relative group overflow-hidden ${event.bgClass}`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-lg border ${event.iconBg}`}>{event.icon}</div>
                    {event.hasRewards && (
                      <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
                        <Award className="w-4 h-4 animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 tracking-tight group-hover:text-slate-900 transition">{event.name}</h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{event.description}</p>
                  </div>
                </div>

                {event.hasRewards && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-rose-600 tracking-wide uppercase">
                    <span>🪙 Web3 Incentive Tokens Enabled</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Organizer Module Access Point */}
        {canOrganize && (
          <section className="space-y-4 bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-800">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Organize an Event</h2>
              <p className="text-xs text-slate-400 mt-1">Select an active operational index structure below to spin up a community health initiative</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-4">
              {eventTypes.map((event) => (
                <button key={`organize-${event.id}`} onClick={() => handleOrganizeEvent(event.id, event.name)} className="flex items-center justify-between p-3.5 bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-xl transition text-left group">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-slate-700/60 rounded-lg shrink-0 border border-slate-600/50">{event.icon}</span>
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition">Create {event.name}</span>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500 group-hover:text-white transition shrink-0" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Process Flow Architecture Segment */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight border-b border-slate-100 pb-3">Operational Framework</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Participant Journey */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-sky-800 tracking-wider uppercase bg-sky-50 px-2.5 py-1 rounded-md inline-block">For Communities & Patients</h3>
              <ol className="space-y-3">
                {[
                  "Discover decentralized health camps by functional category profiles.",
                  "Lock in real-time drive registrations directly via local profile indices.",
                  "Attend offline verified location coordinates for professional checkups.",
                  "Claim validated crypto tokens instantly upon securing successful blood donation protocols.",
                ].map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
                    <span className="w-5 h-5 flex items-center justify-center bg-sky-100 text-sky-700 rounded-full font-bold text-[10px] shrink-0 mt-0.5">{idx + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Organizer Journey */}
            {canOrganize && (
              <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                <h3 className="text-sm font-bold text-emerald-800 tracking-wider uppercase bg-emerald-50 px-2.5 py-1 rounded-md inline-block">For Accredited Event Organizers</h3>
                <ol className="space-y-3">
                  {[
                    "Deploy specialized operational profiles tailored to clinical categories.",
                    "Configure programmatic timeline limits, tracking constraints, and target geo-locations.",
                    "Monitor ongoing dashboard participant registrations securely.",
                    "Verify manual check-ins on-site to dispatch rewards directly onto blockchain records.",
                  ].map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
                      <span className="w-5 h-5 flex items-center justify-center bg-emerald-100 text-emerald-700 rounded-full font-bold text-[10px] shrink-0 mt-0.5">{idx + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default EventsMainPage;
