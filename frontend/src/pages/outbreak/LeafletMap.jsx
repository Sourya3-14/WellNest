import React, { useState, useEffect, useRef } from "react";

const LeafletMap = ({
  center = [20.5937, 78.9629],
  zoom = 5,
  onLocationSelect,
  selectedLocation,
  height = "300px",
  interactive = true,
}) => {
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.css";
      document.head.appendChild(link);
    }

    const initMap = () => {
      if (!mapRef.current || !window.L || map) return;

      const newMap = window.L.map(mapRef.current).setView(center, zoom);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(newMap);

      if (interactive && onLocationSelect) {
        newMap.on("click", ({ latlng: { lat, lng } }) => {
          if (marker) newMap.removeLayer(marker);
          const newMarker = window.L.marker([lat, lng]).addTo(newMap);
          setMarker(newMarker);

          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
            .then((r) => r.json())
            .then(({ address = {}, display_name }) =>
              onLocationSelect({
                latitude: lat, longitude: lng,
                address: display_name || "",
                state: address.state || "",
                district: address.state_district || address.county || "",
                pincode: address.postcode || "",
                country: address.country || "India",
              })
            )
            .catch(() =>
              onLocationSelect({ latitude: lat, longitude: lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, state: "", district: "", pincode: "", country: "India" })
            );
        });
      }

      if (selectedLocation?.latitude && selectedLocation?.longitude) {
        window.L.marker([selectedLocation.latitude, selectedLocation.longitude]).addTo(newMap);
        newMap.setView([selectedLocation.latitude, selectedLocation.longitude], 10);
      }

      setMap(newMap);
    };

    if (window.L) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => { if (map) { map.remove(); setMap(null); } };
  }, []);

  useEffect(() => {
    if (!map || !selectedLocation?.latitude || !selectedLocation?.longitude) return;
    if (marker) map.removeLayer(marker);
    const newMarker = window.L.marker([selectedLocation.latitude, selectedLocation.longitude]).addTo(map);
    setMarker(newMarker);
    map.setView([selectedLocation.latitude, selectedLocation.longitude], 10);
  }, [selectedLocation, map]);

  return (
    <div ref={mapRef} style={{ height, width: "100%", borderRadius: "8px", border: "1px solid #ddd" }} className="leaflet-map" />
  );
};

export default LeafletMap;
