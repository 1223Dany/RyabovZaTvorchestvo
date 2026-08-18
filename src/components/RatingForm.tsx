"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CRITERIA,
  VIBE_CRITERION,
  calculateScore,
  type ScoreInput,
} from "@/lib/scoring";

type Props = {
  releaseId: string;
  isLoggedIn: boolean;
  initial?: Partial<ScoreInput> & { reviewText?: string | null };
};

const defaults: ScoreInput = {
  rhymes: 5,
  structure: 5,
  style: 5,
  individuality: 5,
  vibe: 5,
};

export function RatingForm({ releaseId, isLoggedIn, initial }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<ScoreInput>({
    ...defaults,
    ...initial,
  });
  const [reviewText, setReviewText] = useState(initial?.reviewText || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  const score = useMemo(() => calculateScore(values), [values]);

  function update(key: keyof ScoreInput, raw: number) {
    setValues((prev) => ({ ...prev, [key]: raw }));
    setPulseKey((k) => k + 1);
    setSuccess("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isLoggedIn) {
      setError("Войдите, чтобы опубликовать оценку");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          releaseId,
          ...values,
          reviewText: reviewText.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось сохранить оценку");
        return;
      }
      setSuccess("Оценка опубликована");
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-2xl border border-line bg-bg-elevated/90 p-5 md:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="brand-mark text-2xl font-bold">Ваша оценка</h2>
          <p className="mt-1 text-sm text-muted">
            База (4 критерия) × множитель вайба
          </p>
        </div>
        <div
          key={pulseKey}
          className="score-live text-right"
        >
          <div className="brand-mark text-4xl font-bold text-score md:text-5xl">
            {score.finalScore.toFixed(1)}
          </div>
          <div className="text-xs text-muted">
            база {score.baseScore} × {score.vibeMultiplier.toFixed(3)}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {CRITERIA.map((criterion) => (
          <CriterionSlider
            key={criterion.key}
            label={criterion.label}
            description={criterion.description}
            value={values[criterion.key]}
            onChange={(v) => update(criterion.key, v)}
          />
        ))}
        <CriterionSlider
          label={VIBE_CRITERION.label}
          description={`${VIBE_CRITERION.description} · множитель ${score.vibeMultiplier.toFixed(3)}`}
          value={values.vibe}
          onChange={(v) => update("vibe", v)}
          accent
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted" htmlFor="review">
          Рецензия (необязательно)
        </label>
        <textarea
          id="review"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Коротко о релизе..."
          className="w-full resize-y rounded-xl border border-line bg-bg-soft px-4 py-3 text-ink outline-none transition focus:border-accent"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {success && <p className="text-sm text-score">{success}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-accent px-4 py-3 font-semibold text-accent-ink transition hover:brightness-110 disabled:opacity-60"
      >
        {loading
          ? "Публикация..."
          : isLoggedIn
            ? "Опубликовать оценку"
            : "Войдите, чтобы оценить"}
      </button>
    </form>
  );
}

function CriterionSlider({
  label,
  description,
  value,
  onChange,
  accent = false,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  accent?: boolean;
}) {
  const fill = `${((value - 1) / 9) * 100}%`;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div>
          <div className={`font-medium ${accent ? "text-accent" : ""}`}>
            {label}
          </div>
          <div className="text-xs text-muted">{description}</div>
        </div>
        <div className="brand-mark text-xl font-bold tabular-nums">{value}</div>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ["--fill" as string]: fill }}
        aria-label={label}
      />
    </div>
  );
}
