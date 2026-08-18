import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export async function Header() {
  const user = await getSessionUser();

  return (
    <header className="relative z-20 border-b border-line/80 backdrop-blur-md">
      <div className="container flex items-center justify-between gap-4 py-4">
        <Link href="/" className="brand-mark text-xl font-bold tracking-tight md:text-2xl">
          Рябов <span className="text-accent">за творчество</span>
        </Link>

        <nav className="flex items-center gap-2 text-sm md:gap-3">
          <Link
            href="/"
            className="hidden rounded-md px-3 py-2 text-muted transition hover:text-ink sm:inline"
          >
            Релизы
          </Link>
          {user ? (
            <>
              <span className="rounded-md bg-bg-soft px-3 py-2 text-muted">
                @{user.username}
                {user.role === "ADMIN" && (
                  <span className="ml-2 text-accent">admin</span>
                )}
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-muted transition hover:text-ink"
              >
                Войти
              </Link>
              <Link
                href="/register"
                className="rounded-md px-3 py-2 font-semibold dark:text-black transition hover:brightness-110"              >
                Регистрация
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
