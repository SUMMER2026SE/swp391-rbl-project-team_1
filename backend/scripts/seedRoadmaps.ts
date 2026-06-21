import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROADMAP_TEMPLATES = [
  {
    id: 'web-fullstack',
    title: 'Fullstack Web Developer',
    description: 'Trở thành kỹ sư phát triển Web toàn diện từ Frontend đến Backend. Lộ trình được thiết kế chuẩn đầu ra của FPT University.',
    difficulty: 'Trung bình',
    durationWeeks: 12,
    totalSkills: 6,
    bannerGradient: 'from-blue-600 via-indigo-600 to-purple-600',
    phases: [
      {
        title: 'Giai đoạn 1: Frontend Basics',
        description: 'Làm quen với HTML5, CSS3 và Javascript ES6 căn bản.',
        tasks: [
          { title: 'Xây dựng giao diện Landing Page với HTML/CSS', description: 'Tạo website đáp ứng (responsive) sử dụng Flexbox và Grid.', skillSlug: 'html-css', difficulty: 'EASY', estimatedMinutes: 120 },
          { title: 'Lập trình logic tương tác với Javascript', description: 'Tìm hiểu DOM manipulation, events, và async/await fetching API.', skillSlug: 'javascript', difficulty: 'EASY', estimatedMinutes: 180 }
        ]
      },
      {
        title: 'Giai đoạn 2: Modern Frontend Framework',
        description: 'Học React.js và Next.js để phát triển các Single Page Apps tối ưu.',
        tasks: [
          { title: 'Xây dựng Component & State Management', description: 'Sử dụng React Hooks (useState, useEffect, useContext) xây dựng giỏ hàng.', skillSlug: 'react', difficulty: 'MEDIUM', estimatedMinutes: 240 },
          { title: 'Định tuyến & Render phía máy chủ (SSR) với Next.js App Router', description: 'Thiết kế cấu trúc routes, dynamic layouts và SEO tags.', skillSlug: 'react', difficulty: 'MEDIUM', estimatedMinutes: 300 }
        ]
      },
      {
        title: 'Giai đoạn 3: Backend & Database Integration',
        description: 'Lập trình máy chủ Express.js, quản lý PostgreSQL qua Prisma ORM.',
        tasks: [
          { title: 'Thiết kế RESTful API với Express.js', description: 'Viết routing, controllers, và error handler middleware.', skillSlug: 'node-express', difficulty: 'MEDIUM', estimatedMinutes: 240 },
          { title: 'Thiết kế cơ sở dữ liệu với Prisma & PostgreSQL', description: 'Định nghĩa schema, thiết lập relationships và thực hiện migrations.', skillSlug: 'database', difficulty: 'HARD', estimatedMinutes: 300 }
        ]
      }
    ]
  },
  {
    id: 'data-science',
    title: 'Data Science & Machine Learning',
    description: 'Chinh phục khoa học dữ liệu, phân tích thống kê và các mô hình dự báo học máy sử dụng Python.',
    difficulty: 'Khó',
    durationWeeks: 16,
    totalSkills: 5,
    bannerGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    phases: [
      {
        title: 'Giai đoạn 1: Data Analytics Foundations',
        description: 'Sử dụng Python và thư viện để xử lý, làm sạch và phân tích trực quan hóa dữ liệu.',
        tasks: [
          { title: 'Làm sạch và phân tích dữ liệu với Pandas', description: 'Xử lý dữ liệu bị khuyết, lọc và gộp các DataFrames.', skillSlug: 'python', difficulty: 'EASY', estimatedMinutes: 180 },
          { title: 'Trực quan hóa dữ liệu với Matplotlib & Seaborn', description: 'Vẽ biểu đồ phân bố, tương quan để phát hiện xu hướng dữ liệu.', skillSlug: 'python', difficulty: 'EASY', estimatedMinutes: 120 }
        ]
      },
      {
        title: 'Giai đoạn 2: Machine Learning Models',
        description: 'Xây dựng và đánh giá các thuật toán học có giám sát và không giám sát.',
        tasks: [
          { title: 'Huấn luyện mô hình hồi quy tuyến tính & Logistic', description: 'Giải thích hệ số tương quan và đánh giá ma trận nhầm lẫn (Confusion Matrix).', skillSlug: 'machine-learning', difficulty: 'MEDIUM', estimatedMinutes: 240 },
          { title: 'Phân cụm khách hàng với thuật toán K-Means', description: 'Xác định số lượng cụm tối ưu qua phương pháp Elbow.', skillSlug: 'machine-learning', difficulty: 'HARD', estimatedMinutes: 200 }
        ]
      }
    ]
  },
  {
    id: 'mobile-native',
    title: 'Mobile App Development (React Native)',
    description: 'Xây dựng ứng dụng di động đa nền tảng iOS & Android cực kỳ mượt mà sử dụng React Native.',
    difficulty: 'Trung bình',
    durationWeeks: 10,
    totalSkills: 4,
    bannerGradient: 'from-orange-600 via-rose-600 to-red-600',
    phases: [
      {
        title: 'Giai đoạn 1: Native Components & Navigation',
        description: 'Làm quen với các thẻ UI gốc của di động và chuyển đổi màn hình.',
        tasks: [
          { title: 'Thiết kế giao diện Custom Button & Card', description: 'Sử dụng StyleSheet và Flexbox trong React Native để render giao diện đẹp mắt.', skillSlug: 'react-native', difficulty: 'EASY', estimatedMinutes: 150 },
          { title: 'Cài đặt React Navigation (Stack & Tab)', description: 'Tạo luồng chuyển tiếp màn hình trong ứng dụng di động.', skillSlug: 'react-native', difficulty: 'MEDIUM', estimatedMinutes: 180 }
        ]
      },
      {
        title: 'Giai đoạn 2: Mobile Features Integration',
        description: 'Tương tác với phần cứng thiết bị (Camera, Storage, Push Notifications).',
        tasks: [
          { title: 'Lưu trữ cục bộ với AsyncStorage', description: 'Lưu session đăng nhập và trạng thái offline của người dùng.', skillSlug: 'react-native', difficulty: 'MEDIUM', estimatedMinutes: 180 },
          { title: 'Tích hợp chụp ảnh bằng Expo Camera', description: 'Yêu cầu quyền truy cập camera và chụp hình hiển thị avatar.', skillSlug: 'react-native', difficulty: 'HARD', estimatedMinutes: 240 }
        ]
      }
    ]
  }
];

