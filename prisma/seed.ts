import { PrismaClient } from "@prisma/client";
import { seedQuestions } from "./seed/questions";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  await seedQuestions();

  console.log("\nSeed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
