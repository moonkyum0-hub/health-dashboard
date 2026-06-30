/**
 * 로컬 SQLite (dev.db) → Neon Postgres 마이그레이션
 *
 * 실행법:
 *   $env:DATABASE_URL = "postgresql://user:pass@host/db?sslmode=require"
 *   node migrate_local_to_neon.mjs
 *
 * DATABASE_URL 은 Vercel 대시보드 → Environments → Production → DATABASE_URL 에서 복사하세요.
 */

import Database from "better-sqlite3";
import { neon } from "@neondatabase/serverless";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, "dev.db");

const neonUrl = process.env.DATABASE_URL;
if (!neonUrl || !neonUrl.startsWith("postgres")) {
  console.error("❌ DATABASE_URL이 설정되지 않았습니다.");
  console.error('   PowerShell: $env:DATABASE_URL = "postgresql://..."');
  console.error("   Vercel 대시보드 → Environments → Production → DATABASE_URL 에서 복사하세요.");
  process.exit(1);
}

const sql = neon(neonUrl);
const db = new Database(dbPath, { readonly: true });

// 로컬 테이블의 실제 컬럼 목록을 가져옴 (신/구 스키마 모두 대응)
function getColumns(table) {
  return db.prepare(`PRAGMA table_info("${table}")`).all().map((r) => r.name);
}

function colOrNull(cols, name, val) {
  if (!cols.includes(name)) return "NULL";
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "string") return `'${val.replace(/'/g, "''")}'`;
  if (typeof val === "boolean") return val ? "true" : "false";
  return String(val);
}

function strOrNull(v) {
  if (v === null || v === undefined) return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}

function dateStr(v) {
  return `'${new Date(v).toISOString()}'`;
}

let migrated = 0, skipped = 0;

async function tryInsert(label, query) {
  try {
    await sql(query);
    migrated++;
  } catch (e) {
    if (e.message?.includes("duplicate") || e.message?.includes("unique")) {
      skipped++;
    } else {
      console.warn(`  ⚠ ${label}: ${e.message?.slice(0, 120)}`);
      skipped++;
    }
  }
}

// ── Users ──────────────────────────────────────────────────────
console.log("\n👤 Users...");
const users = db.prepare('SELECT * FROM "User"').all();
for (const u of users) {
  await tryInsert(`User ${u.email}`, `
    INSERT INTO "User" (id, email, "passwordHash", name, role, "accountType", "createdAt")
    VALUES (
      '${u.id}', ${strOrNull(u.email)}, ${strOrNull(u.passwordHash)},
      ${strOrNull(u.name)}, ${strOrNull(u.role)},
      '${u.accountType ?? "USER"}', ${dateStr(u.createdAt)}
    ) ON CONFLICT (id) DO NOTHING
  `);
}
console.log(`  ${users.length}명 처리`);

// ── Routines ────────────────────────────────────────────────────
console.log("🏃 Routines...");
const routines = db.prepare('SELECT * FROM "Routine"').all();
for (const r of routines) {
  await tryInsert(`Routine ${r.id}`, `
    INSERT INTO "Routine" (id, "userId", name, days, "createdAt", "updatedAt")
    VALUES ('${r.id}', '${r.userId}', ${strOrNull(r.name)}, ${strOrNull(r.days)},
      ${dateStr(r.createdAt)}, ${dateStr(r.updatedAt)})
    ON CONFLICT (id) DO NOTHING
  `);
}
const routineItems = db.prepare('SELECT * FROM "RoutineItem"').all();
for (const ri of routineItems) {
  await tryInsert(`RoutineItem ${ri.id}`, `
    INSERT INTO "RoutineItem" (id, "routineId", "exerciseCatalogId", "customName", "order", "durationMin", "setsReps")
    VALUES ('${ri.id}', '${ri.routineId}',
      ${strOrNull(ri.exerciseCatalogId)}, ${strOrNull(ri.customName)},
      ${ri.order}, ${ri.durationMin ?? "NULL"}, ${strOrNull(ri.setsReps)})
    ON CONFLICT (id) DO NOTHING
  `);
}
console.log(`  루틴 ${routines.length}개, 항목 ${routineItems.length}개 처리`);

