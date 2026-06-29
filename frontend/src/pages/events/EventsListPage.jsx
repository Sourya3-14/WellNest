import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Calendar, MapPin, Clock, Users, User, Heart, Droplets, Plus, Truck, Apple, ArrowLeft, DollarSign } from "lucide-react";

import Navbar from "../../components/Navbar.jsx";
import DonationPopup from "../../components/DonationPopup.jsx";
import { blockchainApi } from "../../utils/api.js";

const EventsListPage = () => {
  const navigate = useNavigate();
  const { eventType } = useParams();
  const location = useLocation();
  const { eventTypeName, userRole, userId } = location.state || {};

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [participantsCounts, setParticipantsCounts] = useState({});
  const [donationAmounts, setDonationAmounts] = useState({});
  const [showDonationPopup, setShowDonationPopup] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const currentUserRole = userRole || localStorage.getItem("userRole") || "patient";
  const currentUserId = userId || localStorage.getItem("userId") || "";

  const eventIcons = {
    "health-checkup": <Heart className="w-5 h-5 text-sky-600" />,
    vaccination: <Plus className="w-5 h-5 text-emerald-600" />,
    "blood-donation": <Droplets className="w-5 h-5 text-rose-600" />,
    "mobile-health": <Truck className="w-5 h-5 text-indigo-600" />,
    nutrition: <Apple className="w-5 h-5 text-amber-600" />,
    other: <Calendar className="w-5 h-5 text-slate-500" />,
  };

  const eventTypeNames = {
    "health-checkup": "Free Health CheckUp",
    vaccination: "Vaccination Drive",
    "blood-donation": "Blood Donation Camp",
    "mobile-health": "Mobile Health Camp",
    nutrition: "Nutrition & Diet Camps",
    other: "Other",
  };

  const displayName = eventTypeName || eventTypeNames[eventType] || "Events";

  const getEventDisplayName = (event) => {
    if (event.eventType === "Other" && event.customEventName) {
      return event.customEventName;
    }
    return displayName;
  };

  useEffect(() => {
    fetchEvents();
    loadDonationAmounts();
  }, [eventType]);

  const loadDonationAmounts = () => {
    const savedAmounts = localStorage.getItem("donationAmounts");
    if (savedAmounts) {
      setDonationAmounts(JSON.parse(savedAmounts));
    }
  };

  const saveDonationAmount = (eventId, amount) => {
    const currentAmounts = JSON.parse(localStorage.getItem("donationAmounts") || "{}");
    currentAmounts[eventId] = (currentAmounts[eventId] || 0) + amount;
    localStorage.setItem("donationAmounts", JSON.stringify(currentAmounts));
    setDonationAmounts(currentAmounts);
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data } = await blockchainApi.get("/organise/all");

      if (data.success) {
        let fetched = data.orgs || [];

        if (eventType) {
          fetched = fetched.filter((e) => {
            if (eventType === "health-checkup") return e.eventType === "Free Health CheckUp";
            if (eventType === "vaccination") return e.eventType === "Vaccination Drive";
            if (eventType === "blood-donation") return e.eventType === "Blood Donation Camp";
            if (eventType === "mobile-health") return e.eventType === "Mobile Health Camp";
            if (eventType === "nutrition") return e.eventType === "Nutrition & Diet Camps";
            if (eventType === "other") return e.eventType === "Other";
            return true;
          });
        }

        setEvents(fetched);

        const counts = await Promise.all(
          fetched.map(async (e) => {
            try {
              const { data: d } = await blockchainApi.get(`/part/participants/${e._id}`);
              return [e._id, d.success ? (d.participants || []).length : 0];
            } catch (err) {
              console.error("Error fetching participants for event " + e._id, err);
              return [e._id, 0];
            }
          }),
        );
        setParticipantsCounts(Object.fromEntries(counts));
      } else {
        alert(data.error || "No events found");
      }
    } catch (error) {
      alert("Error fetching events: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = (event) => {
    navigate(`/events/register/${event._id}`, {
      state: {
        eventDetails: {
          eventTypeName: getEventDisplayName(event),
          eventType,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          organizerName: event.name,
          locationURL: event.locationURL,
        },
      },
    });
  };

  const handleViewParticipants = (eventId) => {
    navigate(`/events/participants/${eventId}`, {
      state: { eventType, eventTypeName: displayName },
    });
  };

  const handleDonate = (event) => {
    setSelectedEvent(event);
    setShowDonationPopup(true);
  };

  const handleDonationSubmit = async (amount) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const rewardTokens = Math.floor(amount / 10);

      const response = await blockchainApi.patch("/pay/donate", {
        userId: user._id || user.id,
        amount: amount,
        reward: rewardTokens,
      });

      if (response.data.success) {
        saveDonationAmount(selectedEvent._id, amount);
        alert(`Donation successful! You received ${rewardTokens} reward tokens.`);
      } else {
        throw new Error(response.data.error || "Donation failed");
      }
    } catch (error) {
      console.error("Donation error:", error);
      throw error;
    }
  };

  const handleDelete = async (event) => {
    const eventId = event._id;
    if (!eventId) {
      alert("Invalid event ID. Cannot delete.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      const { data } = await blockchainApi.patch(`/organise/delete/${eventId}`);
      if (data.success) {
        alert("Event deleted successfully!");
        await fetchEvents();
      } else {
        alert(data.error || "Delete failed");
      }
    } catch (err) {
      alert("Delete error: " + (err.response?.data?.error || err.message));
    }
  };

  const handleBack = () => {
    navigate("/events");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    let date;
    if (timeString.includes("T") || timeString.includes("Z")) {
      date = new Date(timeString);
    } else {
      date = new Date(`2000-01-01T${timeString}`);
    }

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
        <Navbar onLogout={handleLogout} />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-500">Retrieving drive indexes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions & Header Block */}
        <div className="mb-8 space-y-4">
          <button onClick={handleBack} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-600 transition bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Events
          </button>

          <div className="border-b border-slate-200 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">{eventIcons[eventType] || <Calendar className="w-5 h-5 text-slate-400" />}</div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{displayName}</h1>
                <p className="text-xs text-slate-500 mt-1">
                  {events.length} {events.length === 1 ? "active drive event" : "active drive events"} running on this route
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Conditional Content Layout */}
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <Calendar className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No Events Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">There are no individual {displayName.toLowerCase()} programs registered or waiting on the queue.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const now = new Date();
              let eventStart, eventEnd;

              if (event.startTime && typeof event.startTime === "string" && (event.startTime.includes("T") || event.startTime.includes("Z"))) {
                eventStart = new Date(event.startTime);
                eventEnd = new Date(event.endTime);
              } else if (event.startTime && typeof event.startTime === "string") {
                eventStart = new Date(`${event.date.split("T")[0]}T${event.startTime}`);
                eventEnd = new Date(`${event.date.split("T")[0]}T${event.endTime}`);
              } else {
                eventStart = new Date(event.date);
                eventEnd = new Date(event.date);
                eventEnd.setHours(23, 59, 59, 999);
              }

              const totalDonated = donationAmounts[event._id] || 0;
              const eventDisplayName = getEventDisplayName(event);

              let actionButton;
              if (now < eventStart) {
                actionButton = (
                  <button onClick={() => handleRegister(event)} className="w-full px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition flex items-center justify-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Register
                  </button>
                );
              } else if (now >= eventStart && now <= eventEnd) {
                actionButton = (
                  <button className="w-full px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg cursor-not-allowed flex items-center justify-center gap-1.5" disabled>
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    Event Started
                  </button>
                );
              } else {
                actionButton = (
                  <button className="w-full px-3 py-2 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed flex items-center justify-center gap-1.5" disabled>
                    <Clock className="w-3.5 h-3.5" />
                    Event Ended
                  </button>
                );
              }

              return (
                <div key={event._id} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-md transition duration-200">
                  {/* Card Header Body */}
                  <div className="p-5 flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-800 tracking-tight leading-snug">{eventDisplayName}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            By <span className="font-semibold text-slate-700">{event.name}</span>
                          </span>
                        </div>
                      </div>

                      {/* Interactive Meta Badges */}
                      <div className="flex flex-col gap-1 items-end shrink-0">
                        {eventType === "blood-donation" && <span className="text-[10px] font-bold tracking-wide bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-md uppercase">🪙 Rewards</span>}
                        {event.donationNeeded && <span className="text-[10px] font-bold tracking-wide bg-pink-50 text-pink-700 border border-pink-100 px-2 py-0.5 rounded-md uppercase">💝 Donations</span>}
                      </div>
                    </div>

                    {/* Drive Specific Details */}
                    <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3.5">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{event.startTime && event.endTime ? `${formatTime(event.startTime)} - ${formatTime(event.endTime)}` : "Time frame not specified"}</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{event.location}</span>
                      </div>
                    </div>

                    {/* Campaign Description Body */}
                    {event.description && <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-3">{event.description}</p>}

                    {/* Local User Donation Receipt Segment */}
                    {totalDonated > 0 && (
                      <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-2 rounded-lg text-xs font-semibold">
                        <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Contribution logged: ₹{totalDonated}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Grid Block */}
                  <div className="bg-slate-50 border-t border-slate-100 p-4 space-y-3">
                    {/* Primary Engagement Row */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      {event.locationURL && (
                        <a href={event.locationURL} target="_blank" rel="noopener noreferrer" className="flex-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition text-center flex items-center justify-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          Location
                        </a>
                      )}

                      {event.shortId !== currentUserId && <div className="flex-1 w-full">{actionButton}</div>}
                    </div>

                    {/* Secondary Operations Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                      {event.donationNeeded && event.shortId !== currentUserId && (
                        <button onClick={() => handleDonate(event)} className="w-full px-3 py-2 text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-lg transition flex items-center justify-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5" />
                          Donate
                        </button>
                      )}

                      <button onClick={() => handleViewParticipants(event._id)} className="w-full px-3 py-2 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition flex items-center justify-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        Participants ({participantsCounts[event._id] || 0})
                      </button>

                      {["ngo", "health_worker"].includes(currentUserRole) && (
                        <button
                          onClick={() =>
                            navigate(`/events/organize/${eventType}`, {
                              state: { eventTypeName: displayName },
                            })
                          }
                          className="w-full px-3 py-2 text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-lg transition flex items-center justify-center gap-1.5">
                          <Plus className="w-3.5 h-3.5" />
                          Clone Event
                        </button>
                      )}

                      {["ngo", "health_worker"].includes(currentUserRole) && event.shortId === currentUserId && (
                        <button onClick={() => handleDelete(event)} className="w-full px-3 py-2 text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-lg transition text-center">
                          Delete Event
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Donation Popup Modal Context */}
      {showDonationPopup && selectedEvent && (
        <DonationPopup
          isOpen={showDonationPopup}
          onClose={() => {
            setShowDonationPopup(false);
            setSelectedEvent(null);
          }}
          eventDetails={{
            eventType: getEventDisplayName(selectedEvent),
            organizerName: selectedEvent.name,
            location: selectedEvent.location,
            upiId: selectedEvent.upiId,
          }}
          onDonate={handleDonationSubmit}
        />
      )}
    </div>
  );
};

export default EventsListPage;
