import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { calculateScore } from "@/lib/scoring";

const schema = z.object({
  releaseId: z.string().min(1),
  rhymes: z.number().int().min(1).max(10),
  structure: z.number().int().min(1).max(10),
  style: z.number().int().min(1).max(10),
  individuality: z.number().int().min(1).max(10),
  vibe: z.number().int().min(1).max(10),
  reviewText: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Нужно войти в аккаунт" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Ошибка валидации" },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const release = await prisma.release.findUnique({
      where: { id: data.releaseId },
    });
    if (!release) {
      return NextResponse.json({ error: "Релиз не найден" }, { status: 404 });
    }

    const score = calculateScore(data);
    const rating = await prisma.rating.upsert({
      where: {
        userId_releaseId: {
          userId: user.id,
          releaseId: data.releaseId,
        },
      },
      create: {
        userId: user.id,
        releaseId: data.releaseId,
        ...score,
        reviewText: data.reviewText?.trim() || null,
      },
      update: {
        ...score,
        reviewText: data.reviewText?.trim() || null,
      },
      include: {
        user: { select: { id: true, username: true, role: true } },
      },
    });

    return NextResponse.json({ rating });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
