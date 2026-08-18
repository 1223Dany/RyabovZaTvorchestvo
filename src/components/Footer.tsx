import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative z-10 mt-auto border-t border-line">
      <div className="container flex flex-col gap-3 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <p className="brand-mark text-ink">
          Рябов за творчество — оценки, рецензии, сцена
        </p>
        <div className="flex gap-4">
          <Link href="/" className="hover:text-ink">
            Релизы
          </Link>
          <Link href="/login" className="hover:text-ink">
            Войти
          </Link>
          <Link href="/register" className="hover:text-ink">
            Регистрация
          </Link>
        </div>
      </div>
    </footer>
  );
}