// ── DailyLogs ───────────────────────────────────────────────────
console.log("📅 DailyLogs...");
const dlCols = getColumns("DailyLog");
const dailyLogs = db.prepare('SELECT * FROM "DailyLog"').all();
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
      '${l.id}', '${l.userId}', ${dateStr(l.date)},
      ${strOrNull(l.dayOfWeek)}, ${strOrNull(l.routine)},
      ${strOrNull(l.bedTime)}, ${strOrNull(l.wakeTime)},
      ${l.sleepHours ?? "NULL"}, ${l.sleepQuality ?? "NULL"},
      ${l.energyMorning ?? "NULL"}, ${l.energyAfternoon ?? "NULL"}, ${l.energyEvening ?? "NULL"},
      ${l.studyFocusScore ?? "NULL"}, ${l.studyFocusMinutes ?? "NULL"},
      ${l.reactionTimeMs ?? "NULL"}, ${l.totalExerciseMin ?? "NULL"},
      ${l.overallRPE ?? "NULL"}, ${strOrNull(l.exerciseNotes)},
      ${colOrNull(dlCols, "stroopAccuracy", l.stroopAccuracy)},
      ${colOrNull(dlCols, "stroopAvgMs", l.stroopAvgMs)},
      ${colOrNull(dlCols, "balanceSec", l.balanceSec)},
      ${dateStr(l.createdAt)}, ${dateStr(l.updatedAt)}
    ) ON CONFLICT (id) DO NOTHING
  `);
}
console.log(`  ${dailyLogs.length}건 처리`);

// ── ExerciseLogs ────────────────────────────────────────────────
console.log("💪 ExerciseLogs...");
const exerciseLogs = db.prepare('SELECT * FROM "ExerciseLog"').all();
for (const e of exerciseLogs) {
  await tryInsert(`ExerciseLog ${e.id}`, `
    INSERT INTO "ExerciseLog" (id, "dailyLogId", name, region, "durationMin", "setsReps", rpe, completed, pain, notes)
    VALUES ('${e.id}', '${e.dailyLogId}', ${strOrNull(e.name)}, ${strOrNull(e.region)},
      ${e.durationMin ?? "NULL"}, ${strOrNull(e.setsReps)}, ${e.rpe ?? "NULL"},
      ${e.completed ? "true" : "false"}, ${e.pain ? "true" : "false"}, ${strOrNull(e.notes)})
    ON CONFLICT (id) DO NOTHING
  `);
}
console.log(`  ${exerciseLogs.length}건 처리`);

// ── MealLogs ────────────────────────────────────────────────────
console.log("🍽  MealLogs...");
const mealLogs = db.prepare('SELECT * FROM "MealLog"').all();
for (const m of mealLogs) {
  await tryInsert(`MealLog ${m.id}`, `
    INSERT INTO "MealLog" (id, "dailyLogId", "mealType", time, items, notes)
    VALUES ('${m.id}', '${m.dailyLogId}', ${strOrNull(m.mealType)},
      ${strOrNull(m.time)}, ${strOrNull(m.items)}, ${strOrNull(m.notes)})
    ON CONFLICT (id) DO NOTHING
  `);
}
console.log(`  ${mealLogs.length}건 처리`);

// ── KnowledgeCards ──────────────────────────────────────────────
console.log("📚 KnowledgeCards...");
let cardCount = 0;
try {
  const cards = db.prepare('SELECT * FROM "KnowledgeCard"').all();
  for (const c of cards) {
    await tryInsert(`KnowledgeCard ${c.id}`, `
      INSERT INTO "KnowledgeCard" (id, "authorId", title, summary, body, category, "createdAt", "updatedAt")
      VALUES ('${c.id}', '${c.authorId}', ${strOrNull(c.title)}, ${strOrNull(c.summary)},
        ${strOrNull(c.body)}, ${strOrNull(c.category)}, ${dateStr(c.createdAt)}, ${dateStr(c.updatedAt)})
      ON CONFLICT (id) DO NOTHING
    `);
    cardCount++;
  }
} catch (e) {
  console.warn("  KnowledgeCard 테이블 없음 또는 에러:", e.message?.slice(0, 80));
}
console.log(`  ${cardCount}건 처리`);

db.close();
console.log(`\n✅ 완료! 성공: ${migrated}건, 건너뜀(중복/에러): ${skipped}건`);
