"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"

import "leaflet.markercluster"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import type { DirectoryCardData } from "./directory-product-card"

interface DirectoryMapProps {
  businesses: DirectoryCardData[]
  focusedBusinessId: string | null
  onViewportChange: (businessIds: string[]) => void
}

function hasCoordinates(
  business: DirectoryCardData
): business is DirectoryCardData & {
  latitude: number
  longitude: number
} {
  return (
    typeof business.latitude === "number" &&
    Number.isFinite(business.latitude) &&
    business.latitude >= -90 &&
    business.latitude <= 90 &&
    typeof business.longitude === "number" &&
    Number.isFinite(business.longitude) &&
    business.longitude >= -180 &&
    business.longitude <= 180
  )
}

function createClusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount()
  const size = count < 10 ? "small" : count < 100 ? "medium" : "large"

  return L.divIcon({
    html: `<span>${count}</span>`,
    className: `directory-map-cluster directory-map-cluster-${size}`,
    iconSize: L.point(44, 44),
  })
}

export default function DirectoryMap({
  businesses,
  focusedBusinessId,
  onViewportChange,
}: DirectoryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  useEffect(() => {
    if (!containerRef.current) return

    const map = L.map(containerRef.current, {
      center: [34.0522, -118.2437],
      zoom: 11,
      scrollWheelZoom: true,
    })
    mapRef.current = map

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    const clusters = L.markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: createClusterIcon,
    })
    const markers = new Map<string, L.Marker>()
    const clusterMarkers: L.Marker[] = []

    for (const business of businesses) {
      if (!hasCoordinates(business)) continue

      const marker = L.marker([business.latitude, business.longitude], {
        icon: L.divIcon({
          className: "directory-map-marker",
          html: '<span class="directory-map-marker-dot"></span>',
          iconSize: L.point(22, 22),
          iconAnchor: L.point(11, 11),
        }),
        title: business.codename,
        alt: business.codename,
      })

      const popup = document.createElement("div")
      popup.className = "directory-map-popup"
      const title = document.createElement("a")
      title.href = `/products/${encodeURIComponent(business.id)}`
      title.className = "directory-map-popup-title"
      title.textContent = business.codename
      popup.append(title)

      if (business.address) {
        const address = document.createElement("p")
        address.textContent = business.address
        popup.append(address)
      }

      if (business.neighborhood) {
        const neighborhood = document.createElement("p")
        neighborhood.className = "directory-map-popup-neighborhood"
        neighborhood.textContent = business.neighborhood
        popup.append(neighborhood)
      }

      if (business.phone) {
        const phone = document.createElement("a")
        phone.className = "directory-map-popup-action"
        phone.href = `tel:${business.phone}`
        phone.textContent = business.phone
        popup.append(phone)
      }

      const directions = document.createElement("a")
      directions.className = "directory-map-popup-action"
      directions.href = `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`
      directions.target = "_blank"
      directions.rel = "noreferrer noopener"
      directions.textContent = "Get directions"
      popup.append(directions)

      marker.bindPopup(popup)
      clusterMarkers.push(marker)
      markers.set(business.id, marker)
    }
    clusters.addLayers(clusterMarkers)
    map.addLayer(clusters)
    clusterGroupRef.current = clusters
    markersRef.current = markers

    const reportViewport = () => {
      const bounds = map.getBounds()
      onViewportChange(
        businesses
          .filter(
            (business) =>
              hasCoordinates(business) &&
              bounds.contains([business.latitude, business.longitude])
          )
          .map((business) => business.id)
      )
    }

    map.on("moveend", reportViewport)
    reportViewport()

    return () => {
      map.off("moveend", reportViewport)
      map.remove()
      mapRef.current = null
      clusterGroupRef.current = null
      markersRef.current.clear()
    }
  }, [businesses, onViewportChange])

  useEffect(() => {
    if (!focusedBusinessId || !mapRef.current) return
    const marker = markersRef.current.get(focusedBusinessId)
    const clusters = clusterGroupRef.current
    if (!marker || !clusters) return

    const map = mapRef.current
    clusters.zoomToShowLayer(marker, () => {
      map.flyTo(marker.getLatLng(), 15, {
        animate: true,
        duration: 0.8,
      })
      marker.openPopup()
    })
  }, [focusedBusinessId])

  return (
    <div
      ref={containerRef}
      className="directory-map h-full min-h-[420px] w-full bg-neutral-100 dark:bg-neutral-900"
      aria-label="Map of directory businesses"
    />
  )
}
