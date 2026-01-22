import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ExtractedQuestion {
  id: string;
  question_text: string;
  options: { label: string; text: string }[];
  correct_answer: string;
  explanation: string;
  chapter: string;
  section: string;
  topic: string;
  page_number: number;
  question_number: number;
  is_ai_generated: boolean;
  source_type: string;
}

export async function seedQuestions(forceReseed = false): Promise<void> {
  console.log("Seeding questions...");

  // Path to extracted questions
  const questionsPath = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "extraction",
    "output",
    "questions.json"
  );

  if (!fs.existsSync(questionsPath)) {
    console.error(`Questions file not found: ${questionsPath}`);
    console.error("Run the extraction script first.");
    return;
  }

  const rawData = fs.readFileSync(questionsPath, "utf-8");
  const questions: ExtractedQuestion[] = JSON.parse(rawData);

  console.log(`Found ${questions.length} questions to seed`);

  // Check if questions already exist
  const existingCount = await prisma.question.count();
  if (existingCount > 0) {
    if (forceReseed) {
      console.log(`Force reseed: deleting ${existingCount} existing questions...`);
      // Delete answers first due to foreign key constraints
      await prisma.quizAnswer.deleteMany({});
      await prisma.question.deleteMany({});
      console.log("Existing questions deleted.");
    } else {
      console.log(`Database already has ${existingCount} questions. Skipping seed.`);
      console.log("To re-seed, use --force or call seedQuestions(true).");
      return;
    }
  }

  // Transform and insert questions
  const prismaQuestions = questions.map((q) => ({
    questionText: q.question_text,
    options: q.options,
    correctAnswer: q.correct_answer,
    explanation: q.explanation || "",
    chapter: q.chapter,
    section: q.section || "",
    topic: q.topic,
    pageNumber: q.page_number,
    questionNumber: q.question_number,
    isAiGenerated: q.is_ai_generated || false,
    sourceType: q.source_type || "book",
  }));

  // Insert in batches
  const BATCH_SIZE = 100;
  let inserted = 0;

  for (let i = 0; i < prismaQuestions.length; i += BATCH_SIZE) {
    const batch = prismaQuestions.slice(i, i + BATCH_SIZE);
    await prisma.question.createMany({
      data: batch,
    });
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${prismaQuestions.length} questions`);
  }

  console.log("Question seeding complete!");

  // Print summary by topic
  const byTopic = await prisma.question.groupBy({
    by: ["topic"],
    _count: true,
  });

  console.log("\nQuestions by topic:");
  for (const { topic, _count } of byTopic) {
    console.log(`  ${topic}: ${_count}`);
  }
}

// Run if called directly
if (require.main === module) {
  const forceReseed = process.argv.includes("--force");
  seedQuestions(forceReseed)
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}
