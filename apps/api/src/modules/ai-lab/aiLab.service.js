import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { env } from "../../config/env.js";
import {
  completeVideoExtraction,
  createVideoExtraction,
  failVideoExtraction,
  getAiLabOverview,
  saveExtractedPlaces,
} from "./aiLab.repository.js";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ytDlpExecutableCandidates = [
  path.resolve(__dirname, "../../../../../tools/yt-dlp.exe"),
  path.resolve(__dirname, "../../../../tools/yt-dlp.exe"),
];

const KOREAN_PLACE_SUFFIXES = [
  "공항",
  "역",
  "터미널",
  "타워",
  "공원",
  "해변",
  "시장",
  "궁",
  "숲",
  "거리",
  "마을",
  "카페",
  "호텔",
  "박물관",
  "전망대",
  "광장",
  "성당",
  "사원",
  "성",
  "산",
  "섬",
  "호수",
  "브리지",
  "랜드마크",
  "리조트",
];

const ENGLISH_PLACE_SUFFIXES = [
  "Airport",
  "Station",
  "Terminal",
  "Tower",
  "Park",
  "Beach",
  "Market",
  "Palace",
  "Forest",
  "Street",
  "Village",
  "Cafe",
  "Hotel",
  "Museum",
  "Square",
  "Temple",
  "Castle",
  "Mountain",
  "Island",
  "Lake",
  "Bridge",
  "Pier",
  "Shrine",
  "Garden",
];

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#10;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function extractYouTubeVideoId(youtubeUrl) {
  try {
    const url = new URL(youtubeUrl);

    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "").trim();
    }

    if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("v") ?? "";
    }

    return "";
  } catch {
    return "";
  }
}

