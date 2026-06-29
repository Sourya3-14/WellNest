import api, { blockchainApi } from "../../utils/api.js";

export const outbreakApi = {
  getAllReports: (params = {}) =>
    blockchainApi.get("/outbreak/country/india", { params }).then((r) => r.data),

  submitReport: async (formData) => {
    const r = formData; // raw FormData already built by caller
    const reportData = {
      submittedBy: JSON.stringify({
        name: r.get("submittedBy[name]"),
        email: r.get("submittedBy[email]"),
        phoneNumber: r.get("submittedBy[phoneNumber]") || "",
      }),
      location: JSON.stringify({
        country: r.get("location[country]"),
        state: r.get("location[state]"),
        district: r.get("location[district]"),
        pincode: r.get("location[pincode]") || "",
        address: r.get("location[address]") || "",
        latitude: parseFloat(r.get("location[latitude]")) || null,
        longitude: parseFloat(r.get("location[longitude]")) || null,
      }),
      descriptionComponents: JSON.stringify({
        reportType: r.get("descriptionComponents[reportType]"),
        diseaseCategory: r.get("descriptionComponents[diseaseCategory]"),
        suspectedCases: parseInt(r.get("descriptionComponents[suspectedCases]")),
        basicInfo: r.get("descriptionComponents[basicInfo]") || "",
        symptoms: r.get("descriptionComponents[symptoms]") || "",
        additionalNotes: r.get("descriptionComponents[additionalNotes]") || "",
      }),
      severity: r.get("severity"),
    };

    const body = new FormData();
    Object.entries(reportData).forEach(([k, v]) => body.append(k, v));
    r.getAll("images").forEach((img) => body.append("images", img));

    return blockchainApi
      .post("/outbreak/submit-public", body, { headers: { "Content-Type": "multipart/form-data" } })
      .then((res) => res.data);
  },

  verifyReport: (reportId) =>
    blockchainApi
      .patch(`/outbreak/verify/${reportId}`, {}, { headers: { "Content-Type": "application/json" } })
      .then((r) => r.data),

  toggleReportStatus: (reportId) =>
    blockchainApi.patch(`/outbreak/toggle-status/${reportId}`).then((r) => r.data),
};

export const getCurrentUser = () =>
  api.get("/auth/me").then((r) => r.data);

// Helpers
export const getSeverityColor = (severity) =>
  ({ low: "severity-low", moderate: "severity-moderate", high: "severity-high", critical: "severity-critical" }[severity] || "severity-default");

export const isRecentReport = (createdAt) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  return new Date(createdAt) >= cutoff;
};

export const getRoleDisplayName = (role) =>
  ({ public: "Public User", ngo: "NGO Worker", health_worker: "Health Worker", doctor: "Doctor", patient: "Patient" }[role] || "Public User");

export const buildFormData = (formData, images) => {
  const fd = new FormData();
  const loc = formData.location;
  const sub = formData.submittedBy;
  const desc = formData.descriptionComponents;

  fd.append("submittedBy[name]", sub.name);
  fd.append("submittedBy[email]", sub.email);
  fd.append("submittedBy[phoneNumber]", sub.phoneNumber || "");
  fd.append("location[country]", loc.country);
  fd.append("location[state]", loc.state);
  fd.append("location[district]", loc.district);
  fd.append("location[pincode]", loc.pincode || "");
  fd.append("location[address]", loc.address || "");
  fd.append("location[latitude]", loc.latitude);
  fd.append("location[longitude]", loc.longitude);
  fd.append("descriptionComponents[reportType]", desc.reportType);
  fd.append("descriptionComponents[diseaseCategory]", desc.diseaseCategory);
  fd.append("descriptionComponents[suspectedCases]", desc.suspectedCases);
  fd.append("descriptionComponents[basicInfo]", desc.basicInfo || "");
  fd.append("descriptionComponents[symptoms]", desc.symptoms || "");
  fd.append("descriptionComponents[additionalNotes]", desc.additionalNotes || "");
  fd.append("severity", formData.severity);
  images.forEach((img) => fd.append("images", img));
  return fd;
};
