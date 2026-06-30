/**
 * 로컬 SQLite (dev.db) → Neon Postgres 데이터 마이그레이션
 * 실행법: $env:DATABASE_URL="postgres://..."; node migrate_local_to_neon.mjs
 */

import Database from "better-sqlite3";
import { neon } from "@neondatabase/serverless";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, "dev.db");

const neonUrl = process.env.DATABASE_URL;
if (!neonUrl || !neonUrl.startsWith("postgres")) {
  console.error("❌ DATABASE_URL 환경변수에 Neon 연결 문자열을 설정해주세요.");
  console.error("   예) $env:DATABASE_URL=\"postgresql://user:pass@host/db?sslmode=require\"");
  process.exit(1);
}

const sql = neon(neonUrl);
const db = new Database(dbPath, { readonly: true });

let migrated = 0, skipped = 0;

async function tryInsert(label, query) {
  try {
    await sql(query);
    migrated++;
  } catch (e) {
    if (e.message?.includes("duplicate key") || e.message?.includes("unique")) {
      skipped++;
    } else {
      console.warn(`  ⚠ ${label}: ${e.message}`);
      skipped++;
    }
  }
}

// ── Users ────────────────────────────────────────────────────────────────────
console.log("👤 Users 마이그레이션...");
const users = db.prepare("SELECT * FROM User").all();
for (const u of users) {
  await tryInsert(`User ${u.email}`, `
    INSERT INTO "User" (id, email, "passwordHash", name, role, "accountType", "createdAt")
    VALUES (
      '${u.id}', '${u.email.replace(/'/g, "''")}',
      '${u.passwordHash.replace(/'/g, "''")}',
      ${u.name ? `'${u.name.replace(/'/g, "''")}'` : "NULL"},
      ${u.role ? `'${u.role}'` : "NULL"},
      '${u.accountType ?? "USER"}',
      '${new Date(u.createdAt).toISOString()}'
    ) ON CONFLICT (id) DO NOTHING
  `);
}
console.log(`  → ${users.length}명 처리 (migrated: ${migrated}, skipped: ${skipped})`);

// ── Routines ─────────────────────────────────────────────────────────────────
let m = migrated, s = skipped;
console.log("🏃 Routines 마이그레이션...");
const routines = db.prepare("SELECT * FROM Routine").all();
for (const r of routines) {
  await tryInsert(`Routine ${r.id}`, `
    INSERT INTO "Routine" (id, "userId", name, days, "createdAt", "updatedAt")
    VALUES (
      '${r.id}', '${r.userId}', '${r.name.replace(/'/g, "''")}',
      '${r.days}', '${new Date(r.createdAt).toISOString()}',
      '${new Date(r.updatedAt).toISOString()}'
    ) ON CONFLICT (id) DO NOTHING
  `);
}
const routineItems = db.prepare("SELECT * FROM RoutineItem").all();
for (const ri of routineItems) {
  await tryInsert(`RoutineItem ${ri.id}`, `
    INSERT INTO "RoutineItem" (id, "routineId", "exerciseCatalogId", "customName", "order", "durationMin", "setsReps")
    VALUES (
      '${ri.id}', '${ri.routineId}',
      ${ri.exerciseCatalogId ? `'${ri.exerciseCatalogId}'` : "NULL"},
      ${ri.customName ? `'${ri.customName.replace(/'/g, "''")}'` : "NULL"},
      ${ri.order},
      ${ri.durationMin ?? "NULL"},
      ${ri.setsReps ? `'${ri.setsReps.replace(/'/g, "''")}'` : "NULL"}
    ) ON CONFLICT (id) DO NOTHING
  `);
}
console.log(`  → 루틴 ${routines.length}개, 항목 ${routineItems.length}개 (new migrated: ${migrated - m}, skipped: ${skipped - s})`);

// ── DailyLogs ─────────────────────────────────────────────────────────────────
m = migrated; s = skipped;
console.log("📅 DailyLogs 마이그레이션...");
const dailyLogs = db.prepare("SELECT * FROM DailyLog").all();
for (const l of dailyLogs) {
  await tryInsert(`DailyLog ${l.id}`, `
    INSERT INTO "DailyLog" (
      id, "userId", date, "dayOfWeek", routine,
      "bedTime", "wakeTime", "sleepHours", "sleepQuality",
      "energyMorning", "energyAfternoon", "energyEvening",
      "studyFocusScore", "studyFocusMinutes", "reactionTimeMs",
      "totalExerciseMin", "overallRPE", "exerciseNotes",
      "stroopAccuracy", "stroopAvgMs", "balanceSec",
      "createdAt", "updatedAt"
    ) VALUES (
      '${l.id}', '${l.userId}', '${new Date(l.date).toISOString()}',
      '${l.dayOfWeek}', '${l.routine.replace(/'/g, "''")}',
      ${l.bedTime ? `'${l.bedTime}'` : "NULL"},
      ${l.wakeTime ? `'${l.wakeTime}'` : "NULL"},
      ${l.sleepHours ?? "NULL"},
      ${l.sleepQuality ?? "NULL"},
      ${l.energyMorning ?? "NULL"},
      ${l.energyAfternoon ?? "NULL"},
      ${l.energyEvening ?? "NULL"},
      ${l.studyFocusScore ?? "NULL"},
      ${l.studyFocusMinutes ?? "NULL"},
      ${l.reactionTimeMs ?? "NULL"},
      ${l.totalExerciseMin ?? "NULL"},
      ${l.overallRPE ?? "NULL"},
      ${l.exerciseNotes ? `'${l.exerciseNotes.replace(/'/g, "''")}'` : "NULL"},
      ${l.stroopAccuracy ?? "NULL"},
      ${l.stroopAvgMs ?? "NULL"},
      ${l.balanceSec ?? "NULL"},
      '${new Date(l.createdAt).toISOString()}',
      '${new Date(l.updatedAt).toISOString()}'
    ) ON CONFLICT (id) DO NOTHING
  `);
}
console.log(`  → ${dailyLogs.length}건 처리 (new migrated: ${migrated - m}, skipped: ${skipped - s})`);

// ── ExerciseLogs ──────────────────────────────────────────────────────────────
m = migrated; s = skipped;
console.log("💪 ExerciseLogs 마이그레이션...");
const exerciseLogs = db.prepare("SELECT * FROM ExerciseLog").all();
for (const e of exerciseLogs) {
  await tryInsert(`ExerciseLog ${e.id}`, `
    INSERT INTO "ExerciseLog" (id, "dailyLogId", name, region, "durationMin", "setsReps", rpe, completed, pain, notes)
    VALUES (
      '${e.id}', '${e.dailyLogId}',
      '${e.name.replace(/'/g, "''")}', '${e.region}',
      ${e.durationMin ?? "NULL"},
      ${e.setsReps ? `'${e.setsReps.replace(/'/g, "''")}'` : "NULL"},
      ${e.rpe ?? "NULL"},
      ${e.completed ? "true" : "false"},
      ${e.pain ? "true" : "false"},
      ${e.notes ? `'${e.notes.replace(/'/g, "''")}'` : "NULL"}
    ) ON CONFLICT (id) DO NOTHING
  `);
}
console.log(`  → ${exerciseLogs.length}건 처리 (new migrated: ${migrated - m}, skipped: ${skipped - s})`);

// ── MealLogs ──────────────────────────────────────────────────────────────────
m = migrated; s = skipped;
console.log("🍽  MealLogs 마이그레이션...");
const mealLogs = db.prepare("SELECT * FROM MealLog").all();
for (const ml of mealLogs) {
  await tryInsert(`MealLog ${ml.id}`, `
    INSERT INTO "MealLog" (id, "dailyLogId", "mealType", time, items, notes)
    VALUES (
      '${ml.id}', '${ml.dailyLogId}',
      '${ml.mealType.replace(/'/g, "''")}',
      ${ml.time ? `'${ml.time}'` : "NULL"},
      '${ml.items.replace(/'/g, "''")}',
      ${ml.notes ? `'${ml.notes.replace(/'/g, "''")}'` : "NULL"}
    ) ON CONFLICT (id) DO NOTHING
  `);
}
console.log(`  → ${mealLogs.length}건 처리 (new migrated: ${migrated - m}, skipped: ${skipped - s})`);

// ── KnowledgeCards ─────────────────────────────────────────────────────────
m = migrated; s = skipped;
console.log("📚 KnowledgeCards 마이그레이션...");
const cards = db.prepare("SELECT * FROM KnowledgeCard").all();
for (const c of cards) {
  await tryInsert(`KnowledgeCard ${c.id}`, `
    INSERT INTO "KnowledgeCard" (id, "authorId", title, summary, body, category, "createdAt", "updatedAt")
    VALUES (
      '${c.id}', '${c.authorId}',
      '${c.title.replace(/'/g, "''")}',
      '${c.summary.replace(/'/g, "''")}',
      '${c.body.replace(/'/g, "''")}',
      '${c.category}',
      '${new Date(c.createdAt).toISOString()}',
      '${new Date(c.updatedAt).toISOString()}'
    ) ON CONFLICT (id) DO NOTHING
  `);
}
console.log(`  → ${cards.length}건 처리 (new migrated: ${migrated - m}, skipped: ${skipped - s})`);

db.close();
console.log(`\n✅ 마이그레이션 완료! 총 migrated: ${migrated}, skipped(이미 있음/에러): ${skipped}`);
