import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api.js";
import Navbar from "../../components/Navbar.jsx";
import {
  BookOpen,
  Building2,
  Activity,
  Newspaper,
  Calendar,
  User,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, ngo, health_worker
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }
    fetchAllBlogs();
  }, [navigate]);

  const fetchAllBlogs = async () => {
    try {
      setLoading(true);
      setError("");

      const [ngoBlogsResponse, healthWorkerBlogsResponse] = await Promise.all([
        api.get("/ngo/all-blogs"),
        api.get("/healthworker/all-blogs"),
      ]);

      const ngoBlogs = ngoBlogsResponse.data.data || [];
      const healthWorkerBlogs = healthWorkerBlogsResponse.data.data || [];

      const allBlogs = [
        ...ngoBlogs.map((blog) => ({
          ...blog,
          source: "NGO",
          sourceName: blog.ngoName,
          sourceIcon: <Building2 className="w-3.5 h-3.5" />,
        })),
        ...healthWorkerBlogs.map((blog) => ({
          ...blog,
          source: "Health Worker",
          sourceName: blog.workerName,
          sourceIcon: <Activity className="w-3.5 h-3.5" />,
        })),
      ];

      allBlogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setBlogs(allBlogs);
    } catch (err) {
      setError("Failed to synchronize regional health articles.");
      console.error("Error fetching blogs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  const filteredBlogs = blogs.filter((blog) => {
    if (filter === "all") return true;
    if (filter === "ngo") return blog.source === "NGO";
    if (filter === "health_worker") return blog.source === "Health Worker";
    return true;
  });

  // Reusable Main Header Card Layout Component
  const PageHeader = () => (
    <div className="relative overflow-hidden bg-white rounded-3xl border border-[#E8F5F0] p-8 md:p-10 shadow-sm mb-8">
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-[#4CAF82]/5 to-transparent rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 max-w-2xl space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#2D7A5F]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#2D7A5F]">
          <BookOpen size={12} />
          Knowledge Hub
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[#1A3C34] sm:text-4xl">
          Health Blogs
        </h1>
        <p className="text-sm font-medium text-[#4A7A6A] leading-relaxed">
          Stay informed with peer-reviewed community medicine analysis,
          localized healthcare announcements, and wellness guidelines from our
          authenticated handlers.
        </p>
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
            <RefreshCw className="w-10 h-10 text-[#2D7A5F] animate-spin" />
            <p className="text-sm font-bold text-[#4A7A6A]">
              Synchronizing decentralized media stream...
            </p>
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
          <div className="bg-white rounded-3xl border border-[#E8F5F0] p-12 shadow-sm flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto">
            <div className="w-12 h-12 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold">Data Stream Interrupted</h3>
            <p className="text-xs sm:text-sm font-medium text-[#4A7A6A] leading-relaxed">
              {error} Please check your regional connection credentials or retry
              parameters.
            </p>
            <button
              className="flex items-center gap-2 rounded-xl bg-[#2D7A5F] px-5 py-2.5 text-xs font-bold text-white transition-all duration-200 hover:bg-[#245F4A] active:scale-95 shadow-md shadow-[#2D7A5F]/10"
              onClick={fetchAllBlogs}
            >
              <RefreshCw size={12} />
              Retry Stream Connection
            </button>
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

        {/* Filter Toolbar System */}
        <div className="flex items-center justify-between border-b border-[#C8E6D8]/60 pb-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-200 active:scale-95 ${
                filter === "all"
                  ? "bg-[#2D7A5F] text-white shadow-md shadow-[#2D7A5F]/10"
                  : "bg-white border border-[#E8F5F0] text-[#4A7A6A] hover:bg-[#F6FFFC] hover:text-[#2D7A5F]"
              }`}
              onClick={() => setFilter("all")}
            >
              All Channels ({blogs.length})
            </button>
            <button
              className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-200 active:scale-95 ${
                filter === "ngo"
                  ? "bg-[#2D7A5F] text-white shadow-md shadow-[#2D7A5F]/10"
                  : "bg-white border border-[#E8F5F0] text-[#4A7A6A] hover:bg-[#F6FFFC] hover:text-[#2D7A5F]"
              }`}
              onClick={() => setFilter("ngo")}
            >
              NGO Desks ({blogs.filter((b) => b.source === "NGO").length})
            </button>
            <button
              className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-200 active:scale-95 ${
                filter === "health_worker"
                  ? "bg-[#2D7A5F] text-white shadow-md shadow-[#2D7A5F]/10"
                  : "bg-white border border-[#E8F5F0] text-[#4A7A6A] hover:bg-[#F6FFFC] hover:text-[#2D7A5F]"
              }`}
              onClick={() => setFilter("health_worker")}
            >
              Health Worker Bulletins (
              {blogs.filter((b) => b.source === "Health Worker").length})
            </button>
          </div>
        </div>

        {/* Dynamic Matrix View */}
        {filteredBlogs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E8F5F0] p-16 shadow-sm text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 bg-[#F6FFFC] border border-[#C8E6D8] text-[#2D7A5F] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Newspaper size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black">No Active Feeds</h3>
              <p className="text-xs font-medium text-[#4A7A6A] leading-relaxed">
                There are currently no synchronized entries inside this filter
                parameter profile. Check back shortly.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map((blog, index) => (
              <article
                key={index}
                className="group bg-white rounded-2xl border border-[#E8F5F0] p-6 shadow-sm hover:shadow-xl hover:border-[#C8E6D8] transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  {/* Top Header Registry */}
                  <div className="flex items-center justify-between gap-4 border-b border-[#F0F7F4] pb-3 mb-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 bg-[#F6FFFC] border border-[#C8E6D8] text-[#2D7A5F] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        {blog.sourceIcon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-[#1A3C34] truncate max-w-[120px]">
                          {blog.sourceName || "System Operator"}
                        </p>
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#4A7A6A]/60 -mt-0.5">
                          {blog.source}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#4A7A6A] flex-shrink-0 bg-[#F0F7F4] px-2 py-0.5 rounded-md">
                      <Calendar size={10} className="opacity-70" />
                      {new Date(blog.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>

                  {/* Body Context Block */}
                  <div className="space-y-2">
                    <h3 className="text-base font-black text-[#1A3C34] group-hover:text-[#2D7A5F] transition-colors leading-snug line-clamp-2">
                      {blog.title}
                    </h3>
                    <p className="text-xs font-medium text-[#4A7A6A] leading-relaxed line-clamp-4">
                      {blog.body}
                    </p>
                  </div>
                </div>

                {/* Footer Action Key */}
                <div className="pt-5 mt-4 border-t border-[#F0F7F4] flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-[#4A7A6A]/80 font-semibold">
                    <User size={10} />
                    Verified Agent
                  </div>
                  <button className="group/btn flex items-center gap-1 rounded-lg border-2 border-[#C8E6D8] bg-white px-3 py-1.5 text-xs font-extrabold text-[#2D7A5F] transition-all duration-200 hover:border-[#2D7A5F] hover:bg-[#2D7A5F]/5 active:scale-95">
                    Read More
                    <ArrowUpRight
                      size={12}
                      className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform"
                    />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
