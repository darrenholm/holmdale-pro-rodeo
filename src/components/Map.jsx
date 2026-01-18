import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
});

export default function Map() {
  const position = [44.196180, -81.169319]; // 588 Sideroad 10 S., Walkerton, ON

  return (
    <MapContainer 
      center={position} 
      zoom={15} 
      className="h-80 w-full"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={position}>
        <Popup>
          <div className="text-sm">
            <p className="font-semibold">Holmdale Pro Rodeo</p>
            <p>588 Sideroad 10 S.</p>
            <p>Walkerton, ON</p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}