function extractJsonBlock(source, token) {
  const tokenIndex = source.indexOf(token);

  if (tokenIndex === -1) {
    return null;
  }

  const startIndex = source.indexOf("{", tokenIndex);

  if (startIndex === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === "\\") {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return source.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

function pickSubtitleTrackEntry(trackMap) {
  if (!trackMap || typeof trackMap !== "object") {
    return null;
  }

  const preferredKeys = Object.keys(trackMap).sort((left, right) => {
    const leftScore = left === "ko" ? 0 : left.startsWith("ko") ? 1 : 2;
    const rightScore = right === "ko" ? 0 : right.startsWith("ko") ? 1 : 2;
    return leftScore - rightScore;
  });

  for (const key of preferredKeys) {
    const entries = Array.isArray(trackMap[key]) ? trackMap[key] : [];
    const preferredEntry =
      entries.find((entry) => entry.ext === "json3") ??
      entries.find((entry) => entry.ext === "srv3") ??
      entries.find((entry) => entry.ext === "srv2") ??
      entries.find((entry) => entry.ext === "vtt") ??
      entries[0];

    if (preferredEntry?.url) {
      return preferredEntry;
    }
  }

  return null;
}

function parseJson3Transcript(data) {
  return normalizeWhitespace(
    (data.events ?? [])
      .flatMap((event) => event.segs ?? [])
      .map((segment) => decodeHtmlEntities(segment.utf8 ?? ""))
      .join(" "),
  );
}

function parseTranscriptXml(xml) {
  const matches = [...xml.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)];

  return normalizeWhitespace(
    matches
      .map((match) => decodeHtmlEntities(match[1].replace(/<[^>]+>/g, " ")))
      .join(" "),
  );
}

async function fetchTranscriptFromSubtitleEntry(entry) {
  const response = await fetch(entry.url);

  if (!response.ok) {
    return "";
  }

  if (entry.ext === "json3") {
    const data = await response.json();
    return parseJson3Transcript(data);
  }

  const text = await response.text();
  return parseTranscriptXml(text);
}

async function fetchYouTubeBundleWithYtDlp(youtubeUrl) {
  for (const executablePath of ytDlpExecutableCandidates) {
    try {
      const { stdout } = await execFileAsync(
        executablePath,
        ["--dump-single-json", "--no-warnings", "--skip-download", youtubeUrl],
        {
          windowsHide: true,
          maxBuffer: 20 * 1024 * 1024,
        },
      );

      if (!stdout) {
        continue;
      }

      const data = JSON.parse(stdout);
      const subtitleEntry =
        pickSubtitleTrackEntry(data.subtitles) ?? pickSubtitleTrackEntry(data.automatic_captions);
      const transcript = subtitleEntry
        ? await fetchTranscriptFromSubtitleEntry(subtitleEntry)
        : "";

      return {
        title: data.title || `YouTube 영상 ${data.id ?? ""}`.trim(),
        transcript,
        chapters: Array.isArray(data.chapters)
          ? data.chapters
              .map((chapter) => normalizeWhitespace(chapter.title ?? ""))
              .filter(Boolean)
          : [],
      };
    } catch {
      continue;
    }
  }

  return null;
}

function parseTimedTextTrackList(xml) {
  return [...xml.matchAll(/<track\b([^>]*)\/>/g)].map((match) => {
    const attributes = match[1];
    const readAttribute = (name) => {
      const attributeMatch = attributes.match(new RegExp(`${name}="([^"]*)"`, "i"));
      return attributeMatch ? decodeHtmlEntities(attributeMatch[1]) : "";
    };

    return {
      languageCode: readAttribute("lang_code"),
      languageName: readAttribute("lang_translated"),
      name: readAttribute("name"),
      kind: readAttribute("kind"),
    };
  });
}

function selectCaptionTrack(captionTracks) {
  if (!Array.isArray(captionTracks) || captionTracks.length === 0) {
    return null;
  }

  return (
    captionTracks.find((track) => track.languageCode === "ko") ??
    captionTracks.find((track) => track.languageCode?.startsWith("ko")) ??
    captionTracks.find((track) => track.kind !== "asr") ??
    captionTracks[0]
  );
}

function buildTimedTextTrackUrl(videoId, track) {
  const params = new URLSearchParams({
    v: videoId,
    lang: track.languageCode,
    fmt: "srv3",
  });

  if (track.name) {
    params.set("name", track.name);
  }

  if (track.kind) {
    params.set("kind", track.kind);
  }

  return `https://www.youtube.com/api/timedtext?${params.toString()}`;
}

async function fetchYouTubeTranscriptFromTimedText(videoId) {
  const trackListResponse = await fetch(
    `https://www.youtube.com/api/timedtext?type=list&v=${encodeURIComponent(videoId)}`,
  );

  if (!trackListResponse.ok) {
    return "";
  }

  const trackListXml = await trackListResponse.text();
  const timedTextTracks = parseTimedTextTrackList(trackListXml);
  const selectedTrack = selectCaptionTrack(timedTextTracks);

  if (!selectedTrack?.languageCode) {
    return "";
  }

  const transcriptResponse = await fetch(buildTimedTextTrackUrl(videoId, selectedTrack));

  if (!transcriptResponse.ok) {
    return "";
  }

  const transcriptXml = await transcriptResponse.text();
  return parseTranscriptXml(transcriptXml);
}

async function fetchYouTubeMetadata(videoId) {
  const response = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${videoId}`,
    )}&format=json`,
  );

  if (!response.ok) {
    return {
      title: `YouTube 영상 ${videoId}`,
    };
  }

  const data = await response.json();

  return {
    title: data.title || `YouTube 영상 ${videoId}`,
  };
}

