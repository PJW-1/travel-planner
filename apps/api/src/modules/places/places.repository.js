import { getDbPool } from "../../database/mysql.js";

function parseJsonValue(value, fallback) {
  if (!value) {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeProvider(value) {
  if (value === "kakao" || value === "google" || value === "internal") {
    return value;
  }

  return "internal";
}

function buildFallbackProviderUrl(place) {
  if (place.provider === "google" && place.provider_place_id) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      place.name,
    )}&query_place_id=${encodeURIComponent(place.provider_place_id)}`;
  }

  return "";
}

export async function getPlaceDetail(placeId) {
  const db = getDbPool();
  const query = `
    SELECT
      id,
      name,
      category,
      category_key,
      address,
      lat,
      lng,
      region,
      provider,
      provider_place_id,
      phone,
      website_url,
      provider_url,
      opening_hours_json,
      source_type,
      last_synced_at
    FROM places
    WHERE id = ?
    LIMIT 1
  `;
  const [rows] = await db.execute(query, [Number(placeId)]);
  let place = rows[0];

  if (!place && typeof placeId === "string" && placeId.trim()) {
    const [providerRows] = await db.execute(
      `
        SELECT
          id,
          name,
          category,
          category_key,
          address,
          lat,
          lng,
          region,
          provider,
          provider_place_id,
          phone,
          website_url,
          provider_url,
          opening_hours_json,
          source_type,
          last_synced_at
        FROM places
        WHERE provider_place_id = ?
        ORDER BY last_synced_at DESC, updated_at DESC, id DESC
        LIMIT 1
      `,
      [placeId.trim()],
    );
    place = providerRows[0];
  }

  if (!place) {
    return null;
  }

  return {
    id: String(place.id),
    name: place.name,
    category: place.category,
    categoryKey: place.category_key,
    address: place.address ?? "",
    lat: Number(place.lat),
    lng: Number(place.lng),
    region: place.region ?? "",
    provider: normalizeProvider(place.provider),
    providerPlaceId: place.provider_place_id ?? "",
    phone: place.phone ?? "",
    websiteUrl: place.website_url ?? "",
    providerUrl: place.provider_url || buildFallbackProviderUrl(place),
    openingHours: parseJsonValue(place.opening_hours_json, []),
    sourceType: place.source_type ?? "internal",
    lastSyncedAt: place.last_synced_at,
  };
}
