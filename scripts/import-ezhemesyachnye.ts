/**
 * Импорт дискографии «Ежемесячные» из открытых API:
 * - Deezer (основной: обложки, даты, тип, треки, лейбл)
 * - MusicBrainz (дополнение релизов, которых нет в Deezer)
 *
 * Genius.com требует access token и часто отдаёт Cloudflare HTML без ключа —
 * поэтому как основной источник не используется.
 *
 * Запуск: npx tsx scripts/import-ezhemesyachnye.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ARTIST_NAME = "Ежемесячные";
const DEEZER_ARTIST_ID = 12411710;
const MUSICBRAINZ_ARTIST_ID = "f646239d-504c-479d-a047-8ab4ee22c9f3";

type ImportedRelease = {
  title: string;
  artist: string;
  coverUrl: string | null;
  type: string;
  releaseDate: Date | null;
  description: string;
  externalId: string;
  externalSource: string;
  label: string | null;
  trackCount: number | null;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[«»"'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mapDeezerType(recordType?: string, nbTracks?: number): string {
  const t = (recordType || "").toLowerCase();
  if (t === "single") return "single";
  if (t === "ep") return "ep";
  if (typeof nbTracks === "number" && nbTracks > 0 && nbTracks <= 3) return "single";
  if (typeof nbTracks === "number" && nbTracks > 3 && nbTracks <= 7) return "ep";
  return "album";
}

function buildDescription(parts: {
  type: string;
  trackCount?: number | null;
  label?: string | null;
  genres?: string[];
  date?: string | null;
  source: string;
}) {
  const chunks: string[] = [];
  chunks.push(`Релиз группы ${ARTIST_NAME}.`);
  if (parts.date) chunks.push(`Дата выхода: ${parts.date}.`);
  if (parts.trackCount) chunks.push(`Треков: ${parts.trackCount}.`);
  if (parts.label) chunks.push(`Лейбл: ${parts.label}.`);
  if (parts.genres?.length) chunks.push(`Жанры: ${parts.genres.join(", ")}.`);
  chunks.push(`Источник метаданных: ${parts.source}.`);
  return chunks.join(" ");
}

async function fetchDeezerAlbums(): Promise<ImportedRelease[]> {
  const list: Array<{ id: number }> = [];
  let url: string | null =
    `https://api.deezer.com/artist/${DEEZER_ARTIST_ID}/albums?limit=50`;

  while (url) {
    const page = await fetch(url).then((r) => r.json());
    list.push(...(page.data || []));
    url = page.next || null;
  }

  const releases: ImportedRelease[] = [];

  for (const item of list) {
    const album = await fetch(`https://api.deezer.com/album/${item.id}`).then(
      (r) => r.json(),
    );
    if (album.error) continue;

    const genres =
      album.genres?.data?.map((g: { name: string }) => g.name).filter(Boolean) ||
      [];
    const type = mapDeezerType(album.record_type, album.nb_tracks);
    const releaseDate = album.release_date
      ? new Date(`${album.release_date}T00:00:00.000Z`)
      : null;

    releases.push({
      title: album.title,
      // Всегда каноническое имя: Deezer иногда подставляет другой primary artist
      artist: ARTIST_NAME,
      coverUrl: album.cover_xl || album.cover_big || album.cover_medium || null,
      type,
      releaseDate,
      description: buildDescription({
        type,
        trackCount: album.nb_tracks,
        label: album.label,
        genres,
        date: album.release_date,
        source: "Deezer",
      }),
      externalId: String(album.id),
      externalSource: "deezer",
      label: album.label || null,
      trackCount: album.nb_tracks ?? null,
    });

    await sleep(120);
  }

  return releases;
}

async function fetchMusicBrainzExtras(
  existingTitles: Set<string>,
): Promise<ImportedRelease[]> {
  const headers = {
    "User-Agent": "RaybovZaTvorchestvo/0.1 (local-dev; music-rating-site)",
    Accept: "application/json",
  };

  await sleep(1100);
  const data = await fetch(
    `https://musicbrainz.org/ws/2/release-group?artist=${MUSICBRAINZ_ARTIST_ID}&limit=100&fmt=json`,
    { headers },
  ).then((r) => r.json());

  const groups = data["release-groups"] || [];
  const extras: ImportedRelease[] = [];

  for (const group of groups) {
    const title = group.title as string;
    if (existingTitles.has(normalizeTitle(title))) continue;

    const primary = String(group["primary-type"] || "Album").toLowerCase();
    const type =
      primary === "ep" ? "ep" : primary === "single" ? "single" : "album";
    const dateStr = group["first-release-date"] as string | undefined;
    const releaseDate = dateStr
      ? new Date(
          dateStr.length === 4
            ? `${dateStr}-01-01T00:00:00.000Z`
            : `${dateStr}T00:00:00.000Z`,
        )
      : null;

    // Cover Art Archive (может отсутствовать)
    let coverUrl: string | null = null;
    try {
      await sleep(1100);
      const covers = await fetch(
        `https://coverartarchive.org/release-group/${group.id}`,
        { headers: { Accept: "application/json" } },
      );
      if (covers.ok) {
        const coverJson = await covers.json();
        const front =
          coverJson.images?.find((i: { front?: boolean }) => i.front) ||
          coverJson.images?.[0];
        coverUrl =
          front?.thumbnails?.["500"] ||
          front?.thumbnails?.large ||
          front?.image ||
          null;
      }
    } catch {
      // нет обложки — ок
    }

    extras.push({
      title,
      artist: ARTIST_NAME,
      coverUrl,
      type,
      releaseDate,
      description: buildDescription({
        type,
        date: dateStr || null,
        source: "MusicBrainz",
      }),
      externalId: group.id,
      externalSource: "musicbrainz",
      label: null,
      trackCount: null,
    });
  }

  return extras;
}

async function upsertReleases(releases: ImportedRelease[]) {
  let created = 0;
  let updated = 0;

  for (const release of releases) {
    const existing = await prisma.release.findUnique({
      where: {
        externalSource_externalId: {
          externalSource: release.externalSource,
          externalId: release.externalId,
        },
      },
    });

    if (existing) {
      await prisma.release.update({
        where: { id: existing.id },
        data: {
          title: release.title,
          artist: release.artist,
          coverUrl: release.coverUrl,
          type: release.type,
          releaseDate: release.releaseDate,
          description: release.description,
          label: release.label,
          trackCount: release.trackCount,
        },
      });
      updated++;
    } else {
      // на случай старых записей без externalId — ищем по artist+title
      const byTitle = await prisma.release.findFirst({
        where: {
          artist: release.artist,
          title: release.title,
        },
      });

      if (byTitle) {
        await prisma.release.update({
          where: { id: byTitle.id },
          data: {
            coverUrl: release.coverUrl ?? byTitle.coverUrl,
            type: release.type,
            releaseDate: release.releaseDate ?? byTitle.releaseDate,
            description: release.description,
            externalId: release.externalId,
            externalSource: release.externalSource,
            label: release.label,
            trackCount: release.trackCount,
          },
        });
        updated++;
      } else {
        await prisma.release.create({ data: release });
        created++;
      }
    }
  }

  return { created, updated };
}

async function main() {
  console.log("Fetching Deezer discography for", ARTIST_NAME, "...");
  const deezer = await fetchDeezerAlbums();
  console.log(`Deezer: ${deezer.length} releases`);

  const titles = new Set(deezer.map((r) => normalizeTitle(r.title)));
  console.log("Fetching MusicBrainz extras...");
  const mbExtras = await fetchMusicBrainzExtras(titles);
  console.log(`MusicBrainz extras: ${mbExtras.length}`);

  const all = [...deezer, ...mbExtras].sort((a, b) => {
    const at = a.releaseDate?.getTime() ?? 0;
    const bt = b.releaseDate?.getTime() ?? 0;
    return bt - at;
  });

  const { created, updated } = await upsertReleases(all);
  console.log(`Done. created=${created}, updated=${updated}, total=${all.length}`);
  console.log(
    all
      .map(
        (r) =>
          `${r.releaseDate?.toISOString().slice(0, 10) || "????-??-??"} | ${r.type.padEnd(6)} | ${r.title}`,
      )
      .join("\n"),
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
