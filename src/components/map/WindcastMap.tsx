import { MapContainer, TileLayer } from "react-leaflet";
import SpotMarkerLayer from "./SpotMarkerLayer";
import VelocityLayer from "./VelocityLayer";
import ClickForecastLayer from "./ClickForecastLayer";

export default function WindcastMap() {
  return (
    <MapContainer
      center={[28, -95]}
      zoom={6}
      scrollWheelZoom
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <VelocityLayer />
      <SpotMarkerLayer />
      <ClickForecastLayer />
    </MapContainer>
  );
}