async function seed() {
  console.log('Clearing existing templates...');
  await prisma.roadmapTask.deleteMany();
  await prisma.roadmapPhase.deleteMany();
  await prisma.roadmapTemplate.deleteMany();

  console.log('Seeding templates...');
  for (const tpl of ROADMAP_TEMPLATES) {
    const createdTemplate = await prisma.roadmapTemplate.create({
      data: {
        id: tpl.id,
        title: tpl.title,
        description: tpl.description,
        difficulty: tpl.difficulty,
        durationWeeks: tpl.durationWeeks,
        totalSkills: tpl.totalSkills,
        bannerGradient: tpl.bannerGradient,
      }
    });

    for (let pIdx = 0; pIdx < tpl.phases.length; pIdx++) {
      const phase = tpl.phases[pIdx];
      const createdPhase = await prisma.roadmapPhase.create({
        data: {
          templateId: createdTemplate.id,
          title: phase.title,
          description: phase.description,
          orderIndex: pIdx
        }
      });

      for (let tIdx = 0; tIdx < phase.tasks.length; tIdx++) {
        const task = phase.tasks[tIdx];
        await prisma.roadmapTask.create({
          data: {
            phaseId: createdPhase.id,
            title: task.title,
            description: task.description,
            skillSlug: task.skillSlug,
            difficulty: task.difficulty,
            estimatedMinutes: task.estimatedMinutes,
            orderIndex: tIdx
          }
        });
      }
    }
  }

  console.log('Seed completed successfully!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
