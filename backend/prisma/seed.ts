import { PrismaClient, FileType, AccessType } from '@prisma/client';
import { Role, Difficulty, TaskStatus, QuizType, AlertType } from '../src/types/enums';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.savedDocument.deleteMany();
  await prisma.document.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.knowledgeUnit.deleteMany();
  await prisma.pomodoroSession.deleteMany();
  await prisma.task.deleteMany();
  await prisma.bKTHistory.deleteMany();
  await prisma.riskHistory.deleteMany();
  await prisma.skillMastery.deleteMany();
  await prisma.mentorStudent.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.student.deleteMany();
  await prisma.mentor.deleteMany();
  await prisma.oTP.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding roles & users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Admin
  await prisma.user.create({
    data: {
      email: 'admin@edupath.edu',
      fullName: 'System Administrator',
      password: passwordHash,
      role: Role.ADMIN
    }
  });

  // 2. Mentors
  const mentors = [];
  for (let i = 1; i <= 3; i++) {
    const user = await prisma.user.create({
      data: {
        email: `mentor${i}@edupath.edu`,
        fullName: `Mentor Number ${i}`,
        password: passwordHash,
        role: Role.MENTOR
      }
    });
    const mentor = await prisma.mentor.create({
      data: { userId: user.id }
    });
    mentors.push(mentor);
  }

  // 3. Students
  const students = [];
  const studentGoals = [
    'Thành thạo React và Next.js để làm lập trình viên Frontend',
    'Trở thành chuyên gia Khoa học Dữ liệu trong 6 tháng',
    'Phát triển ứng dụng di động Flutter chuyên nghiệp',
    'Nâng cao kỹ năng thuật toán và Machine Learning',
    'Trở thành Fullstack Developer thiết kế hệ thống'
  ];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: `student${i}@edupath.edu`,
        fullName: `Student Number ${i}`,
        password: passwordHash,
        role: Role.STUDENT
      }
    });
    const student = await prisma.student.create({
      data: {
        userId: user.id,
        learningGoal: studentGoals[i % studentGoals.length],
        totalFocusTime: Math.floor(Math.random() * 1500) + 200, // random study time
        currentRiskScore: Math.floor(Math.random() * 80) + 10,
        onboardingCompleted: true
      }
    });
    students.push(student);
  }

  // 4. Link Students to Mentors
  console.log('Assigning students to mentors...');
  for (let i = 0; i < students.length; i++) {
    const mentorIndex = i % mentors.length;
    await prisma.mentorStudent.create({
      data: {
        studentId: students[i].id,
        mentorId: mentors[mentorIndex].id
      }
    });
  }

  // 5. Skill Tree
  console.log('Creating Skill Tree...');
  const webDev = await prisma.skill.create({ data: { name: 'Web Development', slug: 'web-dev', domain: 'WEB_DEV' } });
  const dataSci = await prisma.skill.create({ data: { name: 'Data Science', slug: 'data-science', domain: 'DATA_SCIENCE' } });
  const mobileDev = await prisma.skill.create({ data: { name: 'Mobile Development', slug: 'mobile-dev', domain: 'MOBILE_DEV' } });
  const english = await prisma.skill.create({ data: { name: 'Tiếng Anh', slug: 'english', domain: 'ENGLISH' } });
  const japanese = await prisma.skill.create({ data: { name: 'Tiếng Nhật', slug: 'japanese', domain: 'JAPANESE' } });

  const webSkills = [
    { name: 'HTML5 Basics', slug: 'html', parentId: webDev.id },
    { name: 'CSS3 & Responsive Design', slug: 'css', parentId: webDev.id },
    { name: 'JavaScript ES6+', slug: 'javascript', parentId: webDev.id },
    { name: 'React SPA Framework', slug: 'react', parentId: webDev.id },
    { name: 'Next.js App Router', slug: 'nextjs', parentId: webDev.id }
  ];
  const dsSkills = [
    { name: 'Python Programming', slug: 'python', parentId: dataSci.id },
    { name: 'Pandas Data Analysis', slug: 'pandas', parentId: dataSci.id },
    { name: 'Machine Learning Models', slug: 'machine-learning', parentId: dataSci.id },
    { name: 'Deep Learning & Neural Networks', slug: 'deep-learning', parentId: dataSci.id }
  ];
  const mobSkills = [
    { name: 'Dart Language Foundations', slug: 'dart', parentId: mobileDev.id },
    { name: 'Flutter Cross-platform UI', slug: 'flutter', parentId: mobileDev.id },
    { name: 'React Native Apps', slug: 'react-native', parentId: mobileDev.id }
  ];

  const engSkills = [
    { name: 'English Grammar Foundations', slug: 'english-grammar', parentId: english.id },
    { name: 'English Vocabulary Building', slug: 'english-vocab', parentId: english.id },
    { name: 'IELTS Listening & Speaking', slug: 'ielts-listening-speaking', parentId: english.id },
    { name: 'Business English Communication', slug: 'business-english', parentId: english.id }
  ];
  const jpSkills = [
    { name: 'Hiragana & Katakana', slug: 'hiragana-katakana', parentId: japanese.id },
    { name: 'N5 Kanji & Vocabulary', slug: 'n5-kanji-vocab', parentId: japanese.id },
    { name: 'Japanese Grammar N4-N5', slug: 'japanese-grammar-n4-n5', parentId: japanese.id },
    { name: 'JLPT Listening Practice', slug: 'jlpt-listening', parentId: japanese.id }
  ];

  const subSkills = [];
  for (const s of [...webSkills, ...dsSkills, ...mobSkills, ...engSkills, ...jpSkills]) {
    const created = await prisma.skill.create({ data: s });
    subSkills.push(created);
  }

  const allSkills = [webDev, dataSci, mobileDev, english, japanese, ...subSkills];

  // 6. SkillMastery (10 students * 15 skills = 150 masteries)
  console.log('Initializing Skill Mastery scores...');
  const masteries = [];
  for (const student of students) {
    for (const skill of allSkills) {
      const isRoot = !skill.parentId;
      const mastery = await prisma.skillMastery.create({
        data: {
          studentId: student.id,
          skillId: skill.id,
          masteryLevel: isRoot ? 0.5 : parseFloat((Math.random() * 0.7 + 0.1).toFixed(2)), // 0.1 to 0.8
          pLearn: 0.4,
          pForget: 0.1,
          pGuess: 0.2,
          pSlip: 0.1
        }
      });
      masteries.push(mastery);
    }
  }

  // 7. KnowledgeUnits (50)
  console.log('Seeding Knowledge Units library...');
  const difficulties = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD, Difficulty.EXPERT];
  const knowledgeUnits = [];
  for (let i = 1; i <= 50; i++) {
    const skill = subSkills[i % subSkills.length];
    const mentor = mentors[i % mentors.length];
    const difficulty = difficulties[i % difficulties.length];
    const unit = await prisma.knowledgeUnit.create({
      data: {
        title: `Tài liệu tự học ${skill.name} - Bài số ${i}`,
        content: `### Giới thiệu về ${skill.name}\nĐây là tài liệu tự học hướng dẫn chi tiết dành cho mức độ **${difficulty}**.\n\n#### Nội dung chính:\n1. Định nghĩa cơ bản và cú pháp.\n2. Ví dụ thực hành cụ thể.\n3. Các lỗi thường gặp và cách khắc phục.\n\n*Chúc các bạn học tập tốt!*`,
        skillId: skill.id,
        mentorId: mentor.id,
        difficulty: difficulty,
        isPublic: i % 2 === 0
      }
    });
    knowledgeUnits.push(unit);
  }

  // 8. QuizQuestions (50)
  console.log('Seeding Quiz Questions database...');
  const quizQuestions = [];
  for (let i = 1; i <= 50; i++) {
    const skill = subSkills[i % subSkills.length];
    const mentor = mentors[i % mentors.length];
    const difficulty = difficulties[i % difficulties.length];
    const question = await prisma.quizQuestion.create({
      data: {
        question: `Câu hỏi trắc nghiệm ôn tập kiến thức ${skill.name} - Câu ${i}: Hãy chọn đáp án đúng nhất mô tả khái niệm này?`,
        type: QuizType.SINGLE_CHOICE,
        options: JSON.stringify([
          { text: 'Đáp án chính xác được hệ thống xác thực', isCorrect: true },
          { text: 'Đáp án gây nhiễu số 1 không đúng', isCorrect: false },
          { text: 'Đáp án gây nhiễu số 2 không đúng', isCorrect: false },
          { text: 'Đáp án gây nhiễu số 3 không đúng', isCorrect: false }
        ]),
        explanation: 'Giải thích: Đáp án đúng phản ánh chính xác lý thuyết và thực tiễn cấu hình trong các tài liệu chuyên ngành chuẩn.',
        difficulty: difficulty,
        skillId: skill.id,
        mentorId: mentor.id
      }
    });
    quizQuestions.push(question);
  }

  // 9. Tasks (30)
  console.log('Seeding Tasks list...');
  const statuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];
  const tasks = [];
  for (let i = 1; i <= 30; i++) {
    const student = students[i % students.length];
    const skill = subSkills[i % subSkills.length];
    const difficulty = difficulties[i % difficulties.length];
    const status = statuses[i % statuses.length];
    const task = await prisma.task.create({
      data: {
        studentId: student.id,
        title: `Hoàn thành bài tập ${skill.name} - Mục tiêu ${i}`,
        description: `Thực hành thiết kế và triển khai kiến thức liên quan đến ${skill.name}. Yêu cầu hoàn thiện toàn bộ mã nguồn.`,
        skillId: skill.id,
        difficulty: difficulty,
        status: status,
        deadline: new Date(Date.now() + (i - 15) * 24 * 60 * 60 * 1000), // deadline offset days
        estimatedMinutes: 25 * (i % 3 + 1),
        completedAt: status === TaskStatus.DONE ? new Date() : null,
        isAIGenerated: i % 4 === 0
      }
    });
    tasks.push(task);
  }

  // 10. QuizAttempts & BKTHistory (60 attempts)
  console.log('Seeding Quiz Attempts & Bayesian Knowledge Tracing logs...');
  for (let i = 1; i <= 60; i++) {
    const student = students[i % students.length];
    const question = quizQuestions[i % quizQuestions.length];
    const isCorrect = Math.random() > 0.4; // 60% accuracy rate
    const selectedOption = isCorrect ? 0 : Math.floor(Math.random() * 3) + 1;
    
    // Log attempt
    await prisma.quizAttempt.create({
      data: {
        studentId: student.id,
        questionId: question.id,
        selectedOption: selectedOption,
        isCorrect: isCorrect,
        timeSpentSec: Math.floor(Math.random() * 50) + 10
      }
    });

    // Find mastery
    const mastery = masteries.find(m => m.studentId === student.id && m.skillId === question.skillId);
    if (mastery) {
      const valBefore = mastery.masteryLevel;
      // Heuristic update
      const valAfter = isCorrect ? Math.min(valBefore + 0.08, 1.0) : Math.max(valBefore - 0.06, 0.0);
      
      await prisma.bKTHistory.create({
        data: {
          masteryId: mastery.id,
          masteryBefore: valBefore,
          masteryAfter: valAfter,
          wasCorrect: isCorrect,
          createdAt: new Date(Date.now() - (60 - i) * 60 * 60 * 1000)
        }
      });
      // update internal array cache
      mastery.masteryLevel = valAfter;
    }
  }

  // 11. PomodoroSessions (50)
  console.log('Seeding Pomodoro Session logs...');
  for (let i = 1; i <= 50; i++) {
    const student = students[i % students.length];
    const studentTasks = tasks.filter(t => t.studentId === student.id);
    const task = studentTasks.length > 0 ? studentTasks[i % studentTasks.length] : null;
    await prisma.pomodoroSession.create({
      data: {
        studentId: student.id,
        taskId: task?.id || null,
        durationMin: 25,
        completed: i % 5 !== 0,
        endedAt: i % 5 !== 0 ? new Date() : null
      }
    });
  }

  // 12. RiskHistory (50 records: 5 per student)
  console.log('Seeding academic Risk History records...');
  for (const student of students) {
    for (let day = 5; day >= 1; day--) {
      await prisma.riskHistory.create({
        data: {
          studentId: student.id,
          riskScore: Math.max(10, Math.min(95, student.currentRiskScore + (day - 3) * 5)),
          taskCompletionRate: parseFloat((0.4 + (5 - day) * 0.1).toFixed(2)),
          avgQuizScore: parseFloat((0.5 + (5 - day) * 0.08).toFixed(2)),
          totalTimeSpent: student.totalFocusTime - day * 120,
          createdAt: new Date(Date.now() - day * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  // 13. Alerts (10)
  console.log('Seeding alerts feed...');
  for (let i = 1; i <= 10; i++) {
    const student = students[i % students.length];
    await prisma.alert.create({
      data: {
        studentId: student.id,
        type: i % 3 === 0 ? AlertType.YELLOW_WARNING : AlertType.RED_FLAG,
        message: i % 3 === 0
          ? `⚠️ Cảnh báo: Tốc độ hoàn thành công việc của Student ${i % students.length + 1} đang bị sụt giảm.`
          : `🚨 Đỏ: Điểm trung bình Quiz của Student ${i % students.length + 1} sụt giảm mạnh, rủi ro học tập vượt mức 70%.`
      }
    });
  }

  // 14. Documents (Library)
  console.log('Seeding Documents library...');
  const documents = [];
  const fileTypes = [FileType.PDF, FileType.DOCX, FileType.PPTX, FileType.LINK];
  const accessTypes = [AccessType.FREE, AccessType.PREMIUM];
  
  const sampleDocs = [
    { title: 'Sổ tay React Hooks toàn tập', desc: 'Tài liệu hướng dẫn sử dụng useState, useEffect, và custom hooks hiệu quả.', type: FileType.PDF },
    { title: 'Python for Data Science Cheat Sheet', desc: 'Tóm tắt các hàm quan trọng nhất của Pandas và NumPy.', type: FileType.LINK },
    { title: 'Slide bài giảng IELTS Writing Task 2', desc: 'Bài giảng chi tiết cách lập dàn ý và phát triển ý cho Writing Task 2.', type: FileType.PPTX },
    { title: 'Tổng hợp 1000 từ vựng JLPT N5', desc: 'Danh sách 1000 từ vựng thường gặp nhất trong đề thi N5.', type: FileType.DOCX },
    { title: 'Hướng dẫn Docker từ A đến Z', desc: 'Sổ tay docker hóa ứng dụng Node.js và Python.', type: FileType.PDF },
    { title: 'Kiến trúc Next.js App Router', desc: 'Deep dive vào Server Components và Client Components.', type: FileType.LINK },
    { title: 'Mẫu CV chuẩn cho lập trình viên', desc: 'Template CV đẹp mắt giúp bạn pass vòng CV dễ dàng.', type: FileType.DOCX },
    { title: 'Slide Data Visualization với Seaborn', desc: 'Trực quan hóa dữ liệu thống kê một cách sinh động.', type: FileType.PPTX }
  ];

  for (let i = 0; i < sampleDocs.length; i++) {
    const docData = sampleDocs[i];
    const skill = subSkills[i % subSkills.length];
    
    const isPremium = i % 3 === 0;
    
    const doc = await prisma.document.create({
      data: {
        title: docData.title,
        description: docData.desc,
        fileType: docData.type,
        fileUrl: 'https://example.com/dummy-document-link',
        accessType: isPremium ? AccessType.PREMIUM : AccessType.FREE,
        price: isPremium ? (Math.floor(Math.random() * 5) + 1) * 10000 : 0,
        downloadCount: Math.floor(Math.random() * 500) + 10,
        skillTags: {
          connect: [{ id: skill.id }]
        }
      }
    });
    documents.push(doc);
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
