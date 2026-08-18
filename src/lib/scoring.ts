export const CRITERIA = [
  {
    key: "rhymes",
    label: "Рифмы / образы",
    description: "Язык, метафоры, плотность текста",
  },
  {
    key: "structure",
    label: "Структура / ритмика",
    description: "Поток, биты, композиция",
  },
  {
    key: "style",
    label: "Реализация стиля",
    description: "Насколько стиль доведён до ума",
  },
  {
    key: "individuality",
    label: "Индивидуальность / харизма",
    description: "Узнаваемость и подача",
  },
] as const;

export const VIBE_CRITERION = {
  key: "vibe",
  label: "Атмосфера / вайб",
  description: "Множитель финальной оценки",
} as const;

export type CriterionKey = (typeof CRITERIA)[number]["key"];

export type ScoreInput = {
  rhymes: number;
  structure: number;
  style: number;
  individuality: number;
  vibe: number;
};

export function clampScore(value: number): number {
  return Math.min(10, Math.max(1, Math.round(value)));
}

/** Множитель вайба: 1 → 1.000, шаг 0.075 до 10 → 1.675 */
export function vibeMultiplier(vibe: number): number {
  const v = clampScore(vibe);
  return 1 + (v - 1) * 0.075;
}

export function calculateScore(input: ScoreInput) {
  const rhymes = clampScore(input.rhymes);
  const structure = clampScore(input.structure);
  const style = clampScore(input.style);
  const individuality = clampScore(input.individuality);
  const vibe = clampScore(input.vibe);

  const baseScore = rhymes + structure + style + individuality;
  const multiplier = vibeMultiplier(vibe);
  const finalScore = Number((baseScore * multiplier).toFixed(2));

  return {
    rhymes,
    structure,
    style,
    individuality,
    vibe,
    baseScore,
    vibeMultiplier: Number(multiplier.toFixed(3)),
    finalScore,
  };
}

export function formatScore(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) return "—";
  return score.toFixed(1);
}
