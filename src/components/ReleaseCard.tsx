import Link from "next/link";
import Image from "next/image";
import { formatScore } from "@/lib/scoring";
import type { ReleaseWithStats } from "@/lib/releases";

export function ReleaseCard({
  release,
  index = 0,
}: {
  release: ReleaseWithStats;
  index?: number;
}) {
  const delayClass =
    index % 3 === 0
      ? "animate-rise"
      : index % 3 === 1
        ? "animate-rise-delay-1"
        : "animate-rise-delay-2";

  return (
    <Link
      href={`/releases/${release.id}`}
      className={`group block overflow-hidden rounded-2xl border border-line bg-bg-elevated/80 transition duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] ${delayClass}`}
    >
      <div className="relative aspect-square overflow-hidden bg-bg-soft">
        {release.coverUrl ? (
          <Image
            src={release.coverUrl}
            alt={`${release.artist} — ${release.title}`}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-bg-soft to-bg text-4xl font-bold text-muted">
            {release.artist.slice(0, 1)}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16">
          <div className="flex items-end justify-between gap-2">
            <span className="rounded bg-black/50 px-2 py-1 text-xs uppercase tracking-wide text-muted">
              {release.type}
            </span>
            <span className="brand-mark text-2xl font-bold text-score">
              {formatScore(release.averageScore)}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-1 p-4">
        <h3 className="brand-mark text-lg font-semibold leading-tight group-hover:text-accent">
          {release.title}
        </h3>
        <p className="text-sm text-muted">{release.artist}</p>
        <p className="text-xs text-muted">
          {release.releaseDate
            ? new Date(release.releaseDate).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Дата неизвестна"}
          {" · "}
          {release.ratingsCount}{" "}
          {release.ratingsCount === 1
            ? "оценка"
            : release.ratingsCount < 5
              ? "оценки"
              : "оценок"}
        </p>
      </div>
    </Link>
  );
}
