import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, ShieldCheck, MapPin, Briefcase, Mail, Info, FileText, Calendar, X, ArrowRight } from "lucide-react";
import api from "../../utils/api.js";
import Navbar from "../../components/Navbar.jsx";

export default function HealthWorkersPage() {
  const [healthWorkers, setHealthWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [workerBlogs, setWorkerBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }
    fetchHealthWorkers();
    fetchCurrentUser();
  }, [navigate]);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get("/auth/me");
      setCurrentUser(response.data.data.user);
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  const fetchHealthWorkers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/healthworker/list");
      setHealthWorkers(response.data.data || []);
    } catch (err) {
      setError("Failed to fetch verified health workers.");
      console.error("Error fetching health workers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBlogs = async (worker) => {
    setSelectedWorker(worker);
    setShowBlogModal(true);
    setLoadingBlogs(true);

    try {
      const isOwner = currentUser && worker.user && currentUser._id === worker.user._id;

      if (isOwner) {
        const blogsResponse = await api.get("/healthworker/blogs");
        setWorkerBlogs(blogsResponse.data.data || []);
      } else {
        const allBlogsResponse = await api.get("/healthworker/all-blogs");
        const allBlogs = allBlogsResponse.data.data || [];

        const workerName = worker.user ? `${worker.user.firstName} ${worker.user.lastName}` : worker.name || "Health Worker";
        const filteredBlogs = allBlogs.filter((blog) => blog.workerName === workerName);

        setWorkerBlogs(filteredBlogs);
      }
    } catch (err) {
      console.error("Error fetching health worker blogs:", err);
      setWorkerBlogs([]);
    } finally {
      setLoadingBlogs(false);
    }
  };

  const handleContact = (worker) => {
    setSelectedWorker(worker);
    setShowContactModal(true);
  };

  const closeBlogModal = () => {
    setShowBlogModal(false);
    setSelectedWorker(null);
    setWorkerBlogs([]);
  };

  const closeContactModal = () => {
    setShowContactModal(false);
    setSelectedWorker(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  // State Overlays: Loader
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        <Navbar onLogout={handleLogout} />
        <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-500">Loading verified health professionals...</p>
        </div>
      </div>
    );
  }

  // State Overlays: Failure
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        <Navbar onLogout={handleLogout} />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl p-4 mb-4 text-sm font-medium">{error}</div>
          <button className="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl text-sm shadow hover:bg-emerald-700 transition" onClick={fetchHealthWorkers}>
            Try Reconnecting
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <header className="border-b border-slate-200 pb-6 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Community Health Workers</h1>
          <p className="mt-1.5 text-sm text-slate-500">Access community health workers and care providers for localized diagnostic and healthcare support.</p>
        </header>

        {/* Empty Directory Block */}
        {healthWorkers.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <Stethoscope className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No Providers Listed</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">There are no community health worker registration indexes matching this region node.</p>
          </div>
        ) : (
          /* Cards Grid Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {healthWorkers.map((worker, index) => {
              const isOwner = currentUser && worker.user && currentUser._id === worker.user._id;
              return (
                <div key={worker._id || index} className="bg-white rounded-xl border border-emerald-100 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between overflow-hidden">
                  {/* Card Main Block */}
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      {isOwner ? (
                        <span className="text-[10px] font-bold tracking-wider bg-emerald-600 text-white px-2.5 py-0.5 rounded-full uppercase">Your Profile</span>
                      ) : (
                        worker.isProfileComplete && (
                          <span className="text-[10px] font-bold tracking-wider bg-slate-100 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                          </span>
                        )
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-snug">{worker.user ? `${worker.user.firstName} ${worker.user.lastName}` : worker.name || "Care Practitioner"}</h3>

                    {/* About Statement Box */}
                    {worker.about && <p className="mt-3 text-xs text-slate-600 leading-relaxed line-clamp-2 bg-slate-50 rounded-lg p-2.5 border border-slate-100">{worker.about}</p>}

                    {/* Meta Meta Details */}
                    <div className="mt-4 space-y-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <p className="truncate">
                          <span className="font-medium text-slate-700">Employer:</span> {worker.employer || "Independent Network"}
                        </p>
                      </div>

                      {worker.region && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <p className="truncate">
                            <span className="font-medium text-slate-700">Region:</span> {worker.region}
                          </p>
                        </div>
                      )}

                      {worker.certId && (
                        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                          <span className="font-sans font-medium text-slate-700 text-xs">ID:</span> {worker.certId}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar Footer */}
                  <div className="bg-slate-50 border-t border-slate-100 p-3.5 flex gap-2.5">
                    <button className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition" onClick={() => handleContact(worker)}>
                      Contact Provider
                    </button>
                    <button className="flex-1 px-3 py-2 text-xs font-semibold text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-lg transition flex items-center justify-center gap-1" onClick={() => handleViewBlogs(worker)}>
                      <span>{isOwner ? "My Bulletins" : "Read Bulletins"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Contact Profile Modal Overlays */}
      {showContactModal && selectedWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={closeContactModal}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Provider Directory Profile</h3>
                <p className="text-xs text-emerald-100">Verified institutional clinical/community references</p>
              </div>
              <button onClick={closeContactModal} className="p-1 rounded-lg bg-emerald-800/40 text-emerald-100 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Stethoscope className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Practitioner Full Name</h5>
                    <p className="text-sm font-semibold text-slate-800">{selectedWorker.user ? `${selectedWorker.user.firstName} ${selectedWorker.user.lastName}` : selectedWorker.name || "Unspecified"}</p>
                  </div>
                </div>

                {selectedWorker.employer && (
                  <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Briefcase className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Attached Health Affiliate</h5>
                      <p className="text-sm font-medium text-slate-700">{selectedWorker.employer}</p>
                    </div>
                  </div>
                )}

                {selectedWorker.certId && (
                  <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">License / Practitioner Verification ID</h5>
                      <p className="text-sm font-mono font-medium text-slate-700">{selectedWorker.certId}</p>
                    </div>
                  </div>
                )}

                {selectedWorker.region && (
                  <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Designated Catchment Area</h5>
                      <p className="text-sm font-medium text-slate-700">{selectedWorker.region}</p>
                    </div>
                  </div>
                )}

                {selectedWorker.user?.email && (
                  <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Mail className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Secure Communication Mailbox</h5>
                      <a href={`mailto:${selectedWorker.user.email}`} className="text-sm font-medium text-emerald-600 hover:underline">
                        {selectedWorker.user.email}
                      </a>
                    </div>
                  </div>
                )}

                {selectedWorker.about && (
                  <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Background & Focus Details</h5>
                      <p className="text-xs text-slate-600 leading-relaxed">{selectedWorker.about}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons inside Modal */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                {selectedWorker.user?.email && (
                  <a href={`mailto:${selectedWorker.user.email}`} className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition text-center">
                    <Mail className="w-3.5 h-3.5" /> Open Email Portal
                  </a>
                )}
                <button
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-xl transition"
                  onClick={() => {
                    closeContactModal();
                    handleViewBlogs(selectedWorker);
                  }}>
                  Read Publications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blogs / Publications Modal Overlay */}
      {showBlogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={closeBlogModal}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base">Health Logs & Advisories</h3>
                <p className="text-xs text-slate-400 font-normal">Sourced articles directly from field staff</p>
              </div>
              <button onClick={closeBlogModal} className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50">
              {loadingBlogs ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-2" />
                  <p className="text-xs text-slate-500">Querying provider log history...</p>
                </div>
              ) : workerBlogs.length === 0 ? (
                <div className="text-center py-12 p-6 bg-white rounded-xl border border-slate-200">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-slate-800">No Journal Logs Found</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    {currentUser && selectedWorker?.user && currentUser._id === selectedWorker.user._id
                      ? "You haven't published any advisory updates yet. Add dynamic items inside your dashboard profile settings."
                      : "This care provider has not committed any medical advice columns onto the shared network grid."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workerBlogs.map((blog, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                      <h5 className="text-base font-bold text-slate-800 tracking-tight">{blog.title}</h5>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{blog.body}</p>

                      <div className="flex items-center gap-1 pt-2 text-[10px] font-medium text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>Published: {new Date(blog.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
