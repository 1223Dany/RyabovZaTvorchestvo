"use client";

import { useMemo, useState } from "react";
import { ReleaseCard } from "@/components/ReleaseCard";
import type { ReleaseWithStats } from "@/lib/releases";

export type SortMode = "date-desc" | "date-asc" | "title-asc" | "title-desc";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "date-desc", label: "Дата · новые" },
  { value: "date-asc", label: "Дата · старые" },
  { value: "title-asc", label: "Имя · А–Я" },
  { value: "title-desc", label: "Имя · Я–А" },
];

function sortReleases(releases: ReleaseWithStats[], mode: SortMode) {
  const list = [...releases];
  const collator = new Intl.Collator("ru", { sensitivity: "base", numeric: true });

  list.sort((a, b) => {
    if (mode === "title-asc" || mode === "title-desc") {
      const cmp = collator.compare(a.title, b.title);
      return mode === "title-asc" ? cmp : -cmp;
    }

    const at = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
    const bt = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
    if (at === bt) return collator.compare(a.title, b.title);
    return mode === "date-desc" ? bt - at : at - bt;
  });

  return list;
}

export function ReleasesCatalog({ releases }: { releases: ReleaseWithStats[] }) {
  const [sort, setSort] = useState<SortMode>("date-desc");
  const sorted = useMemo(() => sortReleases(releases, sort), [releases, sort]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="brand-mark text-3xl font-bold md:text-4xl">Релизы</h2>
          <p className="mt-2 text-muted">
            Откройте альбом, поставьте оценку и посмотрите, что думают другие
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted">
            <span className="whitespace-nowrap">Сортировка</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="rounded-lg border border-line bg-bg-soft px-3 py-2 text-ink outline-none transition focus:border-accent"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <span className="text-sm text-muted">{sorted.length} на сайте</span>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center text-muted">
          Релизов пока нет. Админ может добавить их позже.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((release, index) => (
            <ReleaseCard key={release.id} release={release} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
