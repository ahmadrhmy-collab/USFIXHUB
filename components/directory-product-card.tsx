"use client"

import { useOptimistic } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ExternalLink,
  MapPin,
  MapPinned,
  Navigation,
  Phone,
} from "lucide-react"

import { cn } from "@/lib/utils"
import MinimalCard, {
  MinimalCardContent,
  MinimalCardDescription,
  MinimalCardImage,
  MinimalCardTitle,
} from "@/components/cult/minimal-card"
import { incrementClickCount } from "@/app/actions/product"

export interface DirectoryCardData {
  id: string
  created_at: string
  full_name: string
  email: string
  twitter_handle: string
  product_website: string
  codename: string
  punchline: string
  description: string
  logo_src: string
  user_id: string
  tags: string[]
  view_count: number
  approved: boolean
  labels: string[]
  categories: string
  phone?: string
  address?: string
  neighborhood?: string
  google_maps_url?: string | null
  latitude?: number | null
  longitude?: number | null
}

export const getBasePath = (url: string) => {
  return new URL(url).hostname.replace("www.", "").split(".")[0]
}

export const getLastPathSegment = (url: string, maxLength: number): string => {
  try {
    const pathname = new URL(url).pathname
    const segments = pathname.split("/").filter(Boolean)
    const lastSegment = segments.pop() || ""

    if (lastSegment.length > maxLength) {
      return `/${lastSegment.substring(0, maxLength)}`
    }

    return lastSegment ? `/${lastSegment}` : ""
  } catch (error) {
    console.error("Invalid URL:", error)
    return ""
  }
}

export const ResourceCard: React.FC<{
  trim?: boolean
  data: DirectoryCardData
  order: number
  onLocate?: (businessId: string) => void
}> = ({ trim, data, order, onLocate }) => {
  const [optimisticResource, addOptimisticUpdate] = useOptimistic<
    DirectoryCardData,
    Partial<DirectoryCardData>
  >(data, (currentResource, newProperties) => {
    return { ...currentResource, ...newProperties }
  })

  const directionsUrl =
    data.google_maps_url ||
    (data.latitude != null && data.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${data.latitude},${data.longitude}`
      : null)
  const mapUrl =
    data.google_maps_url ||
    (data.latitude != null && data.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`
      : null)
  const hasCoordinates =
    typeof data.latitude === "number" &&
    Number.isFinite(data.latitude) &&
    data.latitude >= -90 &&
    data.latitude <= 90 &&
    typeof data.longitude === "number" &&
    Number.isFinite(data.longitude) &&
    data.longitude >= -180 &&
    data.longitude <= 180

  const handleClick = () => {
    const newClickCount = (optimisticResource.view_count || 0) + 1
    addOptimisticUpdate({ view_count: newClickCount })
    incrementClickCount(data.id)
  }

  return (
    <motion.div
      key={`resource-card-${data.id}-${order}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative  break-inside-avoid w-full"
    >
      <div className="w-full">
        <MinimalCard
          className={cn(
            optimisticResource.view_count > 350
              ? " text-neutral-900 hover:bg-[#666BFA] "
              : "",
            "w-full"
          )}
        >
          <Link
            href={`/products/${data.id}`}
            className="block rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={(event) => {
              if (onLocate && hasCoordinates) {
                event.preventDefault()
                handleClick()
                onLocate(data.id)
                return
              }
              handleClick()
            }}
          >
            {data.logo_src ? (
              <MinimalCardImage alt={data.codename} src={data.logo_src} />
            ) : null}

            <MinimalCardTitle
              className={cn(
                "font-semibold mb-0.5",
                optimisticResource.view_count > 100 ? "text-neutral-800" : ""
              )}
            >
              {data.codename.substring(0, 30)}
            </MinimalCardTitle>
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs leading-3 mb-2 text-neutral-500 px-1"
            >
              {getLastPathSegment(data.product_website, 10)}
            </motion.p>
            {!(data.address || data.neighborhood) && (
              <MinimalCardDescription
                className={cn(
                  "text-sm",
                  optimisticResource.view_count > 100 ? "text-neutral-700" : ""
                )}
              >
                {trim
                  ? `${data.description.slice(0, 82)}...`
                  : data.description}
              </MinimalCardDescription>
            )}
            {(data.address || data.neighborhood) && (
              <MinimalCardContent className="space-y-1 px-1 pb-1 pt-0">
                {data.address && (
                  <p className="flex items-start gap-2 text-sm leading-5 text-neutral-600 dark:text-neutral-300">
                    <MapPin
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-neutral-400"
                    />
                    <span>{data.address}</span>
                  </p>
                )}
                {data.neighborhood && (
                  <p className="pl-6 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {data.neighborhood}
                  </p>
                )}
              </MinimalCardContent>
            )}
          </Link>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200/70 px-1 pt-3 dark:border-neutral-700/70">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {optimisticResource.view_count || data.view_count} views
            </p>
            <div className="flex flex-wrap gap-2">
              {onLocate && hasCoordinates && (
                <button
                  type="button"
                  onClick={() => onLocate(data.id)}
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-neutral-300 px-3 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
                >
                  <MapPinned aria-hidden="true" className="size-3.5" />
                  Locate
                </button>
              )}
              {data.phone && (
                <a
                  href={`tel:${data.phone}`}
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-neutral-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                >
                  <Phone aria-hidden="true" className="size-3.5" />
                  Call
                </a>
              )}
              {directionsUrl && (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-neutral-300 px-3 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
                >
                  <Navigation aria-hidden="true" className="size-3.5" />
                  Directions (جهت‌یابی)
                </a>
              )}
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-neutral-300 px-3 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
                >
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                  Show on Map (نمایش روی نقشه)
                </a>
              )}
            </div>
          </div>
        </MinimalCard>
      </div>
    </motion.div>
  )
}
