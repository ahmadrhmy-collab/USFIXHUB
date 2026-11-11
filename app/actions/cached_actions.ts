"use server"

import "server-only"
import { unstable_cache } from "next/cache"
import { createClient } from "@supabase/supabase-js"

import { splitCategories, toDirectoryListing } from "@/lib/directory-listing"

type FilterData = {
  categories: string[]
  labels: string[]
  tags: string[]
}

function supabaseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "")
}

const client = createClient(
  supabaseUrl(),
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getFilters(): Promise<FilterData> {
  const { data, error } = await client
    .from("businesses")
    .select("primary_category, neighborhood, categories")
    .limit(1000)

  if (error || !data) {
    console.error("Error fetching filters:", error)
    return { categories: [], labels: [], tags: [] }
  }

  const categories = new Set<string>()
  const labels = new Set<string>()
  const tagCounts = new Map<string, number>()

  for (const item of data) {
    if (item.primary_category) categories.add(item.primary_category)
    if (item.neighborhood) labels.add(item.neighborhood)

    for (const tag of splitCategories(item.categories)) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    }
  }

  const tags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 30)
    .map(([tag]) => tag)

  return {
    categories: [...categories].sort((a, b) => a.localeCompare(b)),
    labels: [...labels].sort((a, b) => a.localeCompare(b)),
    tags,
  }
}

async function getBusinessesData() {
  const { data, error } = await client
    .from("businesses")
    .select("*")
    .order("rating", { ascending: false, nullsFirst: false })
    .order("reviews_count", { ascending: false, nullsFirst: false })
    .limit(1000)

  if (error) {
    console.error("Error fetching businesses:", error)
    return []
  }

  return (data || []).map(toDirectoryListing)
}

export const getCachedFilters = unstable_cache(
  async () => getFilters(),
  ["businesses-filters-v2"],
  { revalidate: 3600, tags: ["filters"] }
)

export const getCachedBusinesses = unstable_cache(
  async () => getBusinessesData(),
  ["businesses-directory-v2"],
  { revalidate: 3600, tags: ["businesses"] }
)

export const getCachedPosts = getCachedBusinesses
export const getCachedTools = getCachedBusinesses
export const getCachedResources = getCachedBusinesses
export const getData = getCachedBusinesses
