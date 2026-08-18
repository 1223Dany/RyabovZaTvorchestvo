/**
 * Импорт полной дискографии «Ежемесячные» из Genius
 * (даты выхода, обложки, недостающие релизы).
 *
 * Официальный api.genius.com используется при валидном GENIUS_ACCESS_TOKEN.
 * Если токен невалиден — fallback на публичный genius.com/api.
 *
 * Запуск: npx tsx scripts/import-genius-ezhe.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ARTIST_NAME = "Ежемесячные";
const GENIUS_ARTIST_ID = 1205894;

type GeniusAlbum = {
  id: number;
  name: string;
  cover_art_url?: string | null;
  release_date?: string | null;
  release_date_components?: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
  } | null;
  release_date_for_display?: string | null;
  album_type?: string | null;
  description_preview?: string | null;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function webHeaders() {
  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    Accept: "application/json",
    Referer: "https://genius.com/artists/Ezhemesyachnye/albums",
  };
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
}

function normalizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/[«»"'`.,!?:;—–\-_/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Убирает английский перевод в скобках: «Родничок (Fontanelle)» → «Родничок» */
function displayTitle(name: string) {
  const m = name.match(/^(.+?)\s+\(([A-Za-z0-9][\s\S]*)\)$/u);
  if (m && /[а-яё]/i.test(m[1])) return m[1].trim();
  return name.trim();
}

function dateFromGenius(album: GeniusAlbum): Date | null {
  if (album.release_date) {
    return new Date(`${album.release_date}T00:00:00.000Z`);
  }
  const c = album.release_date_components;
  if (c?.year) {
    const month = String(c.month || 1).padStart(2, "0");
    const day = String(c.day || 1).padStart(2, "0");
    return new Date(`${c.year}-${month}-${day}T00:00:00.000Z`);
  }
  return null;
}

function mapType(albumType?: string | null) {
  const t = (albumType || "").toLowerCase();
  if (t.includes("single")) return "single";
  if (t.includes("ep")) return "ep";
  return "album";
}

async function fetchOfficialAlbums(token: string): Promise<GeniusAlbum[] | null> {
  const probe = await fetch(
    `https://api.genius.com/artists/${GENIUS_ARTIST_ID}/albums?per_page=1&page=1`,
    { headers: authHeaders(token) },
  );
  if (!probe.ok) {
    const body = await probe.text();
    console.warn(`Official Genius API failed (${probe.status}): ${body.slice(0, 180)}`);
    return null;
  }

  const albums: GeniusAlbum[] = [];
  let page = 1;
  while (page <= 30) {
    const data = await fetch(
      `https://api.genius.com/artists/${GENIUS_ARTIST_ID}/albums?per_page=50&page=${page}`,
      { headers: authHeaders(token) },
    ).then((r) => r.json());
    const batch = data.response?.albums || [];
    albums.push(...batch);
    if (!data.response?.next_page) break;
    page = data.response.next_page;
    await sleep(150);
  }
  return albums;
}

async function fetchWebAlbums(): Promise<GeniusAlbum[]> {
  const albums: GeniusAlbum[] = [];
  let page = 1;
  while (page <= 30) {
    const data = await fetch(
      `https://genius.com/api/artists/${GENIUS_ARTIST_ID}/albums?per_page=50&page=${page}`,
      { headers: webHeaders() },
    ).then((r) => r.json());
    const batch = data.response?.albums || [];
    albums.push(...batch);
    if (!data.response?.next_page) break;
    page = data.response.next_page;
    await sleep(150);
  }
  return albums;
}

async function enrichAlbum(
  album: GeniusAlbum,
  useOfficial: boolean,
  token?: string,
): Promise<GeniusAlbum> {
  const url = useOfficial
    ? `https://api.genius.com/albums/${album.id}`
    : `https://genius.com/api/albums/${album.id}`;
  const headers = useOfficial && token ? authHeaders(token) : webHeaders();

  try {
    const data = await fetch(url, { headers }).then((r) => r.json());
    const full = data.response?.album;
    if (!full) return album;
    return {
      ...album,
      ...full,
      name: full.name || album.name,
      cover_art_url: full.cover_art_url || album.cover_art_url,
      release_date: full.release_date || album.release_date,
      release_date_components:
        full.release_date_components || album.release_date_components,
      album_type: full.album_type || album.album_type,
      description_preview:
        full.description_preview || album.description_preview,
    };
  } catch {
    return album;
  }
}

async function main() {
  const token = process.env.GENIUS_ACCESS_TOKEN;
  let useOfficial = false;
  let albums: GeniusAlbum[] = [];

  if (token) {
    console.log("Trying official Genius API...");
    const official = await fetchOfficialAlbums(token);
    if (official) {
      albums = official;
      useOfficial = true;
      console.log(`Official API: ${albums.length} albums`);
    }
  }

  if (!albums.length) {
    console.log("Using Genius public web API fallback...");
    albums = await fetchWebAlbums();
    console.log(`Web API: ${albums.length} albums`);
  }

  if (!albums.length) {
    throw new Error("No albums fetched from Genius");
  }

  const existing = await prisma.release.findMany({
    where: { artist: ARTIST_NAME },
  });
  const byNorm = new Map(
    existing.map((r) => [normalizeTitle(r.title), r] as const),
  );

  let created = 0;
  let updated = 0;

  for (const raw of albums) {
    const album = await enrichAlbum(raw, useOfficial, token);
    await sleep(80);

    const title = displayTitle(album.name);
    const releaseDate = dateFromGenius(album);
    const coverUrl = album.cover_art_url || null;
    const type = mapType(album.album_type);
    const descriptionParts = [
      `Релиз группы ${ARTIST_NAME}.`,
      releaseDate
        ? `Дата выхода: ${releaseDate.toISOString().slice(0, 10)}.`
        : null,
      album.description_preview?.trim() || null,
      "Источник метаданных: Genius.",
    ].filter(Boolean);

    const matched = byNorm.get(normalizeTitle(title));
    const geniusExisting = await prisma.release.findUnique({
      where: {
        externalSource_externalId: {
          externalSource: "genius",
          externalId: String(album.id),
        },
      },
    });

    if (matched || geniusExisting) {
      const target = geniusExisting || matched!;
      await prisma.release.update({
        where: { id: target.id },
        data: {
          title: matched ? matched.title : title,
          artist: ARTIST_NAME,
          coverUrl: coverUrl || target.coverUrl,
          releaseDate: releaseDate || target.releaseDate,
          type: target.type || type,
          description:
            album.description_preview?.trim() ||
            target.description ||
            descriptionParts.join(" "),
          // сохраняем genius id, если запись ещё без внешнего id или уже genius
          ...(target.externalSource == null || target.externalSource === "genius"
            ? {
                externalSource: "genius",
                externalId: String(album.id),
              }
            : {}),
        },
      });
      updated++;
    } else {
      const createdRelease = await prisma.release.create({
        data: {
          title,
          artist: ARTIST_NAME,
          coverUrl,
          type,
          releaseDate,
          description: descriptionParts.join(" "),
          externalSource: "genius",
          externalId: String(album.id),
        },
      });
      byNorm.set(normalizeTitle(title), createdRelease);
      created++;
    }
  }

  const totalEzhe = await prisma.release.count({
    where: { artist: ARTIST_NAME },
  });
  console.log(
    `Done. created=${created}, updated=${updated}, total ${ARTIST_NAME}=${totalEzhe}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
