/**
 * Local dev seed: one organization plus one user per role, so the login
 * flow and role-based redirects can be tested end-to-end. Run via
 * `npm run db:seed`. Credentials come from env vars (see .env.example)
 * rather than being hardcoded here.
 */
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env.local" });
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const password = requireEnv("SEED_PASSWORD");
  const passwordHash = await bcrypt.hash(password, 10);

  const org = await db.organization.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "CIRCLE Demo Org",
    },
  });

  const seedUsers: Array<{ email: string; name: string; role: UserRole }> = [
    { email: requireEnv("SEED_ADMIN_EMAIL"), name: "Alex Admin", role: "ORG_ADMIN" },
    { email: requireEnv("SEED_LEAD_EMAIL"), name: "Lea Lead", role: "PROFESSIONAL_LEAD" },
    { email: requireEnv("SEED_PARTNER_EMAIL"), name: "Pat Partner", role: "SUPPORT_PARTNER" },
    { email: requireEnv("SEED_MEMBER_EMAIL"), name: "Mel Member", role: "MEMBER" },
  ];

  for (const user of seedUsers) {
    await db.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        orgId: org.id,
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
      },
    });
    console.log(`Seeded ${user.role}: ${user.email}`);
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var for seeding: ${name}`);
  return value;
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
