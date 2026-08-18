import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getReleaseDetail } from "@/lib/releases";
import { formatScore } from "@/lib/scoring";
import { RatingForm } from "@/components/RatingForm";
import { RatingsList } from "@/components/RatingsList";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ReleasePage({ params }: Props) {
  const { id } = await params;
  const release = await getReleaseDetail(id);
  if (!release) notFound();

  const user = await getSessionUser();
  const myRating = user
    ? await prisma.rating.findUnique({
        where: {
          userId_releaseId: { userId: user.id, releaseId: release.id },
        },
      })
    : null;

  return (
    <div className="container py-8 md:py-12">
      <Link
        href="/"
        className="mb-6 inline-flex text-sm text-muted transition hover:text-ink"
      >
        ← К релизам
      </Link>

      <section className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="animate-rise">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-bg-soft">
            {release.coverUrl ? (
              <Image
                src={release.coverUrl}
                alt={`${release.artist} — ${release.title}`}
                fill
                className="object-cover"
                sizes="320px"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-5xl font-bold text-muted">
                {release.artist.slice(0, 1)}
              </div>
            )}
          </div>
        </div>

        <div className="animate-rise-delay-1 space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-accent">
              {release.type}
            </p>
            <h1 className="brand-mark mt-2 text-4xl font-extrabold md:text-5xl">
              {release.title}
            </h1>
            <p className="mt-2 text-xl text-muted">{release.artist}</p>
            {release.releaseDate && (
              <p className="mt-2 text-sm text-muted">
                {new Date(release.releaseDate).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-6 rounded-2xl border border-line bg-bg-elevated/80 px-5 py-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted">
                Средний балл
              </div>
              <div className="brand-mark text-5xl font-bold text-score">
                {formatScore(release.averageScore)}
              </div>
            </div>
            <div className="text-sm text-muted">
              на основе {release.ratingsCount}{" "}
              {release.ratingsCount === 1
                ? "оценки"
                : release.ratingsCount > 1 && release.ratingsCount < 5
                  ? "оценок"
                  : "оценок"}
              <div className="mt-1 text-xs">
                Шкала итоговой оценки ≈ 4–67
              </div>
            </div>
          </div>

          {release.description && (
            <p className="max-w-2xl leading-relaxed text-ink/85">
              {release.description}
            </p>
          )}
        </div>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="animate-rise-delay-2">
          <RatingForm
            releaseId={release.id}
            isLoggedIn={Boolean(user)}
            initial={
              myRating
                ? {
                    rhymes: myRating.rhymes,
                    structure: myRating.structure,
                    style: myRating.style,
                    individuality: myRating.individuality,
                    vibe: myRating.vibe,
                    reviewText: myRating.reviewText,
                  }
                : undefined
            }
          />
          {!user && (
            <p className="mt-3 text-sm text-muted">
              <Link href="/login" className="text-accent hover:underline">
                Войдите
              </Link>{" "}
              или{" "}
              <Link href="/register" className="text-accent hover:underline">
                зарегистрируйтесь
              </Link>
              , чтобы опубликовать оценку.
            </p>
          )}
        </div>

        <div>
          <h2 className="brand-mark mb-4 text-2xl font-bold">Оценки</h2>
          <RatingsList ratings={release.ratings} />
        </div>
      </section>
    </div>
  );
}
