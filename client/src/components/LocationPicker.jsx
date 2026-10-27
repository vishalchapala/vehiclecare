import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const INDIA = [20.5937, 78.9629]
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const CREDIT = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
// A drawn circle is used as the pin, so no image files are needed.
const PIN = { radius: 9, color: '#ffffff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }

/**
 * Map for choosing a point. Click the map to place the pin.
 * Pass value={{ lat, lng }} (or null) and onChange({ lat, lng }). Uses free OpenStreetMap tiles, no API key.
 * Without onChange it is a read-only map.
 */
export default function LocationPicker({ value, onChange, height = 300 }) {
  const box = useRef(null)
  const map = useRef(null)
  const pin = useRef(null)
  const handler = useRef(onChange)
  const lat = value?.lat
  const lng = value?.lng

  useEffect(() => {
    handler.current = onChange
  })

  // Create the map once.
  useEffect(() => {
    const m = L.map(box.current, { scrollWheelZoom: false }).setView(lat != null ? [lat, lng] : INDIA, lat != null ? 15 : 5)
    L.tileLayer(TILES, { maxZoom: 19, attribution: CREDIT }).addTo(m)
    m.on('click', (e) => handler.current && handler.current({ lat: e.latlng.lat, lng: e.latlng.lng }))
    map.current = m
    return () => {
      m.remove()
      map.current = null
      pin.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the pin in step with the value.
  useEffect(() => {
    const m = map.current
    if (!m) return
    if (lat == null || lng == null) {
      if (pin.current) pin.current.remove()
      pin.current = null
      return
    }
    if (pin.current) pin.current.setLatLng([lat, lng])
    else pin.current = L.circleMarker([lat, lng], PIN).addTo(m)
    m.setView([lat, lng], Math.max(m.getZoom(), 13))
  }, [lat, lng])

  return (
    <div className="relative z-0 overflow-hidden rounded-lg border border-slate-300">
      <div ref={box} style={{ height }} role="application" aria-label="Map" />
    </div>
  )
}
