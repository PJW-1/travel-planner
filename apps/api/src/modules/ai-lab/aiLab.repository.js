import { getDbPool } from "../../database/mysql.js";

function mapTravelRegionLabel(region) {
  switch (region) {
    case "japan":
      return "일본";
    case "southeast_asia":
      return "동남아";
    case "europe":
      return "유럽";
    case "america":
      return "미국";
    case "greater_china":
      return "중화권";
    case "oceania":
      return "오세아니아";
    case "korea":
    default:
      return "대한민국";
  }
}

async function getNextId(connection, tableName) {
  const [rows] = await connection.execute(
    `SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM ${tableName}`,
  );

  return Number(rows[0]?.nextId ?? 1);
}

async function findExistingPlace(connection, name, address) {
  const [rows] = await connection.execute(
    `
      SELECT id, name, address, lat, lng, category, category_key, region
      FROM places
      WHERE name = ? AND (address <=> ?)
      LIMIT 1
    `,
    [name, address ?? null],
  );

  return rows[0] ?? null;
}

async function createPlace(connection, place) {
  const nextId = await getNextId(connection, "places");

  await connection.execute(
    `
      INSERT INTO places (
        id,
        name,
        category,
        category_key,
        address,
        lat,
        lng,
        region,
        source_type,
        thumbnail_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ai-lab', NULL)
    `,
    [
      nextId,
      place.name,
      place.category ?? "추천 장소",
      place.categoryKey ?? "activity",
      place.address ?? null,
      place.lat,
      place.lng,
      place.region ?? "기타",
    ],
  );

  return {
    id: nextId,
    ...place,
  };
}

async function ensurePlace(connection, place) {
  const existingPlace = await findExistingPlace(connection, place.name, place.address);

  if (existingPlace) {
    return existingPlace;
  }

  return createPlace(connection, place);
}

export async function createVideoExtraction({
  userId,
  youtubeUrl,
  videoTitle,
  status = "processing",
}) {
  const db = getDbPool();
  const extractionId = await getNextId(db, "video_extractions");

  await db.execute(
    `
      INSERT INTO video_extractions (
        id,
        user_id,
        youtube_url,
        status,
        video_title,
        requested_at,
        completed_at
      )
      VALUES (?, ?, ?, ?, ?, NOW(), NULL)
    `,
    [extractionId, userId, youtubeUrl, status, videoTitle],
  );

  return extractionId;
}

export async function completeVideoExtraction(extractionId, status = "completed") {
  const db = getDbPool();
  await db.execute(
    `
      UPDATE video_extractions
      SET status = ?, completed_at = NOW()
      WHERE id = ?
    `,
    [status, extractionId],
  );
}

export async function failVideoExtraction(extractionId) {
  await completeVideoExtraction(extractionId, "failed");
}

