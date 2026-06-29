import React, { useState, useEffect } from "react";
import { X, MapPin, Map, User, ClipboardList, Image as ImageIcon } from "lucide-react";
import LeafletMap from "./LeafletMap.jsx";
import { DISEASE_CATEGORIES, REPORT_TYPES, SEVERITY_LEVELS } from "./constants.js";

const Field = ({ label, children }) => (
  <div className="space-y-1">
    {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>}
    {children}
  </div>
);

const SubmitReportForm = ({ showForm, setShowForm, formData, setFormData, selectedImages, setSelectedImages, onSubmit, loading }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (formData.location.latitude && formData.location.longitude) {
      setSelectedLocation({ latitude: formData.location.latitude, longitude: formData.location.longitude });
    }
  }, [formData.location]);

  const updateBy = (patch) => setFormData({ ...formData, submittedBy: { ...formData.submittedBy, ...patch } });
  const updateLoc = (patch) => setFormData({ ...formData, location: { ...formData.location, ...patch } });
  const updateDesc = (patch) => setFormData({ ...formData, descriptionComponents: { ...formData.descriptionComponents, ...patch } });

  const handleLocationSelect = (loc) => {
    setSelectedLocation(loc);
    updateLoc({
      latitude: loc.latitude,
      longitude: loc.longitude,
      address: loc.address,
      state: loc.state || formData.location.state,
      district: loc.district || formData.location.district,
      pincode: loc.pincode || formData.location.pincode,
    });
  };

  if (!showForm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Submit Outbreak Report</h2>
            <p className="text-xs text-emerald-100 mt-0.5">Provide verified details to alert nearby public health workers</p>
          </div>
          <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg bg-emerald-800/40 hover:bg-emerald-800/60 text-emerald-100 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50/50">
          {/* Section 1: Personal Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Reporter Contact Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                placeholder="Full Name"
                required
                value={formData.submittedBy.name}
                onChange={(e) => updateBy({ name: e.target.value })}
              />
              <input
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                type="email"
                placeholder="Email Address"
                required
                value={formData.submittedBy.email}
                onChange={(e) => updateBy({ email: e.target.value })}
              />
              <input
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                type="tel"
                placeholder="Phone Number (Optional)"
                value={formData.submittedBy.phoneNumber}
                onChange={(e) => updateBy({ phoneNumber: e.target.value })}
              />
            </div>
          </div>

          {/* Section 2: Location Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Map className="w-4 h-4 text-emerald-600" />
                <span>Geographic Location Details</span>
              </h3>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                {selectedLocation && (
                  <span className="text-xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-md">
                    GPS: {selectedLocation.latitude?.toFixed(4)}, {selectedLocation.longitude?.toFixed(4)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${showMap ? "bg-slate-100 text-slate-700 border-slate-300" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"}`}>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{showMap ? "Hide Interactive Map" : "Pinpoint on Map"}</span>
                </button>
              </div>
            </div>

            {showMap && (
              <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <div className="bg-slate-800 text-slate-200 px-3 py-1.5 text-[11px] font-medium tracking-wide">Click/tap standard map markers to drop an accurate coordinate point.</div>
                <LeafletMap onLocationSelect={handleLocationSelect} selectedLocation={selectedLocation} height="320px" interactive />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <input
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                placeholder="State"
                required
                value={formData.location.state}
                onChange={(e) => updateLoc({ state: e.target.value })}
              />
              <input
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                placeholder="District"
                required
                value={formData.location.district}
                onChange={(e) => updateLoc({ district: e.target.value })}
              />
              <input
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                placeholder="Pincode"
                value={formData.location.pincode}
                onChange={(e) => updateLoc({ pincode: e.target.value })}
              />
              <input
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                placeholder="Full Address / Landmark"
                value={formData.location.address}
                onChange={(e) => updateLoc({ address: e.target.value })}
              />
            </div>
          </div>

          {/* Section 3: Report Case Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <ClipboardList className="w-4 h-4 text-emerald-600" />
              <span>Medical Observations & Diagnostics</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Field label="Report Origin">
                <select
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  required
                  value={formData.descriptionComponents.reportType}
                  onChange={(e) => updateDesc({ reportType: e.target.value })}>
                  {REPORT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ").toUpperCase()}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Disease Category">
                <select
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  required
                  value={formData.descriptionComponents.diseaseCategory}
                  onChange={(e) => updateDesc({ diseaseCategory: e.target.value })}>
                  <option value="">Select Category</option>
                  {DISEASE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Suspected Count">
                <input
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  type="number"
                  placeholder="0"
                  min="0"
                  required
                  value={formData.descriptionComponents.suspectedCases}
                  onChange={(e) => updateDesc({ suspectedCases: parseInt(e.target.value) || 0 })}
                />
              </Field>

              <Field label="Perceived Severity">
                <select
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  required
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}>
                  {SEVERITY_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l.toUpperCase()}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="space-y-4">
              <textarea
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-y"
                rows="2"
                placeholder="Basic incident timeline info..."
                value={formData.descriptionComponents.basicInfo}
                onChange={(e) => updateDesc({ basicInfo: e.target.value })}
              />
              <textarea
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-y"
                rows="2"
                placeholder="List active symptoms observed (e.g. fever, vomiting, rashes)..."
                value={formData.descriptionComponents.symptoms}
                onChange={(e) => updateDesc({ symptoms: e.target.value })}
              />
              <textarea
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-y"
                rows="2"
                placeholder="Additional critical notes or remarks..."
                value={formData.descriptionComponents.additionalNotes}
                onChange={(e) => updateDesc({ additionalNotes: e.target.value })}
              />
            </div>
          </div>

          {/* Section 4: Document Evidence */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>Evidence Attachments</span>
            </h3>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <input type="file" id="evidence-upload" multiple accept="image/*" className="hidden" onChange={(e) => setSelectedImages(Array.from(e.target.files))} />
              <label htmlFor="evidence-upload" className="cursor-pointer text-center">
                <span className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">Choose Image Files</span>
              </label>

              {selectedImages.length > 0 ? (
                <p className="mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{selectedImages.length} medical file image(s) ready to attach</p>
              ) : (
                <p className="mt-1.5 text-[11px] text-slate-400">Optional: upload logs, charts, or environment photos</p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Action Controls footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
          <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
            Cancel
          </button>

          <button type="button" onClick={onSubmit} disabled={loading} className="min-w-[120px] px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Report</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitReportForm;
