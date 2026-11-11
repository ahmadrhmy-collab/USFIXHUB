import { Suspense } from "react"

import type { DirectoryListing } from "@/lib/directory-listing"
import { FadeIn } from "@/components/cult/fade-in"
import { DirectorySearch } from "@/components/directory-search"
import { Hero } from "@/components/hero"

import {
  EmptyFeaturedGrid,
  FeaturedGrid,
  ResourceCardGrid,
} from "../components/directory-card-grid"
import { NavSidebar } from "../components/nav"
import { getCachedBusinesses, getCachedFilters } from "./actions/cached_actions"

type DirectorySearchParams = {
  search?: string | string[]
  category?: string | string[]
  label?: string | string[]
  tag?: string | string[]
}

function firstParam(value?: string | string[]) {
  const raw = Array.isArray(value) ? value[0] : value
  return raw?.trim() || ""
}

function matchesSearch(business: DirectoryListing, term: string) {
  const haystack = [
    business.codename,
    business.neighborhood,
    business.categories,
    business.address,
    business.phone,
    business.tags.join(" "),
  ]
    .join(" ")
    .toLowerCase()

  return haystack.includes(term)
}

async function Page({
  searchParams,
}: {
  searchParams: Promise<DirectorySearchParams>
}) {
  const params = await searchParams
  const allBusinesses = await getCachedBusinesses()
  const filters = await getCachedFilters()

  const searchTerm = firstParam(params.search).toLowerCase()
  const category = firstParam(params.category)
  const label = firstParam(params.label)
  const tag = firstParam(params.tag).toLowerCase()

  const data = allBusinesses.filter((business) => {
    if (searchTerm && !matchesSearch(business, searchTerm)) return false
    if (category && business.categories !== category) return false
    if (label && !business.labels.includes(label)) return false
    if (tag && !business.tags.some((item) => item.toLowerCase() === tag)) {
      return false
    }
    return true
  })

  const filteredFeaturedData = data.slice(0, 3)

  return (
    <>
      <NavSidebar
        categories={filters.categories}
        labels={filters.labels}
        tags={filters.tags}
      />

      <div className="max-w-full px-2 md:pl-4 md:pr-0 pt-2">
        <FadeIn>
          <ResourceCardGrid
            sortedData={data}
            filteredFeaturedData={filteredFeaturedData}
            mapEnabled
          >
            <div className="grid grid-cols-1 xl:grid-cols-6 lg:gap-16 pb-8 pt-8 relative">
              <div className="col-span-1 md:col-span-2 z-10">
                <Hero>
                  <DirectorySearch />
                </Hero>
              </div>

              <div className="col-span-1 md:col-span-4 mt-6 md:mt-0">
                {filteredFeaturedData.length >= 1 ? (
                  <Suspense fallback={<div>Loading...</div>}>
                    <div className="relative">
                      <FeaturedGrid featuredData={filteredFeaturedData} />
                    </div>
                  </Suspense>
                ) : (
                  <div className="relative">
                    <EmptyFeaturedGrid />
                  </div>
                )}
              </div>
            </div>
          </ResourceCardGrid>
        </FadeIn>
      </div>
    </>
  )
}

export default Page
