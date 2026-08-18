import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const releases = [
  {
    title: "Герой",
    artist: "Oxxxymiron",
    type: "album",
    coverUrl:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop",
    description:
      "Концептуальный альбом о пути артиста. Оценка сообщества покажет, насколько текст и подача держат удар.",
    releaseDate: new Date("2021-11-19"),
  },
  {
    title: "Скучаю",
    artist: "FACE",
    type: "single",
    coverUrl:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&h=600&fit=crop",
    description: "Короткий релиз с акцентом на атмосферу и мелодику.",
    releaseDate: new Date("2024-03-08"),
  },
  {
    title: "Новый день",
    artist: "Markul",
    type: "album",
    coverUrl:
      "https://images.unsplash.com/photo-1470225620780-dba8ba55b566?w=600&h=600&fit=crop",
    description: "Мелодичный хип-хоп с упором на вайб и продакшн.",
    releaseDate: new Date("2023-09-15"),
  },
  {
    title: "Без названия",
    artist: "Скриптонит",
    type: "album",
    coverUrl:
      "https://images.unsplash.com/photo-1459749411175-04bf52987733?w=600&h=600&fit=crop",
    description: "Плотный звук, характерная подача и узнаваемый стиль.",
    releaseDate: new Date("2022-06-01"),
  },
  {
    title: "Лето без тебя",
    artist: "Miyagi & Andy Panda",
    type: "ep",
    coverUrl:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=600&fit=crop",
    description: "Лёгкий EP для оценки атмосферы и хуков.",
    releaseDate: new Date("2024-07-12"),
  },
  {
    title: "Черновик",
    artist: "ЛСП",
    type: "album",
    coverUrl:
      "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=600&h=600&fit=crop",
    description: "Альбом с сильной лирикой и характерной интонацией.",
    releaseDate: new Date("2020-10-30"),
  },
];

async function main() {
  await prisma.rating.deleteMany();
  await prisma.release.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@raybov.local",
      username: "admin",
      passwordHash,
      role: "ADMIN",
      ratingScore: 100,
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      email: "demo@raybov.local",
      username: "demo",
      passwordHash: userPassword,
      role: "USER",
      ratingScore: 12,
    },
  });

  for (const release of releases) {
    await prisma.release.create({ data: release });
  }

  const first = await prisma.release.findFirst();
  if (first) {
    await prisma.rating.create({
      data: {
        userId: demoUser.id,
        releaseId: first.id,
        rhymes: 8,
        structure: 7,
        style: 8,
        individuality: 9,
        vibe: 8,
        baseScore: 32,
        vibeMultiplier: 1.525,
        finalScore: 48.8,
        reviewText: "Сильная подача и цельный вайб. Текст держит внимание.",
      },
    });
  }

  console.log("Seed complete");
  console.log("Admin: admin@raybov.local / admin123");
  console.log("User:  demo@raybov.local / user123");
  console.log(`Users: ${admin.username}, ${demoUser.username}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
