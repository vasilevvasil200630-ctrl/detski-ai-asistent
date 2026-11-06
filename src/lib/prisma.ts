import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Копирано от МатураПлюс (src/lib/prisma.ts): PrismaClient с адаптера pg и един клиент
// за целия процес в разработка. Разлика: клиентът се създава при първа заявка към базата,
// така че AI инструментите (игри, ДОС план, промптове) работят и без DATABASE_URL.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Configure a Postgres connection string.");
  }
  // По желание: таван на връзките на инстанция (напр. 1 за локалната PGlite база, която
  // не понася паралелни връзки). Без настройката важи стандартният пул на node-postgres.
  const poolMax = Number(process.env.DATABASE_POOL_MAX);
  const adapter = new PrismaPg({ connectionString, ...(poolMax > 0 ? { max: poolMax } : {}) });
  return new PrismaClient({ adapter });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = createClient();
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
