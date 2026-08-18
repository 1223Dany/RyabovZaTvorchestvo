import { prisma } from "@/lib/prisma";

export type ReleaseWithStats = Awaited<
  ReturnType<typeof getReleasesWithStats>
>[number];

export type ReleaseSort =
  | "date-desc"
  | "date-asc"
  | "title-asc"
  | "title-desc";

export async function getReleasesWithStats(sort: ReleaseSort = "date-desc") {
  const releases = await prisma.release.findMany({
    include: {
      ratings: {
        select: { finalScore: true },
      },
    },
  });

  const mapped = releases.map((release) => {
    const count = release.ratings.length;
    const average =
      count === 0
        ? null
        : release.ratings.reduce((sum, r) => sum + r.finalScore, 0) / count;

    return {
      id: release.id,
      title: release.title,
      artist: release.artist,
      coverUrl: release.coverUrl,
      type: release.type,
      releaseDate: release.releaseDate
        ? release.releaseDate.toISOString()
        : null,
      description: release.description,
      ratingsCount: count,
      averageScore: average == null ? null : Number(average.toFixed(1)),
    };
  });

  const collator = new Intl.Collator("ru", {
    sensitivity: "base",
    numeric: true,
  });

  mapped.sort((a, b) => {
    if (sort === "title-asc" || sort === "title-desc") {
      const cmp = collator.compare(a.title, b.title);
      return sort === "title-asc" ? cmp : -cmp;
    }
    const at = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
    const bt = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
    if (at === bt) return collator.compare(a.title, b.title);
    return sort === "date-desc" ? bt - at : at - bt;
  });

  return mapped;
}

export async function getReleaseDetail(id: string) {
  const release = await prisma.release.findUnique({
    where: { id },
    include: {
      ratings: {
        include: {
          user: { select: { id: true, username: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!release) return null;

  const count = release.ratings.length;
  const average =
    count === 0
      ? null
      : release.ratings.reduce((sum, r) => sum + r.finalScore, 0) / count;

  return {
    ...release,
    ratingsCount: count,
    averageScore: average == null ? null : Number(average.toFixed(1)),
  };
}
