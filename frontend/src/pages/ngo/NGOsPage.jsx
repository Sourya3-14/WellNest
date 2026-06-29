import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Globe, Mail, Target, Award, ArrowRight, FileText, Calendar, X, ExternalLink } from "lucide-react";
import api from "../../utils/api.js";
import Navbar from "../../components/Navbar.jsx";

export default function NGOsPage() {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNGO, setSelectedNGO] = useState(null);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [ngoBlogs, setNgoBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }
    fetchNGOs();
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

  const fetchNGOs = async () => {
    try {
      setLoading(true);
      const response = await api.get("/ngos");
      setNgos(response.data.data.items || []);
    } catch (err) {
      setError("Failed to fetch partner organizations.");
      console.error("Error fetching NGOs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBlogs = async (ngo) => {
    setSelectedNGO(ngo);
    setShowBlogModal(true);
    setLoadingBlogs(true);

    try {
      const isOwner = currentUser && ngo.user && currentUser._id === ngo.user._id;

      if (isOwner) {
        const blogsResponse = await api.get("/ngo/blogs");
        setNgoBlogs(blogsResponse.data.data || []);
      } else {
        const allBlogsResponse = await api.get("/ngo/all-blogs");
        const allBlogs = allBlogsResponse.data.data || [];

        const ngoName = ngo.user ? `${ngo.user.firstName} ${ngo.user.lastName}` : ngo.orgName || "NGO";
        const filteredBlogs = allBlogs.filter((blog) => blog.ngoName === ngoName);

        setNgoBlogs(filteredBlogs);
      }
    } catch (err) {
      console.error("Error fetching NGO blogs:", err);
      setNgoBlogs([]);
    } finally {
      setLoadingBlogs(false);
    }
  };

  const handleContact = (ngo) => {
    setSelectedNGO(ngo);
    setShowContactModal(true);
  };

  const closeBlogModal = () => {
    setShowBlogModal(false);
    setSelectedNGO(null);
    setNgoBlogs([]);
  };

  const closeContactModal = () => {
    setShowContactModal(false);
    setSelectedNGO(null);
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
          <p className="text-sm font-medium text-slate-500">Loading verified medical partners...</p>
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
          <button className="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl text-sm shadow hover:bg-emerald-700 transition" onClick={fetchNGOs}>
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
        {/* Page Title Header */}
        <header className="border-b border-slate-200 pb-6 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Health Support Networks & NGOs</h1>
          <p className="mt-1.5 text-sm text-slate-500">Connect directly with verified public non-governmental relief foundations and active teams.</p>
        </header>

        {/* Empty Directory Block */}
        {ngos.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <Building2 className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No NGOs Registered</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">There are no health networks indexed under this district zone node yet.</p>
          </div>
        ) : (
          /* Cards Directory Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ngos.map((ngo, index) => {
              const isOwner = currentUser && ngo.user && currentUser._id === ngo.user._id;
              return (
                <div key={ngo._id || index} className="bg-white rounded-xl border border-emerald-100 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between overflow-hidden">
                  {/* Card Content Top half */}
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
                        <Building2 className="w-5 h-5" />
                      </div>
                      {isOwner && <span className="text-[10px] font-bold tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase">Your Organization</span>}
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-snug">{ngo.user ? `${ngo.user.firstName} ${ngo.user.lastName}` : ngo.orgName || ngo.name || "NGO Identity"}</h3>

                    {/* Mission Statement Block */}
                    {ngo.mission && (
                      <p className="mt-3 text-xs text-slate-600 leading-relaxed line-clamp-3 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                        <span className="font-semibold text-slate-700 block text-[10px] uppercase tracking-wider text-emerald-700 mb-0.5">Mission Focus</span>
                        {ngo.mission}
                      </p>
                    )}

                    {/* Detailed Properties */}
                    <div className="mt-4 space-y-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
                      {ngo.services && (
                        <div className="flex items-start gap-2">
                          <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <p className="line-clamp-2">
                            <span className="font-semibold text-slate-700">Services:</span> {ngo.services}
                          </p>
                        </div>
                      )}
                      {ngo.website && (
                        <div className="flex items-center gap-2 truncate">
                          <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate hover:text-emerald-600 transition cursor-pointer">{ngo.website}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar Footer */}
                  <div className="bg-slate-50 border-t border-slate-100 p-3.5 flex gap-2.5">
                    <button className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition" onClick={() => handleContact(ngo)}>
                      Contact Hub
                    </button>
                    <button className="flex-1 px-3 py-2 text-xs font-semibold text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-lg transition flex items-center justify-center gap-1" onClick={() => handleViewBlogs(ngo)}>
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

      {/* Connection & Contact Modal overlay */}
      {showContactModal && selectedNGO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={closeContactModal}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Contact Information</h3>
                <p className="text-xs text-emerald-100">Direct directory records for communication lookup</p>
              </div>
              <button onClick={closeContactModal} className="p-1 rounded-lg bg-emerald-800/40 text-emerald-100 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Building2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Legal Entity Name</h5>
                    <p className="text-sm font-semibold text-slate-800">{selectedNGO.orgName || (selectedNGO.user ? `${selectedNGO.user.firstName} ${selectedNGO.user.lastName}` : "Not indexed")}</p>
                  </div>
                </div>

                {selectedNGO.registrationNumber && (
                  <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">State License / Registration Code</h5>
                      <p className="text-sm font-mono font-medium text-slate-700">{selectedNGO.registrationNumber}</p>
                    </div>
                  </div>
                )}

                {selectedNGO.email && (
                  <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Mail className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Secured Mailbox</h5>
                      <a href={`mailto:${selectedNGO.email}`} className="text-sm font-medium text-emerald-600 hover:underline inline-flex items-center gap-1">
                        <span>{selectedNGO.email}</span>
                      </a>
                    </div>
                  </div>
                )}

                {selectedNGO.website && (
                  <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Globe className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Public Digital Space</h5>
                      <a href={selectedNGO.website.startsWith("http") ? selectedNGO.website : `https://${selectedNGO.website}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-emerald-600 hover:underline inline-flex items-center gap-1">
                        <span>{selectedNGO.website}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Instant Linkouts Trigger */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                {selectedNGO.email && (
                  <a href={`mailto:${selectedNGO.email}`} className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition text-center">
                    <Mail className="w-3.5 h-3.5" /> Email Portal
                  </a>
                )}
                {selectedNGO.website && (
                  <a
                    href={selectedNGO.website.startsWith("http") ? selectedNGO.website : `https://${selectedNGO.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-xl transition text-center">
                    Launch Site
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blogs / Bulletins Modal Overlay */}
      {showBlogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={closeBlogModal}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base">Bulletins & Health Advisories</h3>
                <p className="text-xs text-slate-400">Published releases by selected team</p>
              </div>
              <button onClick={closeBlogModal} className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50">
              {loadingBlogs ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-2" />
                  <p className="text-xs text-slate-500">Querying publications feed...</p>
                </div>
              ) : ngoBlogs.length === 0 ? (
                <div className="text-center py-12 p-6 bg-white rounded-xl border border-slate-200">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-slate-800">No Advisory Logs found</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    {currentUser && selectedNGO?.user && currentUser._id === selectedNGO.user._id
                      ? "You haven't published any advisory bulletins yet. Build dynamic content blocks inside your user Profile dashboard."
                      : "This collective has not committed any operational update records onto the public feed."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ngoBlogs.map((blog, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                      <h5 className="text-base font-bold text-slate-800 tracking-tight">{blog.title}</h5>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{blog.body}</p>

                      <div className="flex items-center gap-1 pt-2 text-[10px] font-medium text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>Posted: {new Date(blog.createdAt).toLocaleDateString()}</span>
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
