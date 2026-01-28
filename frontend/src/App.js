import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

import { apiGet, apiPatch, apiPost } from "./api";

// Fix default marker icons (CRA + leaflet)
// eslint-disable-next-line
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function StatusPill({ status }) {
  return (
    <span className="pill" data-testid="parcel-status-pill">
      {status}
    </span>
  );
}

function ToggleRow({ label, description, value, onChange, testId }) {
  return (
    <div className="toggle-row" data-testid={testId}>
      <div className="toggle-text">
        <div className="toggle-label">{label}</div>
        <div className="toggle-desc">{description}</div>
      </div>
      <label className="switch">
        <input
          data-testid={`${testId}-input`}
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="slider" />
      </label>
    </div>
  );
}

function Timeline({ events }) {
  return (
    <div className="timeline" data-testid="tracking-timeline">
      {events.length === 0 ? (
        <div className="muted" data-testid="tracking-timeline-empty">
          No tracking updates yet.
        </div>
      ) : (
        events.map((e) => (
          <div className="timeline-item" key={e.id} data-testid={`tracking-event-${e.id}`}>
            <div className="timeline-dot" />
            <div className="timeline-content">
              <div className="timeline-title">
                <span className="event-type">{e.eventType}</span>
                <span className="event-time">
                  {new Date(e.createdAt).toLocaleString()}
                </span>
              </div>
              {e.note ? <div className="timeline-note">{e.note}</div> : null}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const QUICK_EVENTS = ["Picked Up", "In Transit", "Arrived", "Delivered", "Issue", "Cancelled"];

export default function App() {
  const [parcels, setParcels] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [events, setEvents] = useState([]);
  const [carrierLocation, setCarrierLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // For demo purposes (no auth wired in this web UI)
  const [actingUserId, setActingUserId] = useState("driver1");

  async function loadParcels() {
    setLoading(true);
    setError(null);
    try {
      const list = await apiGet("/api/parcels");
      setParcels(list);
      if (!selectedId && list.length) {
        setSelectedId(list[0].id);
      }
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function loadSelected(parcelId) {
    if (!parcelId) return;
    setError(null);
    try {
      const p = await apiGet(`/api/parcels/${parcelId}`);
      setSelected(p);
      const ev = await apiGet(`/api/parcels/${parcelId}/tracking-events`);
      setEvents(ev);
      const loc = await apiGet(`/api/parcels/${parcelId}/carrier-location`);
      setCarrierLocation(loc);
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  useEffect(() => {
    loadParcels();
  }, []);

  useEffect(() => {
    loadSelected(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const timer = setInterval(() => {
      loadSelected(selectedId);
    }, 10000);
    return () => clearInterval(timer);
  }, [selectedId]);

  const mapCenter = useMemo(() => {
    if (!selected) return [0, 0];
    if (selected.destinationLat && selected.destinationLng) return [selected.destinationLat, selected.destinationLng];
    if (selected.originLat && selected.originLng) return [selected.originLat, selected.originLng];
    return [0, 0];
  }, [selected]);

  const showMap = !!selected?.liveTrackingEnabled;

  async function toggleTracking(field, value) {
    if (!selected) return;
    setError(null);
    try {
      const updated = await apiPatch(`/api/parcels/${selected.id}`, { [field]: value });
      setSelected(updated);
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  async function addQuickEvent(eventType) {
    if (!selected) return;
    setError(null);
    try {
      await apiPost(`/api/parcels/${selected.id}/tracking-events`, {
        eventType,
        createdByUserId: actingUserId,
        note: eventType === "Issue" ? "Please contact support" : null,
      });
      await loadSelected(selected.id);
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  return (
    <div className="page" data-testid="tracking-page">
      <header className="topbar">
        <div>
          <div className="title">Parcel Tracking</div>
          <div className="subtitle">
            Manual status + Live GPS (OSM). After acceptance you can update events, toggle tracking, and view the driver on map.
          </div>
        </div>
        <button className="btn" onClick={loadParcels} data-testid="refresh-parcels-button">
          Refresh
        </button>
      </header>

      {error ? (
        <div className="alert" data-testid="error-alert">
          {error}
        </div>
      ) : null}

      <div className="grid">
        <aside className="panel" data-testid="parcel-list-panel">
          <div className="panel-header">
            <div className="panel-title">Parcels</div>
            {loading ? <div className="muted">Loading…</div> : null}
          </div>

          <div className="list" data-testid="parcel-list">
            {parcels.length === 0 ? (
              <div className="muted" data-testid="parcel-list-empty">
                No parcels yet.
              </div>
            ) : (
              parcels.map((p) => (
                <button
                  key={p.id}
                  className={`list-item ${p.id === selectedId ? "active" : ""}`}
                  onClick={() => setSelectedId(p.id)}
                  data-testid={`parcel-list-item-${p.id}`}
                >
                  <div className="list-item-title">
                    <span className="mono">{p.id.slice(0, 8)}</span>
                    <StatusPill status={p.status} />
                  </div>
                  <div className="list-item-sub">
                    {p.origin} → {p.destination}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="panel" data-testid="parcel-detail-panel">
          {!selected ? (
            <div className="muted" data-testid="parcel-detail-empty">
              Select a parcel.
            </div>
          ) : (
            <>
              <div className="panel-header">
                <div>
                  <div className="panel-title">Parcel</div>
                  <div className="muted">
                    ID: <span className="mono">{selected.id}</span>
                  </div>
                </div>
                <div className="right">
                  <div className="muted">Acting user</div>
                  <input
                    data-testid="acting-user-id-input"
                    className="input"
                    value={actingUserId}
                    onChange={(e) => setActingUserId(e.target.value)}
                  />
                </div>
              </div>

              <div className="cards">
                <section className="card" data-testid="tracking-switches-card">
                  <div className="card-title">Tracking</div>
                  <ToggleRow
                    testId="manual-tracking-toggle"
                    label="Manual tracking"
                    description="Enable status timeline updates (Picked Up → In Transit → Arrived → Delivered + Issue/Cancelled)."
                    value={selected.manualTrackingEnabled}
                    onChange={(v) => toggleTracking("manualTrackingEnabled", v)}
                  />
                  <ToggleRow
                    testId="live-tracking-toggle"
                    label="Live GPS tracking"
                    description="Enable carrier live location pings and show them on the map."
                    value={selected.liveTrackingEnabled}
                    onChange={(v) => toggleTracking("liveTrackingEnabled", v)}
                  />
                </section>

                <section className="card" data-testid="manual-events-card">
                  <div className="card-title">Manual status updates</div>
                  {!selected.manualTrackingEnabled ? (
                    <div className="alert" data-testid="manual-tracking-disabled-alert">
                      Manual tracking is disabled for this parcel.
                    </div>
                  ) : (
                    <div className="quick-actions" data-testid="manual-events-actions">
                      {QUICK_EVENTS.map((t) => (
                        <button
                          key={t}
                          className="btn secondary"
                          onClick={() => addQuickEvent(t)}
                          data-testid={`manual-event-${t.replace(/\s/g, "-").toLowerCase()}-button`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="spacer" />
                  <Timeline events={events} />
                </section>

                <section className="card" data-testid="map-card">
                  <div className="card-title">Map</div>

                  {!showMap ? (
                    <div className="alert" data-testid="live-tracking-disabled-alert">
                      Live GPS tracking is disabled for this parcel. Enable it to view the map.
                    </div>
                  ) : (
                    <div className="map-wrap" data-testid="osm-map-container">
                      <MapContainer center={mapCenter} zoom={12} scrollWheelZoom={true} style={{ height: 360, width: "100%" }}>
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {selected.originLat && selected.originLng ? (
                          <Marker position={[selected.originLat, selected.originLng]}>
                            <Popup>Origin: {selected.origin}</Popup>
                          </Marker>
                        ) : null}

                        {selected.destinationLat && selected.destinationLng ? (
                          <Marker position={[selected.destinationLat, selected.destinationLng]}>
                            <Popup>Destination: {selected.destination}</Popup>
                          </Marker>
                        ) : null}

                        {carrierLocation ? (
                          <Marker position={[carrierLocation.lat, carrierLocation.lng]}>
                            <Popup>
                              Carrier: {carrierLocation.carrierId}
                              <br />
                              Updated: {new Date(carrierLocation.timestamp).toLocaleTimeString()}
                            </Popup>
                          </Marker>
                        ) : (
                          <div className="muted" data-testid="carrier-location-empty">
                            Waiting for carrier location…
                          </div>
                        )}

                        {selected.originLat && selected.originLng && selected.destinationLat && selected.destinationLng ? (
                          <Polyline
                            positions={[
                              [selected.originLat, selected.originLng],
                              [selected.destinationLat, selected.destinationLng],
                            ]}
                          />
                        ) : null}
                      </MapContainer>
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </main>
      </div>

      <footer className="footer">
        <div className="muted" data-testid="footer-note">
          Note: This web UI is a demo console. The mobile app (Expo) can continue to use the same /api routes.
        </div>
      </footer>
    </div>
  );
}
