export const DISEASE_CATEGORIES = [
  "respiratory", "gastrointestinal", "vector_borne", "waterborne",
  "foodborne", "skin", "neurological", "other",
];

export const REPORT_TYPES = ["outbreak", "health_survey", "emergency"];
export const SEVERITY_LEVELS = ["low", "moderate", "high", "critical"];

export const SEVERITY_COLORS = {
  low: "severity-low",
  moderate: "severity-moderate",
  high: "severity-high",
  critical: "severity-critical",
};

export const ROLE_NAMES = {
  public: "Public User",
  ngo: "NGO Worker",
  health_worker: "Health Worker",
  doctor: "Doctor",
  patient: "Patient",
};

export const DEFAULT_FORM = {
  submittedBy: { name: "", email: "", phoneNumber: "" },
  location: {
    country: "India",
    state: "",
    district: "",
    pincode: "",
    address: "",
    latitude: null,
    longitude: null,
  },
  descriptionComponents: {
    reportType: "outbreak",
    diseaseCategory: "",
    suspectedCases: 0,
    basicInfo: "",
    symptoms: "",
    additionalNotes: "",
  },
  severity: "moderate",
};
