import React from "react";
import { MapPin, Calendar, CheckCircle, XCircle, Map, ShieldCheck, AlertTriangle } from "lucide-react";
import LeafletMap from "./LeafletMap.jsx";
import { getSeverityColor } from "./outbreakUtils.js";

const ReportCard = ({ report, userRole, onVerify, onToggleStatus, isAuthenticated }) => {
  const canManage = (userRole === "ngo" || userRole === "health_worker") && isAuthenticated;
  const { severity, isActive, descriptionComponents: desc, location, submittedBy, images, verifiedBy, createdAt, id } = report;

  // Custom visual parsing for severities if your dynamic utility maps to text
  const severityStyles = {
    high: "bg-rose-50 text-rose-700 border-rose-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const currentSeverityStyle = severityStyles[severity.toLowerCase()] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div className={`relative bg-white rounded-xl border transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden ${!isActive ? "border-slate-200 opacity-75" : "border-emerald-100"}`}>
      {/* Top Banner accent for Active vs Inactive */}
      <div className={`h-1.5 w-full ${isActive ? "bg-emerald-600" : "bg-slate-400"}`} />

      <div className="p-5 flex-1 flex flex-col">
        {/* Card Header & Badges */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className={`text-[11px] font-bold tracking-wide px-2 py-0.5 rounded-full border uppercase ${currentSeverityStyle}`}>{severity.toUpperCase()}</span>

            {!isActive && <span className="text-[11px] font-bold tracking-wide bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full uppercase">Inactive</span>}

            <span className="text-[11px] font-bold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full uppercase">{desc.reportType.replace("_", " ")}</span>
          </div>

          {/* Inline Verification Seal */}
          {verifiedBy && (
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50/50 border border-emerald-200 px-2 py-0.5 rounded-md text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 fill-emerald-100" />
              <span>Verified</span>
            </div>
          )}
        </div>

        {/* Title & Metadata */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight capitalize">{desc.diseaseCategory.replace("_", " ")} Outbreak</h3>

          <div className="mt-2 space-y-1.5 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-medium text-slate-700">
                {location.district}, {location.state}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{new Date(createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Metrics Box */}
        <div className="grid grid-cols-2 gap-3 bg-emerald-50/40 border border-emerald-100/70 rounded-lg p-3 mb-4 text-center">
          <div>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Suspected Cases</p>
            <p className="text-lg font-extrabold text-emerald-800">{desc.suspectedCases}</p>
          </div>
          <div className="border-l border-emerald-100">
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Reported By</p>
            <p className="text-sm font-semibold text-slate-700 truncate px-1 mt-0.5" title={submittedBy.name}>
              {submittedBy.name}
            </p>
          </div>
        </div>

        {/* Symptoms Segment */}
        {desc.symptoms && (
          <div className="mb-4 bg-slate-50 rounded-lg p-3 border border-slate-100">
            <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-1">Symptoms Summary</h4>
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{desc.symptoms}</p>
          </div>
        )}

        {/* Interactive / Map Layout Section */}
        {location.latitude && location.longitude && (
          <div className="mb-4 rounded-lg overflow-hidden border border-slate-200">
            <LeafletMap center={[location.latitude, location.longitude]} zoom={12} selectedLocation={{ latitude: location.latitude, longitude: location.longitude }} interactive={false} height="140px" />
            {location.address && <div className="bg-slate-50 p-2 border-t border-slate-100 text-[11px] text-slate-500 truncate">{location.address}</div>}
          </div>
        )}

        {/* Images Thumbnails Grid */}
        {images?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">Evidence Material</h4>
            <div className="grid grid-cols-3 gap-2">
              {images.slice(0, 3).map((img, idx) => (
                <div key={idx} className="aspect-video rounded bg-slate-100 border border-slate-200 overflow-hidden">
                  <img src={`http://localhost:8000${img}`} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition duration-200" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Administrative Actions Bottom Bar */}
      {canManage && (
        <div className="bg-slate-50 border-t border-slate-100 p-3 flex gap-2">
          {!verifiedBy && (
            <button onClick={() => onVerify(id)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-lg shadow-sm transition-colors duration-150">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Verify Case</span>
            </button>
          )}
          <button
            onClick={() => onToggleStatus(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg border transition-all duration-150 ${isActive ? "bg-white text-rose-600 border-rose-200 hover:bg-rose-50" : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50"}`}>
            {isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
            <span>{isActive ? "Deactivate" : "Activate"}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportCard;
