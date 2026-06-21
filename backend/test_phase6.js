const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING PHASE 6 VERIFICATION ---');

  let mentorA = await prisma.user.findFirst({ where: { role: 'MENTOR', email: 'mentorA@test.com' } });
  if (!mentorA) {
    mentorA = await prisma.user.create({ data: { email: 'mentorA@test.com', password: 'password', fullName: 'Mentor A', role: 'MENTOR' } });
  }

  let mentorB = await prisma.user.findFirst({ where: { role: 'MENTOR', email: 'mentorB@test.com' } });
  if (!mentorB) {
    mentorB = await prisma.user.create({ data: { email: 'mentorB@test.com', password: 'password', fullName: 'Mentor B', role: 'MENTOR' } });
  }

  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN', email: 'admin@test.com' } });
  if (!admin) {
    admin = await prisma.user.create({ data: { email: 'admin@test.com', password: 'password', fullName: 'Admin User', role: 'ADMIN' } });
  }

  async function getAuthCookie(email, password = 'password') {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.headers.get('set-cookie');
  }

  const cookieA = await getAuthCookie(mentorA.email);
  const cookieB = await getAuthCookie(mentorB.email);
  const cookieAdmin = await getAuthCookie(admin.email);

  let templateA;
  try {
    const res = await fetch(`${API_URL}/mentor/roadmap-templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookieA },
      body: JSON.stringify({
        title: 'Mentor A Template',
        description: 'Test template by Mentor A',
        phases: [{ title: 'Phase 1', tasks: [{ title: 'Task 1', skillSlug: 'general', difficulty: 'EASY', estimatedMinutes: 30 }] }]
      })
    });
    const data = await res.json();
    if (res.ok) {
      templateA = data.template;
      console.log('[PASS] Create Template by Mentor A');
    } else { throw new Error(JSON.stringify(data)); }
  } catch (e) {
    console.log('[FAIL] Create Template by Mentor A', e.message);
  }

  try {
    const res = await fetch(`${API_URL}/mentor/roadmap-templates/${templateA.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookieB },
      body: JSON.stringify({
        title: 'Hacked by Mentor B',
        phases: [{ title: 'Phase 1', tasks: [{ title: 'Task 1', skillSlug: 'general', difficulty: 'EASY', estimatedMinutes: 30 }] }]
      })
    });
    if (res.status === 403) {
      console.log('[PASS] Ownership Test: Mentor B blocked from editing (403)');
    } else {
      console.log('[FAIL] Ownership Test: Mentor B got status', res.status);
    }
  } catch (e) { console.log('[FAIL] Ownership Test', e.message); }

  try {
    const res = await fetch(`${API_URL}/mentor/roadmap-templates/${templateA.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookieA },
      body: JSON.stringify({ title: 'Valid Title', phases: [{ title: 'Phase 1', tasks: [] }] })
    });
    if (res.status === 400) {
      const data = await res.json();
      if (data.message.includes('ít nhất 1 Task')) {
        console.log('[PASS] Validation Test: Blocked empty tasks (400)');
      }
    } else { console.log('[FAIL] Validation Test: Allowed empty tasks!'); }
  } catch (e) { console.log('[FAIL] Validation Test', e.message); }

  try {
    const res = await fetch(`${API_URL}/mentor/roadmap-templates/${templateA.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookieAdmin },
      body: JSON.stringify({
        title: 'Edited by Admin',
        phases: [{ title: 'Phase 1', tasks: [{ title: 'Task 1', skillSlug: 'general', difficulty: 'EASY', estimatedMinutes: 30 }] }]
      })
    });
    if (res.ok) { console.log('[PASS] Admin Override Test: Admin successfully edited template'); }
    else { console.log('[FAIL] Admin Override Test', res.status); }
  } catch (e) { console.log('[FAIL] Admin Override Test', e.message); }

  try {
    const templateBefore = await prisma.roadmapTemplate.findUnique({ where: { id: templateA.id }, include: { phases: { include: { tasks: true } } } });
    const phaseId = templateBefore.phases[0].id;
    const taskId = templateBefore.phases[0].tasks[0].id;

    const res = await fetch(`${API_URL}/mentor/roadmap-templates/${templateA.id}`, {
      method: 'DELETE',
      headers: { 'Cookie': cookieA }
    });
    if (res.ok) {
      console.log('[PASS] Template deleted by Mentor A');
      const phaseCheck = await prisma.roadmapPhase.findUnique({ where: { id: phaseId } });
      const taskCheck = await prisma.roadmapTask.findUnique({ where: { id: taskId } });
      if (!phaseCheck && !taskCheck) { console.log('[PASS] Cascade Delete Test: Phases and Tasks successfully cleaned up from DB'); }
      else { console.log('[FAIL] Cascade Delete Test: Orphaned records found in DB!'); }
    } else { console.log('[FAIL] Delete Test', res.status); }
  } catch (e) { console.log('[FAIL] Cascade Test', e.message); }

  console.log('--- PHASE 6 VERIFICATION COMPLETED ---');
  process.exit(0);
}
runTests();
