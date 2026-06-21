/**
 * One-time data migration script: Fix malformed learningGoal values in DB.
 *
 * Problem: Some records in the Student table may have learningGoal stored as:
 *   ", (Mục tiêu học tập: 2 giờ/ngày trong 3 tháng)"
 * instead of:
 *   "Thành thạo React (Mục tiêu học tập: 2 giờ/ngày trong 3 tháng)"
 *
 * This happens when the description part is empty/whitespace and gets prepended with
 * a comma or space before the metadata suffix.
 *
 * Run once with: npx ts-node src/scripts/fix-learning-goal.ts
 */

import prisma from '../prisma/client';

async function fixLearningGoals() {
  console.log('🔍 Scanning for malformed learningGoal records...');

  const students = await prisma.student.findMany({
    where: {
      learningGoal: { not: null }
    },
    select: { id: true, learningGoal: true }
  });

  let fixedCount = 0;

  for (const student of students) {
    const raw = student.learningGoal!;

    // Detect malformed: leading comma, semicolon, or pure whitespace before metadata
    // Pattern: ", (Mục tiêu học tập: ...)" or " (Mục tiêu học tập: ...)" with empty description
    const malformedMatch = raw.match(/^([,;\s]*)\s*\(Mục tiêu học tập:\s*(.+?)\)\s*$/);
    if (malformedMatch && malformedMatch[1].trim().length === 0) {
      // Description part is empty/punctuation only — fix by removing it
      const fixedGoal = `(Mục tiêu học tập: ${malformedMatch[2].trim()})`;
      console.log(`  ✏️  Student ${student.id}:`);
      console.log(`     Before: "${raw}"`);
      console.log(`     After:  "${fixedGoal}"`);

      await prisma.student.update({
        where: { id: student.id },
        data: { learningGoal: fixedGoal }
      });
      fixedCount++;
      continue;
    }

    // Also detect: description with only leading comma/punctuation before actual goal
    const withLeadingComma = raw.match(/^[,;\s]+(.+)$/);
    if (withLeadingComma) {
      const fixedGoal = withLeadingComma[1].trim();
      console.log(`  ✏️  Student ${student.id}:`);
      console.log(`     Before: "${raw}"`);
      console.log(`     After:  "${fixedGoal}"`);

      await prisma.student.update({
        where: { id: student.id },
        data: { learningGoal: fixedGoal }
      });
      fixedCount++;
    }
  }

  console.log(`\n✅ Done! Fixed ${fixedCount} of ${students.length} records.`);
  await prisma.$disconnect();
}

fixLearningGoals().catch(e => {
  console.error('❌ Migration failed:', e);
  process.exit(1);
});