async function fetchYouTubeTranscript(videoId) {
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=ko`);

  if (!response.ok) {
    throw new Error("유튜브 페이지를 불러오지 못했습니다.");
  }

  const html = await response.text();
  const playerResponseJson =
    extractJsonBlock(html, "ytInitialPlayerResponse =") ??
    extractJsonBlock(html, "var ytInitialPlayerResponse =");

  if (!playerResponseJson) {
    throw new Error("유튜브 플레이어 정보를 찾지 못했습니다.");
  }

  const playerResponse = JSON.parse(playerResponseJson);
  const captionTracks =
    playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  const selectedTrack = selectCaptionTrack(captionTracks);

  if (!selectedTrack?.baseUrl) {
    return fetchYouTubeTranscriptFromTimedText(videoId);
  }

  const transcriptResponse = await fetch(selectedTrack.baseUrl);

  if (!transcriptResponse.ok) {
    return fetchYouTubeTranscriptFromTimedText(videoId);
  }

  const transcriptXml = await transcriptResponse.text();
  const transcript = parseTranscriptXml(transcriptXml);

  if (transcript) {
    return transcript;
  }

  return fetchYouTubeTranscriptFromTimedText(videoId);
}

function buildKoreanPlaceRegex() {
  const suffixes = KOREAN_PLACE_SUFFIXES.join("|");
  return new RegExp(
    `([가-힣A-Za-z0-9·&'’.-]{2,}(?:\\s+[가-힣A-Za-z0-9·&'’.-]{1,}){0,3}(?:${suffixes}))`,
    "g",
  );
}

function buildEnglishPlaceRegex() {
  const suffixes = ENGLISH_PLACE_SUFFIXES.join("|");
  return new RegExp(
    `\\b([A-Z][A-Za-z0-9'&.-]*(?:\\s+[A-Z][A-Za-z0-9'&.-]*){0,4}\\s(?:${suffixes}))\\b`,
    "g",
  );
}

function extractPlaceCandidates(transcript, title, chapters = []) {
  const sourceText = normalizeWhitespace(`${title} ${transcript}`.slice(0, 20000));
  const candidates = [];
  const seen = new Set();
  const genericTerms = new Set([
    "이번 여행",
    "오늘 여행",
    "우리 숙소",
    "이곳",
    "여기",
    "추천 장소",
    "인트로",
    "해외렌트카꿀팁",
  ]);

  const collect = (value, confidenceScore) => {
    const normalized = normalizeWhitespace(value.replace(/[.,!?()[\]"]/g, " "));

    if (!normalized || normalized.length < 2 || normalized.length > 40) {
      return;
    }

    if (genericTerms.has(normalized)) {
      return;
    }

    const key = normalized.toLowerCase();

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    candidates.push({
      rawPlaceName: normalized,
      confidenceScore,
    });
  };

  for (const match of sourceText.matchAll(buildKoreanPlaceRegex())) {
    collect(match[1], 0.82);
  }

  for (const match of sourceText.matchAll(buildEnglishPlaceRegex())) {
    collect(match[1], 0.78);
  }

  chapters.forEach((chapterTitle) => {
    chapterTitle
      .split(/[,&/·]| 그리고 |와 |, /)
      .map((item) => normalizeWhitespace(item))
      .filter(Boolean)
      .forEach((item) => collect(item, 0.9));
  });

  return candidates.slice(0, 20);
}

async function resolveKakaoPlace(query) {
  if (!env.kakao.restApiKey) {
    return null;
  }

  const response = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(
      query,
    )}&size=3`,
    {
      headers: {
        Authorization: `KakaoAK ${env.kakao.restApiKey}`,
      },
    },
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const doc = data.documents?.[0];

  if (!doc) {
    return null;
  }

  return {
    name: doc.place_name,
    address: doc.road_address_name || doc.address_name || "",
    lat: Number(doc.y),
    lng: Number(doc.x),
    region: doc.address_name?.split(" ").slice(0, 2).join(" ") || "대한민국",
    category: doc.category_group_name || "추천 장소",
    categoryKey: "activity",
  };
}

function getGoogleRegionCode(travelRegion) {
  switch (travelRegion) {
    case "japan":
      return "JP";
    case "southeast_asia":
      return "TH";
    case "europe":
      return "FR";
    case "america":
      return "US";
    case "greater_china":
      return "TW";
    case "oceania":
      return "AU";
    case "korea":
    default:
      return "KR";
  }
}

