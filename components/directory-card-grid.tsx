"use client"

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { List, Map as MapIcon, MapPin } from "lucide-react"

import { cn } from "@/lib/utils"

import { ResourceCard, type DirectoryCardData } from "./directory-product-card"

const DirectoryMap = dynamic(() => import("./directory-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[420px] items-center justify-center bg-neutral-100 text-sm text-neutral-500 dark:bg-neutral-900">
      Loading map…
    </div>
  ),
})

export interface SEOCardGridProps {
  sortedData: DirectoryCardData[]
  filteredFeaturedData: DirectoryCardData[] | null
  mapEnabled?: boolean
  children?: React.ReactNode
}

export const ResourceCardGrid: React.FC<SEOCardGridProps> = ({
  sortedData,
  mapEnabled = false,
  children,
}) => {
  const pathname = usePathname()
  const [isDesktop, setIsDesktop] = useState(false)
  const [mobileMapOpen, setMobileMapOpen] = useState(false)
  const [visibleBusinessIds, setVisibleBusinessIds] =
    useState<Set<string> | null>(null)
  const [focusedBusinessId, setFocusedBusinessId] = useState<string | null>(
    null
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)")
    const updateDesktop = () => setIsDesktop(mediaQuery.matches)

    updateDesktop()
    mediaQuery.addEventListener("change", updateDesktop)
    return () => mediaQuery.removeEventListener("change", updateDesktop)
  }, [])

  const handleViewportChange = useCallback((businessIds: string[]) => {
    setVisibleBusinessIds(new Set(businessIds))
  }, [])

  const handleLocateBusiness = useCallback((businessId: string) => {
    setFocusedBusinessId(businessId)
    setMobileMapOpen(true)
  }, [])

  const visibleData = useMemo(
    () =>
      mapEnabled && visibleBusinessIds
        ? sortedData.filter((business) => visibleBusinessIds.has(business.id))
        : sortedData,
    [mapEnabled, sortedData, visibleBusinessIds]
  )

  const mapElement =
    mapEnabled && (isDesktop || mobileMapOpen) ? (
      <DirectoryMap
        businesses={sortedData}
        focusedBusinessId={focusedBusinessId}
        onViewportChange={handleViewportChange}
      />
    ) : null

  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 overflow-hidden pb-4 md:mx-4 mx-0 md:ml-[12rem] lg:ml-[12rem]",
        mapEnabled ? "w-auto" : "md:items-start"
      )}
    >
      <div
        className={cn(
          "px-4",
          pathname.includes("/products")
            ? "md:p-4 md:gap-3"
            : "bg-white p-4 gap-3 dark:bg-[#1E1E1E] rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)]",
          mapEnabled && "w-full"
        )}
      >
        {children}
      </div>

      <div
        className={cn(
          "min-w-0",
          mapEnabled && isDesktop
            ? "grid grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start gap-5"
            : "block"
        )}
      >
        <div
          className={cn(
            "min-w-0 p-4",
            pathname.includes("/products")
              ? ""
              : "bg-white dark:bg-[#1E1E1E] rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)]",
            mapEnabled && !isDesktop && mobileMapOpen && "hidden"
          )}
        >
          <Suspense fallback={<div>Loading...</div>}>
            <div className="relative">
              <TailwindMasonryGrid
                filteredData={visibleData}
                onLocateBusiness={mapEnabled ? handleLocateBusiness : undefined}
              />
            </div>
          </Suspense>
          {mapEnabled && visibleData.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-neutral-500">
              No businesses with map coordinates are visible here. Pan or zoom
              the map to find listings.
            </p>
          )}
        </div>

        {mapEnabled && isDesktop && (
          <aside className="sticky top-24 h-[calc(100vh-7rem)] min-h-[520px] overflow-hidden rounded-3xl border border-neutral-200 shadow-lg dark:border-neutral-700">
            {mapElement}
          </aside>
        )}
      </div>

      {mapEnabled && !isDesktop && mobileMapOpen && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-neutral-950">
          {mapElement}
        </div>
      )}

      {mapEnabled && !isDesktop && (
        <button
          type="button"
          onClick={() => setMobileMapOpen((open) => !open)}
          className="fixed bottom-6 left-1/2 z-[70] inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-xl transition hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-white dark:text-neutral-900"
          aria-label={mobileMapOpen ? "Show listings" : "Show map"}
        >
          {mobileMapOpen ? (
            <>
              <List aria-hidden="true" className="size-4" />
              List
            </>
          ) : (
            <>
              <MapIcon aria-hidden="true" className="size-4" />
              Map
            </>
          )}
        </button>
      )}
    </div>
  )
}

interface TailwindMasonryGridProps {
  filteredData: DirectoryCardData[]
  onLocateBusiness?: (businessId: string) => void
}

const TailwindMasonryGrid: React.FC<TailwindMasonryGridProps> = ({
  filteredData,
  onLocateBusiness,
}) => {
  return (
    <div className="flex justify-center w-full">
      <div className="gap-4 w-full ">
        <div className="columns-1 lg:columns-2 xl:columns-3 2xl:columns-4 3xl:columns-4 space-y-3 w-full  ">
          {filteredData &&
            filteredData.map((data, index) => (
              <div key={`${index}-${data.id}`} className="">
                <ResourceCard
                  data={data}
                  order={index}
                  onLocate={onLocateBusiness}
                />
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export const FeaturedGrid: React.FC<{
  featuredData: DirectoryCardData[]
}> = ({ featuredData }) => {
  return (
    <div className="w-full mx-auto max-w-7xl bg-neutral-50/40 dark:bg-neutral-950/40 border border-dashed border-black/10 py-3 px-3 rounded-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {featuredData.map((data, index) => (
          <ResourceCard trim={true} data={data} order={index} />
        ))}
      </div>
    </div>
  )
}

export const EmptyFeaturedGrid = () => {
  const emptyData = [
    {
      codename: "Join the cult",
      punchline: "Next.j, Supabase & Tailwind Starters",
      product_website: "https://newcult.co",
      description:
        "Check out newcult.co for the premium version of this template",
      logo_src: "/ad-placeholder-metrics.png",
      tags: ["featured"],
      labels: ["featured-ad"],
    },
    {
      codename: "To get Admin Dashboard",
      product_website: "https://newcult.co",
      punchline: "Next.j, Supabase & Tailwind Starters",
      description:
        "Join the cult and get access to the admin dashboard for this template.",
      logo_src: "/ad-placeholder-1.png",
      tags: ["featured"],
      labels: ["featured-ad"],
    },
    {
      codename: "And AI scripts",
      product_website: "https://newcult.co",
      punchline: "Next.j, Supabase & Tailwind Starters",
      description:
        "Includes AI scripts to quickly add new products to your directory..",
      logo_src: "/ad-placeholder-tags.png",
      tags: ["featured"],
      labels: ["featured-ad"],
    },
  ]

  return (
    <div className="w-full mx-auto max-w-7xl  bg-black/20 dark:bg-neutral-950/40 border border-dashed border-black/10 py-3 px-3 rounded-[1.9rem]">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {emptyData.map((data, index) => (
          <Link
            href="https://newcult.co"
            target="_blank"
            rel="noreferrer noopener"
            key={`featured-${index}-${data.codename}`}
            className="md:py-0 "
          >
            {/* @ts-expect-error */}
            <ResourceCard trim={true} data={data} order={index} />
          </Link>
        ))}
      </div>
    </div>
  )
}