export async function saveExtractedPlaces(extractionId, places) {
  if (!Array.isArray(places) || places.length === 0) {
    return [];
  }

  const db = getDbPool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const savedPlaces = [];

    for (const place of places) {
      const persistedPlace = await ensurePlace(connection, {
        name: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        region: place.region,
        category: place.category,
        categoryKey: place.categoryKey,
      });

      const extractionPlaceId = await getNextId(connection, "video_extracted_places");

      await connection.execute(
        `
          INSERT INTO video_extracted_places (
            id,
            video_extraction_id,
            place_id,
            raw_place_name,
            confidence_score,
            matched_lat,
            matched_lng,
            is_saved,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, NOW())
        `,
        [
          extractionPlaceId,
          extractionId,
          persistedPlace.id,
          place.rawPlaceName ?? place.name,
          place.confidenceScore ?? 0.7,
          place.lat,
          place.lng,
        ],
      );

      savedPlaces.push({
        id: extractionPlaceId,
        placeId: String(persistedPlace.id),
        name: persistedPlace.name,
        address: persistedPlace.address ?? "",
        lat: Number(persistedPlace.lat),
        lng: Number(persistedPlace.lng),
        confidenceScore: Number(place.confidenceScore ?? 0.7),
        isSaved: false,
      });
    }

    await connection.commit();

    return savedPlaces;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function groupPlacesByExtraction(extractions, placeRows) {
  const placesByExtractionId = new Map();

  placeRows.forEach((row) => {
    const current = placesByExtractionId.get(row.video_extraction_id) ?? [];
    current.push({
      id: String(row.id),
      placeId: String(row.place_id),
      name: row.place_name,
      rawPlaceName: row.raw_place_name,
      address: row.address ?? "",
      lat: Number(row.matched_lat),
      lng: Number(row.matched_lng),
      confidenceScore: Number(row.confidence_score),
      isSaved: Boolean(row.is_saved),
      region: row.region ?? "",
    });
    placesByExtractionId.set(row.video_extraction_id, current);
  });

  return extractions.map((extraction) => ({
    id: String(extraction.id),
    youtubeUrl: extraction.youtube_url,
    videoTitle: extraction.video_title,
    status: extraction.status,
    requestedAt: extraction.requested_at,
    completedAt: extraction.completed_at,
    places: placesByExtractionId.get(extraction.id) ?? [],
  }));
}

export async function getAiLabOverview(userId) {
  const db = getDbPool();
  const [extractionRows] = await db.execute(
    `
      SELECT
        id,
        youtube_url,
        video_title,
        status,
        requested_at,
        completed_at
      FROM video_extractions
      WHERE user_id = ?
      ORDER BY requested_at DESC, id DESC
      LIMIT 6
    `,
    [userId],
  );

  if (extractionRows.length === 0) {
    return {
      extractedPlaces: [],
      extractions: [],
    };
  }

  const extractionIds = extractionRows.map((row) => row.id);
  const placeholders = extractionIds.map(() => "?").join(", ");

  const [placeRows] = await db.execute(
    `
      SELECT
        vep.id,
        vep.video_extraction_id,
        vep.place_id,
        vep.raw_place_name,
        vep.confidence_score,
        vep.matched_lat,
        vep.matched_lng,
        vep.is_saved,
        p.name AS place_name,
        p.address,
        p.region
      FROM video_extracted_places vep
      INNER JOIN places p ON p.id = vep.place_id
      WHERE vep.video_extraction_id IN (${placeholders})
      ORDER BY vep.video_extraction_id DESC, vep.id ASC
    `,
    extractionIds,
  );

  const extractions = groupPlacesByExtraction(extractionRows, placeRows);

  return {
    extractedPlaces: extractions[0]?.places.map((place) => place.name) ?? [],
    extractions,
  };
}

export async function getSavedAiPlaces(userId) {
  const db = getDbPool();
  const [rows] = await db.execute(
    `
      SELECT
        vep.id,
        vep.place_id,
        p.name,
        p.category_key,
        p.address,
        p.lat,
        p.lng,
        p.region,
        ve.video_title,
        ve.youtube_url,
        vep.created_at
      FROM video_extracted_places vep
      INNER JOIN video_extractions ve ON ve.id = vep.video_extraction_id
      INNER JOIN places p ON p.id = vep.place_id
      WHERE ve.user_id = ?
        AND vep.is_saved = TRUE
      ORDER BY vep.created_at DESC, vep.id DESC
      LIMIT 12
    `,
    [userId],
  );

  return rows.map((row) => ({
    id: String(row.id),
    placeId: String(row.place_id),
    title: row.name,
    categoryKey: row.category_key,
    address: row.address ?? "",
    lat: Number(row.lat),
    lng: Number(row.lng),
    region: row.region ?? "",
    sourceTitle: row.video_title,
    youtubeUrl: row.youtube_url,
    date: row.created_at,
  }));
}

export async function saveAiExtractedPlace(userId, extractedPlaceId) {
  const db = getDbPool();
  const [result] = await db.execute(
    `
      UPDATE video_extracted_places vep
      INNER JOIN video_extractions ve ON ve.id = vep.video_extraction_id
      SET vep.is_saved = TRUE
      WHERE vep.id = ? AND ve.user_id = ?
    `,
    [extractedPlaceId, userId],
  );

  return Number(result.affectedRows ?? 0) > 0;
}