function getTravelRegionKeyword(travelRegion) {
  switch (travelRegion) {
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

function parseJsonObjectFromText(content) {
  const trimmedContent = (content || "").trim();

  if (!trimmedContent) {
    return null;
  }

  const fencedMatch = trimmedContent.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidateText = fencedMatch ? fencedMatch[1].trim() : trimmedContent;
  const objectStartIndex = candidateText.indexOf("{");
  const objectEndIndex = candidateText.lastIndexOf("}");

  if (objectStartIndex === -1 || objectEndIndex === -1 || objectEndIndex <= objectStartIndex) {
    return null;
  }

  try {
    return JSON.parse(candidateText.slice(objectStartIndex, objectEndIndex + 1));
  } catch {
    return null;
  }
}

function buildCandidateObjects(values, confidenceScore) {
  return (Array.isArray(values) ? values : [])
    .map((value) => normalizeWhitespace(String(value ?? "")))
    .filter(Boolean)
    .map((rawPlaceName) => ({
      rawPlaceName,
      confidenceScore,
    }));
}

function dedupeCandidates(candidates) {
  const uniqueCandidates = [];
  const seen = new Set();

  candidates.forEach((candidate) => {
    const normalizedName = normalizeWhitespace(candidate.rawPlaceName || "");
    const key = normalizedName.toLowerCase();

    if (!normalizedName || seen.has(key)) {
      return;
    }

    seen.add(key);
    uniqueCandidates.push({
      rawPlaceName: normalizedName,
      confidenceScore: candidate.confidenceScore ?? 0.7,
    });
  });

  return uniqueCandidates;
}

async function extractPlaceCandidatesWithLlm({ transcript, title, chapters, travelRegion }) {
  if (!env.gemini.apiKey) {
    return [];
  }

  const promptText = normalizeWhitespace(
    [
      `travel region: ${travelRegion}`,
      `video title: ${title}`,
      `chapters: ${(chapters || []).join(" | ")}`,
      `transcript: ${transcript.slice(0, 12000)}`,
    ].join("\n"),
  );

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      env.gemini.model,
    )}:generateContent?key=${encodeURIComponent(env.gemini.apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                "You extract travel places from YouTube travel transcripts. Return only JSON. Prefer specific visitable places over broad regions. If a city or area and a specific landmark both appear, prefer the landmark. Keep the result concise and deduplicated.",
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text:
                  `${promptText}\n\nReturn JSON in this shape: {\"places\":[\"specific place 1\"],\"regions\":[\"broad area 1\"]}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              places: {
                type: "ARRAY",
                items: {
                  type: "STRING",
                },
              },
              regions: {
                type: "ARRAY",
                items: {
                  type: "STRING",
                },
              },
            },
          },
        },
      }),
    },
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const content =
    data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  const parsed = parseJsonObjectFromText(content);

  if (!parsed) {
    return [];
  }

  return dedupeCandidates([
    ...buildCandidateObjects(parsed.places, 0.94),
    ...buildCandidateObjects(parsed.regions, 0.68),
  ]);
}

function inferTravelRegionsFromText(text) {
  const source = (text || "").toLowerCase();
  const inferredRegions = [];

  const regionHints = [
    {
      region: "japan",
      patterns: ["일본", "도쿄", "오사카", "교토", "삿포로", "후쿠오카", "오키나와", "나라"],
    },
    {
      region: "europe",
      patterns: ["유럽", "파리", "런던", "로마", "바르셀로나", "프라하", "암스테르담", "베를린"],
    },
    {
      region: "america",
      patterns: ["미국", "뉴욕", "la", "los angeles", "샌프란시스코", "라스베이거스", "시애틀"],
    },
    {
      region: "greater_china",
      patterns: ["중국", "대만", "홍콩", "마카오", "상하이", "베이징", "타이베이"],
    },
    {
      region: "southeast_asia",
      patterns: ["동남아", "방콕", "다낭", "호치민", "하노이", "싱가포르", "발리", "세부"],
    },
    {
      region: "oceania",
      patterns: ["오세아니아", "시드니", "멜버른", "브리즈번", "오클랜드"],
    },
  ];

  regionHints.forEach(({ region, patterns }) => {
    if (patterns.some((pattern) => source.includes(pattern))) {
      inferredRegions.push(region);
    }
  });

  return inferredRegions;
}

function getValidationRegions(primaryRegion, text) {
  const inferredRegions = inferTravelRegionsFromText(text);
  const orderedRegions = [
    primaryRegion,
    ...inferredRegions,
    "korea",
    "japan",
    "southeast_asia",
    "europe",
    "america",
    "greater_china",
    "oceania",
  ];

  return [...new Set(orderedRegions)];
}

async function resolveGooglePlace(query, travelRegion) {
  if (!env.googleMaps.serverApiKey) {
    return null;
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.googleMaps.serverApiKey,
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.location,places.primaryTypeDisplayName",
    },
    body: JSON.stringify({
      textQuery: `${query} ${getTravelRegionKeyword(travelRegion)}`.trim(),
      languageCode: "ko",
      regionCode: getGoogleRegionCode(travelRegion),
      rankPreference: "RELEVANCE",
    }),
  });

  if (response.ok) {
    const data = await response.json();
    const result = data.places?.[0];

    if (result?.location) {
      return {
        name: result.displayName?.text || query,
        address: result.formattedAddress || query,
        lat: Number(result.location.latitude),
        lng: Number(result.location.longitude),
        region: result.formattedAddress?.split(", ").slice(-1)[0] || "해외",
        category: result.primaryTypeDisplayName?.text || "추천 장소",
        categoryKey: "activity",
      };
    }
  }

  const geocodeResponse = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      `${query} ${getTravelRegionKeyword(travelRegion)}`.trim(),
    )}&key=${encodeURIComponent(env.googleMaps.serverApiKey)}`,
  );

  if (!geocodeResponse.ok) {
    return null;
  }

  const geocodeData = await geocodeResponse.json();
  const geocodeResult = geocodeData.results?.[0];

  if (!geocodeResult?.geometry?.location) {
    return null;
  }

  return {
    name: geocodeResult.formatted_address.split(",")[0] || query,
    address: geocodeResult.formatted_address,
    lat: Number(geocodeResult.geometry.location.lat),
    lng: Number(geocodeResult.geometry.location.lng),
    region:
      geocodeResult.address_components?.find((component) =>
        component.types?.includes("country"),
      )?.long_name || "해외",
    category: "추천 장소",
    categoryKey: "activity",
  };
}

async function resolvePlaceCandidate(candidate, travelRegions) {
  for (const travelRegion of travelRegions) {
    const resolved =
      travelRegion === "korea"
        ? (await resolveKakaoPlace(candidate.rawPlaceName)) ??
          (await resolveGooglePlace(candidate.rawPlaceName, travelRegion))
        : await resolveGooglePlace(candidate.rawPlaceName, travelRegion);

    if (!resolved) {
      continue;
    }

    return {
      ...resolved,
      rawPlaceName: candidate.rawPlaceName,
      confidenceScore: candidate.confidenceScore,
    };
  }

  return null;
}

export async function analyzeYoutubeVideo({ userId, youtubeUrl, travelRegion = "korea" }) {
  const videoId = extractYouTubeVideoId(youtubeUrl);

  if (!videoId) {
    const error = new Error("유효한 유튜브 링크를 입력해 주세요.");
    error.status = 400;
    throw error;
  }

  const ytDlpBundle = await fetchYouTubeBundleWithYtDlp(youtubeUrl);
  const metadata = ytDlpBundle
    ? { title: ytDlpBundle.title }
    : await fetchYouTubeMetadata(videoId);
  const extractionId = await createVideoExtraction({
    userId,
    youtubeUrl,
    videoTitle: metadata.title,
    status: "processing",
  });

  try {
    const transcript = ytDlpBundle?.transcript || (await fetchYouTubeTranscript(videoId));

    if (!transcript) {
      await completeVideoExtraction(extractionId, "no_transcript");
      const overview = await getAiLabOverview(userId);
      return {
        message: "자막을 찾지 못해 분석 결과가 비어 있습니다.",
        extraction: overview.extractions.find((item) => item.id === String(extractionId)) ?? null,
      };
    }

    const heuristicCandidates = extractPlaceCandidates(
      transcript,
      metadata.title,
      ytDlpBundle?.chapters ?? [],
    );
    const llmCandidates = await extractPlaceCandidatesWithLlm({
      transcript,
      title: metadata.title,
      chapters: ytDlpBundle?.chapters ?? [],
      travelRegion,
    });
    const candidates = dedupeCandidates([...llmCandidates, ...heuristicCandidates]).slice(0, 24);
    const validationRegions = getValidationRegions(
      travelRegion,
      `${metadata.title} ${transcript} ${(ytDlpBundle?.chapters ?? []).join(" ")}`,
    );
    const verifiedPlaces = [];

    for (const candidate of candidates) {
      const resolvedPlace = await resolvePlaceCandidate(candidate, validationRegions);

      if (!resolvedPlace) {
        continue;
      }

      const duplicate = verifiedPlaces.find(
        (place) =>
          place.name.toLowerCase() === resolvedPlace.name.toLowerCase() &&
          place.address.toLowerCase() === resolvedPlace.address.toLowerCase(),
      );

      if (!duplicate) {
        verifiedPlaces.push(resolvedPlace);
      }
    }

    const savedPlaces = await saveExtractedPlaces(extractionId, verifiedPlaces.slice(0, 8));
    await completeVideoExtraction(extractionId, "completed");

    return {
      message:
        savedPlaces.length > 0
          ? "영상에서 장소를 추출해 마이페이지에 저장했습니다."
          : "자막은 찾았지만 검증된 장소를 찾지 못했습니다.",
      extraction: {
        id: String(extractionId),
        youtubeUrl,
        videoTitle: metadata.title,
        status: "completed",
        requestedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        places: savedPlaces,
      },
    };
  } catch (error) {
    await failVideoExtraction(extractionId);
    throw error;
  }
}
