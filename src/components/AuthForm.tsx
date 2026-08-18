"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload =
      mode === "login"
        ? {
            login: String(form.get("login") || ""),
            password: String(form.get("password") || ""),
          }
        : {
            email: String(form.get("email") || ""),
            username: String(form.get("username") || ""),
            password: String(form.get("password") || ""),
          };

    try {
      const res = await fetch(
        mode === "login" ? "/api/auth/login" : "/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка");
        return;
      }
      router.push("/");
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
      className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-line bg-bg-elevated/90 p-6"
    >
      <div>
        <h1 className="brand-mark text-3xl font-bold">
          {mode === "login" ? "Вход" : "Регистрация"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {mode === "login"
            ? "Оценивайте релизы и оставляйте рецензии"
            : "Создайте аккаунт, чтобы публиковать оценки"}
        </p>
      </div>

      {mode === "login" ? (
        <Field
          label="Email или логин"
          name="login"
          type="text"
          autoComplete="username"
          required
        />
      ) : (
        <>
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          <Field
            label="Имя пользователя"
            name="username"
            type="text"
            autoComplete="username"
            required
          />
        </>
      )}

      <Field
        label="Пароль"
        name="password"
        type="password"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        required
        minLength={6}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-accent px-4 py-3 font-semibold text-black transition hover:brightness-110 disabled:opacity-60"
      >
        {loading
          ? "..."
          : mode === "login"
            ? "Войти"
            : "Создать аккаунт"}
      </button>

      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            Нет аккаунта?{" "}
            <Link href="/register" className="text-accent hover:underline">
              Регистрация
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Войти
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  required,
  autoComplete,
  minLength,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="text-muted">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
        className="w-full rounded-xl border border-line bg-bg-soft px-4 py-3 text-ink outline-none transition focus:border-accent"
      />
    </label>
  );
}
