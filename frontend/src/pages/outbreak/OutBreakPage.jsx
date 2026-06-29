import React, { useState, useEffect } from "react";
import { Plus, Eye, Search, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar.jsx";
import { getToken, removeToken } from "../../utils/auth.js";
import { outbreakApi, getCurrentUser, getRoleDisplayName, isRecentReport, buildFormData } from "./outbreakUtils.js";
import { DISEASE_CATEGORIES, SEVERITY_LEVELS, DEFAULT_FORM } from "./constants.js";
import ReportCard from "./ReportCard.jsx";
import SubmitReportForm from "./SubmitReportForm.jsx";

const OutbreakDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("reports");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState("public");
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [selectedImages, setSelectedImages] = useState([]);

  const isAuthenticated = !!getToken();

  useEffect(() => {
    if (getToken()) fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const fetchCurrentUser = async () => {
    try {
      const { success, data } = await getCurrentUser();
      if (success && data?.user) {
        const user = data.user;
        setCurrentUser(user);
        setUserRole(["ngo", "health_worker", "doctor", "patient"].includes(user.role) ? user.role : "public");
        setFormData((prev) => ({
          ...prev,
          submittedBy: {
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            email: user.email || "",
            phoneNumber: user.phone || "",
          },
        }));
      }
    } catch {
      setUserRole("public");
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const result = await outbreakApi.getAllReports(filters);
      setReports(result.data?.reports || []);
    } catch (error) {
      if (error.response?.status === 401) handleLogout();
      else alert("Error fetching reports. Please try again.");
    }
    setLoading(false);
  };

  const handleSubmitReport = async () => {
    const { submittedBy, location, descriptionComponents } = formData;
    if (!submittedBy.name || !submittedBy.email) return alert("Please fill in your name and email.");
    if (!location.state || !location.district) return alert("Please fill in state and district.");
    if (!descriptionComponents.diseaseCategory) return alert("Please select a disease category.");
    if (!location.latitude || !location.longitude) return alert("Please select a location on the map.");

    setLoading(true);
    try {
      const result = await outbreakApi.submitReport(buildFormData(formData, selectedImages));
      if (result.success) {
        alert("Report submitted successfully!");
        setShowForm(false);
        setFormData({ ...DEFAULT_FORM, submittedBy: formData.submittedBy });
        setSelectedImages([]);
        fetchReports();
      } else {
        alert(result.message || "Error submitting report");
      }
    } catch (error) {
      if (error.response?.status === 401) handleLogout();
      else alert(error.response?.data?.message || "Error submitting report");
    }
    setLoading(false);
  };

  const handleVerifyReport = async (reportId) => {
    if (!getToken()) return alert("Please login to verify reports");
    try {
      const result = await outbreakApi.verifyReport(reportId);
      if (result.success) {
        alert("Report verified!");
        fetchReports();
      }
    } catch (error) {
      if (error.response?.status === 403) alert("You don't have permission to verify reports");
      else alert(error.response?.data?.message || "Error verifying report");
    }
  };

  const handleToggleStatus = async (reportId) => {
    if (!getToken()) return alert("Please login to manage reports");
    try {
      const result = await outbreakApi.toggleReportStatus(reportId);
      if (result.success) {
        alert(result.message || "Status updated!");
        fetchReports();
      }
    } catch (error) {
      if (error.response?.status === 403) alert("You don't have permission to manage reports");
      else alert(error.response?.data?.message || "Error updating status");
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate("/signin");
  };

  const filteredReports = reports.filter((r) => (filters.includeInactive ? true : r.isActive && isRecentReport(r.createdAt)));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <header className="border-b border-slate-200 pb-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Outbreak Reporting System</h1>
              <p className="mt-1.5 text-sm text-slate-500">Monitor and report disease outbreaks in your community in real-time.</p>
            </div>

            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm self-start md:self-center">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-xs">
                <p className="font-medium text-slate-400 uppercase tracking-wider text-[10px]">Current Role</p>
                <p className="font-semibold text-slate-700">{getRoleDisplayName(userRole)}</p>
              </div>
              {currentUser && (
                <div className="border-l border-slate-200 pl-3 ml-1">
                  <p className="font-medium text-slate-400 uppercase tracking-wider text-[10px]">User</p>
                  <p className="font-semibold text-slate-700">{currentUser.firstName || "User"}</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-8 bg-slate-100 p-1 rounded-xl max-w-md">
            <button
              onClick={() => setActiveTab("reports")}
              className={`flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "reports" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>
              <Eye className="w-4 h-4" />
              <span>View Reports</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("submit");
                setShowForm(true);
              }}
              className={`flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "submit" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>
              <Plus className="w-4 h-4" />
              <span>Submit Report</span>
            </button>
          </div>
        </header>

        {/* Filters Panel */}
        {activeTab === "reports" && (
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              {/* State Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by state..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                />
              </div>

              {/* Severity Select */}
              <select className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none cursor-pointer" onChange={(e) => setFilters({ ...filters, severity: e.target.value })}>
                <option value="">All Severities</option>
                {SEVERITY_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </option>
                ))}
              </select>

              {/* Disease Category Select */}
              <select className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none cursor-pointer" onChange={(e) => setFilters({ ...filters, diseaseCategory: e.target.value })}>
                <option value="">All Categories</option>
                {DISEASE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace("_", " ")}
                  </option>
                ))}
              </select>

              {/* Inactive Checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm font-medium text-slate-600 hover:text-slate-900 justify-self-start md:justify-self-end">
                <input type="checkbox" className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 focus:ring-2 transition-all cursor-pointer" onChange={(e) => setFilters({ ...filters, includeInactive: e.target.checked })} />
                <span>Include Inactive</span>
              </label>
            </div>
          </section>
        )}

        {/* Reports Content List */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                <p className="text-sm font-medium text-slate-500">Loading public reports...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <AlertCircle className="w-10 h-10 text-slate-300 mb-3" />
                <h3 className="text-base font-semibold text-slate-800">No matching records</h3>
                <p className="text-sm text-slate-500 max-w-sm mt-1">We couldn't find any outbreak reports matching your currently applied query criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReports.map((report) => (
                  <ReportCard key={report.id} report={report} userRole={userRole} onVerify={handleVerifyReport} onToggleStatus={handleToggleStatus} isAuthenticated={isAuthenticated} />
                ))}
              </div>
            )}
          </div>
        )}

        <SubmitReportForm showForm={showForm} setShowForm={setShowForm} formData={formData} setFormData={setFormData} selectedImages={selectedImages} setSelectedImages={setSelectedImages} onSubmit={handleSubmitReport} loading={loading} />
      </main>
    </div>
  );
};

export default OutbreakDashboard;
