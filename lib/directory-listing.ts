export type DirectoryListing = {
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
  rating: number | null
  reviews_count: number
  neighborhood: string
  phone: string
  address: string
  latitude: number | null
  longitude: number | null
  google_maps_url: string | null
}

function toCoordinate(value: number | string | null | undefined) {
  if (value == null || value === "") return null

  const coordinate = Number(value)
  return Number.isFinite(coordinate) ? coordinate : null
}

export function splitCategories(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }

  if (typeof value !== "string") return []

  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
}

export function toDirectoryListing(business: {
  id: string | number
  created_at?: string | null
  name?: string | null
  website?: string | null
  google_maps_url?: string | null
  neighborhood?: string | null
  city?: string | null
  address?: string | null
  phone?: string | null
  latitude?: number | string | null
  longitude?: number | string | null
  rating?: number | string | null
  reviews_count?: number | string | null
  image_url?: string | null
  primary_category?: string | null
  categories?: string | string[] | null
}): DirectoryListing {
  const tags = splitCategories(business.categories)
  const reviews = Number(business.reviews_count) || 0
  const ratingValue = Number(business.rating)
  const rating = Number.isFinite(ratingValue) ? ratingValue : null
  const ratingLabel = rating === null ? "No rating" : `${rating.toFixed(1)}★`
  const neighborhood = business.neighborhood || business.city || "Los Angeles"
  const website =
    business.website || business.google_maps_url || "https://maps.google.com"

  return {
    id: String(business.id),
    created_at: business.created_at ?? "",
    full_name: business.name || "Repair shop",
    email: "",
    twitter_handle: "",
    product_website: website,
    codename: business.name || "Repair shop",
    punchline: `${ratingLabel} · ${neighborhood}`,
    description: [
      business.address || neighborhood,
      `${ratingLabel} (${reviews} reviews)`,
      business.phone || "Call for hours",
    ].join(" · "),
    logo_src: business.image_url || "",
    user_id: "",
    tags,
    view_count: reviews,
    approved: true,
    labels: business.neighborhood ? [business.neighborhood] : [],
    categories: business.primary_category || tags[0] || "Repair",
    rating,
    reviews_count: reviews,
    neighborhood: business.neighborhood || "",
    phone: business.phone || "",
    address: business.address || "",
    latitude: toCoordinate(business.latitude),
    longitude: toCoordinate(business.longitude),
    google_maps_url: business.google_maps_url || null,
  }
}
