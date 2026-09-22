"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DecoratedListing } from "@/lib/listings";

const pinIcon = (label: string) =>
  L.divIcon({
    className: "",
    html: `<div style="transform:translate(-50%,-100%);background:#fffdf9;border:1px solid rgba(10,24,38,.18);border-radius:999px;padding:6px 9px;font:700 11.5px 'Plus Jakarta Sans',sans-serif;color:#0a1826;white-space:nowrap;box-shadow:0 8px 18px -12px rgba(10,24,38,.55)">${label}</div>`,
    iconSize: [0, 0],
  });

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
    } else {
      map.fitBounds(points, { padding: [24, 24] });
    }
  }, [map, points]);
  return null;
}

export function ListingsMap({
  listings,
  onSelect,
}: {
  listings: DecoratedListing[];
  onSelect?: (id: string) => void;
}) {
  const withCoords = listings.filter((l) => l.lat != null && l.lng != null);
  const points: [number, number][] = withCoords.map((l) => [l.lat as number, l.lng as number]);
  const center: [number, number] = points[0] ?? [45.4642, 9.19];

  return (
    <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} />
      {withCoords.map((l) => (
        <Marker
          key={l.id}
          position={[l.lat as number, l.lng as number]}
          icon={pinIcon(l.feeLabel)}
          eventHandlers={{ click: () => onSelect?.(l.id) }}
        >
          <Popup>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              <strong>{l.title}</strong>
              <br />
              {l.meta}
              <br />
              Tariffa {l.feeLabel} · Risparmi {l.savingLabel}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
