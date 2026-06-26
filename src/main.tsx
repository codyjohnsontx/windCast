import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";
import "leaflet/dist/leaflet.css";
import "leaflet-velocity/dist/leaflet-velocity.css";
import "./index.css";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Spots = lazy(() => import("./pages/Spots"));
const SpotDetail = lazy(() => import("./pages/SpotDetail"));
const SpotEdit = lazy(() => import("./pages/SpotEdit"));
const SpotNew = lazy(() => import("./pages/SpotNew"));
const SpotStations = lazy(() => import("./pages/SpotStations"));
const Settings = lazy(() => import("./pages/Settings"));
const Map = lazy(() => import("./pages/Map"));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-6 text-sm text-ink-muted">Loading…</div>}>
        <Routes>
          <Route element={<App />}>
            <Route index element={<Dashboard />} />
            <Route path="map" element={<Map />} />
            <Route path="spots" element={<Spots />} />
            <Route path="spots/new" element={<SpotNew />} />
            <Route path="spots/:id" element={<SpotDetail />} />
            <Route path="spots/:id/edit" element={<SpotEdit />} />
            <Route path="spots/:id/stations" element={<SpotStations />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>
);
