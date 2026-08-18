import { formatScore } from "@/lib/scoring";

type RatingItem = {
  id: string;
  rhymes: number;
  structure: number;
  style: number;
  individuality: number;
  vibe: number;
  baseScore: number;
  vibeMultiplier: number;
  finalScore: number;
  reviewText: string | null;
  createdAt: Date | string;
  user: { id: string; username: string; role: string };
};

export function RatingsList({ ratings }: { ratings: RatingItem[] }) {
  if (ratings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-5 py-10 text-center text-muted">
        Пока нет оценок — будьте первым
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ratings.map((rating) => (
        <article
          key={rating.id}
          className="rounded-2xl border border-line bg-bg-elevated/70 p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-medium">
                @{rating.user.username}
                {rating.user.role === "ADMIN" && (
                  <span className="ml-2 text-xs text-accent">admin</span>
                )}
              </div>
              <time className="text-xs text-muted">
                {new Date(rating.createdAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </div>
            <div className="text-right">
              <div className="brand-mark text-3xl font-bold text-score">
                {formatScore(rating.finalScore)}
              </div>
              <div className="text-xs text-muted">
                {rating.baseScore} × {rating.vibeMultiplier.toFixed(3)}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-5">
            <Metric label="Рифмы" value={rating.rhymes} />
            <Metric label="Структура" value={rating.structure} />
            <Metric label="Стиль" value={rating.style} />
            <Metric label="Харизма" value={rating.individuality} />
            <Metric label="Вайб" value={rating.vibe} />
          </div>

          {rating.reviewText && (
            <p className="mt-4 text-sm leading-relaxed text-ink/90">
              {rating.reviewText}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-bg-soft px-3 py-2">
      <div>{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-ink">{value}/10</div>
    </div>
  );
}
