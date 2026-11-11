"use server"

import "server-only"
import { cache } from "react"
import { createClient } from "@supabase/supabase-js"

import {
  splitCategories,
  toDirectoryListing,
} from "@/lib/directory-listing"

function supabaseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "")
}

function db() {
  return createClient(supabaseUrl(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

function quotedIlike(value: string) {
  return `"%${value.replace(/"/g, "")}%"`
}

export async function getFilters() {
  const { data, error } = await db()
    .from("businesses")
    .select("primary_category, neighborhood, categories")
    .limit(1000)

  if (error || !data) {
    console.error("Error fetching filters:", error)
    return { categories: [], labels: [], tags: [] }
  }

  const categories = new Set<string>()
  const labels = new Set<string>()
  const tags = new Set<string>()

  for (const item of data) {
    if (item.primary_category) categories.add(item.primary_category)
    if (item.neighborhood) labels.add(item.neighborhood)
    splitCategories(item.categories).forEach((tag) => tags.add(tag))
  }

  return {
    categories: [...categories].sort((a, b) => a.localeCompare(b)),
    labels: [...labels].sort((a, b) => a.localeCompare(b)),
    tags: [...tags].sort((a, b) => a.localeCompare(b)).slice(0, 30),
  }
}

export const getProducts = cache(
  async (
    searchTerm?: string,
    category?: string,
    label?: string,
    tag?: string
  ) => {
    let query = db()
      .from("businesses")
      .select("*")
      .order("rating", { ascending: false, nullsFirst: false })
      .order("reviews_count", { ascending: false, nullsFirst: false })
      .limit(1000)

    const search = searchTerm?.trim()
    if (search) {
      const pattern = quotedIlike(search)
      query = query.or(
        [
          `name.ilike.${pattern}`,
          `neighborhood.ilike.${pattern}`,
          `primary_category.ilike.${pattern}`,
          `categories.ilike.${pattern}`,
          `address.ilike.${pattern}`,
          `phone.ilike.${pattern}`,
        ].join(",")
      )
    }

    if (category) {
      query = query.eq("primary_category", category)
    }

    if (label) {
      query = query.eq("neighborhood", label)
    }

    if (tag) {
      query = query.ilike("categories", `%${tag.replace(/%/g, "")}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error searching businesses:", error)
      return []
    }

    return (data || []).map(toDirectoryListing)
  }
)

export async function getProductById(id?: string) {
  if (!id) return []

  const numericId = Number(id)
  const lookup = Number.isFinite(numericId) ? numericId : id

  const { data, error } = await db()
    .from("businesses")
    .select("*")
    .eq("id", lookup)
    .maybeSingle()

  if (error) {
    console.error("Error fetching business:", error)
    return []
  }

  if (!data) return []

  return [toDirectoryListing(data)]
}

export async function incrementClickCount(_id: string) {
  return
}
