import { ReleasesCatalog } from "@/components/ReleasesCatalog";
import { getReleasesWithStats } from "@/lib/releases";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const releases = await getReleasesWithStats("date-desc");

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&h=900&fit=crop)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-black/20" />

        <div className="container relative py-20 md:py-28">
          <p className="animate-rise text-sm uppercase tracking-[0.2em] text-accent">
          </p>
          <h1 className="brand-mark animate-rise-delay-1 mt-4 max-w-3xl text-5xl font-extrabold leading-[0.95] md:text-7xl">
            Рябов <span className="text-accent">за творчество</span>
          </h1>
          <p className="animate-rise-delay-2 mt-5 max-w-xl text-base text-ink/80 md:text-lg">
          Крупнейшее русскоязычное сообщество обозревателей и ценителей музыкальной индустрии.
          <br />
          <br />
          Основатель «Рябов за творчество» и ведущий прямых трансляций — Григорий Рябов. Судья музыкальных баттлов и конкурсов с 2010 года. Создатель стримингового судейства, авторской «67-бальной системы оценивания» музыкальных релизов.
          </p>
        </div>
      </section>

      <section className="container py-12 md:py-16">
        <ReleasesCatalog releases={releases} />
      </section>
    </div>
  );
}
