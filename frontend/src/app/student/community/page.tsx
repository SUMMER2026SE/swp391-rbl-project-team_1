'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { Button } from '@/components/common/Button';
import { Compass, BookOpen, Clock, BarChart, ChevronRight, X, Sparkles, CheckCircle2, ArrowRight, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

interface RoadmapTaskTemplate {
  title: string;
  description: string;
  skillSlug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  estimatedMinutes: number;
}

interface RoadmapTemplate {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  durationWeeks: number;
  totalSkills: number;
  bannerGradient: string;
  accessType?: 'FREE' | 'PREMIUM';
  price?: number;
  phases: {
    title: string;
    description: string;
    tasks: RoadmapTaskTemplate[];
  }[];
}

const ROADMAP_TEMPLATES: RoadmapTemplate[] = [
  {
    id: 'web-fullstack',
    title: 'Fullstack Web Developer',
    description: 'Trở thành kỹ sư phát triển Web toàn diện từ Frontend đến Backend. Lộ trình được thiết kế chuẩn đầu ra của FPT University.',
    difficulty: 'Trung bình',
    durationWeeks: 12,
    totalSkills: 10,
    bannerGradient: 'from-blue-600 via-indigo-600 to-purple-600',
    accessType: 'PREMIUM',
    price: 500000,
    phases: [
      {
        title: 'Giai đoạn 1: Frontend Basics',
        description: 'Làm quen với HTML5, CSS3 và Javascript ES6 căn bản. Xây dựng trang web tĩnh chuẩn responsive.',
        tasks: [
          { title: 'Xây dựng giao diện Landing Page với HTML/CSS', description: 'Tạo website đáp ứng (responsive) sử dụng Flexbox và Grid layout.', skillSlug: 'html-css', difficulty: 'EASY', estimatedMinutes: 120 },
          { title: 'Lập trình logic tương tác với Javascript', description: 'Tìm hiểu DOM manipulation, events, và async/await fetching API.', skillSlug: 'javascript', difficulty: 'EASY', estimatedMinutes: 180 },
          { title: 'Responsive Design với Media Queries', description: 'Thiết kế giao diện tương thích mobile-first, tablet và desktop qua breakpoints CSS.', skillSlug: 'html-css', difficulty: 'EASY', estimatedMinutes: 90 },
          { title: 'Form Validation cơ bản với Javascript', description: 'Kiểm tra dữ liệu đầu vào (email, mật khẩu, số điện thoại) và hiển thị thông báo lỗi thân thiện.', skillSlug: 'javascript', difficulty: 'EASY', estimatedMinutes: 90 }
        ]
      },
      {
        title: 'Giai đoạn 2: Modern Frontend Framework',
        description: 'Học React.js và Next.js để phát triển các Single Page Apps tối ưu và quản lý trạng thái ứng dụng.',
        tasks: [
          { title: 'Xây dựng Component & State Management', description: 'Sử dụng React Hooks (useState, useEffect, useContext) xây dựng giỏ hàng.', skillSlug: 'react', difficulty: 'MEDIUM', estimatedMinutes: 240 },
          { title: 'Định tuyến & Render phía máy chủ (SSR) với Next.js App Router', description: 'Thiết kế cấu trúc routes, dynamic layouts và SEO tags.', skillSlug: 'react', difficulty: 'MEDIUM', estimatedMinutes: 300 },
          { title: 'Quản lý State toàn cục với Context API hoặc Zustand', description: 'So sánh Context API và Zustand, triển khai global store cho authentication và theme.', skillSlug: 'react', difficulty: 'MEDIUM', estimatedMinutes: 180 }
        ]
      },
      {
        title: 'Giai đoạn 3: Backend & Database Integration',
        description: 'Lập trình máy chủ Express.js, quản lý PostgreSQL qua Prisma ORM và bảo mật API với JWT.',
        tasks: [
          { title: 'Thiết kế RESTful API với Express.js', description: 'Viết routing, controllers, và error handler middleware theo chuẩn REST.', skillSlug: 'node-express', difficulty: 'MEDIUM', estimatedMinutes: 240 },
          { title: 'Thiết kế cơ sở dữ liệu với Prisma & PostgreSQL', description: 'Định nghĩa schema, thiết lập relationships và thực hiện migrations.', skillSlug: 'database', difficulty: 'HARD', estimatedMinutes: 300 },
          { title: 'Authentication & Authorization với JWT', description: 'Triển khai đăng nhập, cấp Access Token / Refresh Token và phân quyền role-based (RBAC).', skillSlug: 'node-express', difficulty: 'HARD', estimatedMinutes: 240 }
        ]
      },
      {
        title: 'Giai đoạn 4: API Integration & Testing',
        description: 'Kết nối Frontend với Backend, xử lý lỗi toàn diện và viết kiểm thử tự động để đảm bảo chất lượng.',
        tasks: [
          { title: 'Kết nối Frontend–Backend qua Axios/Fetch', description: 'Thiết lập interceptors cho Authorization header, tự động refresh token khi hết hạn.', skillSlug: 'react', difficulty: 'MEDIUM', estimatedMinutes: 180 },
          { title: 'Viết Unit Test với Jest & React Testing Library', description: 'Test các component UI, custom hooks và API service functions để đạt coverage ≥ 70%.', skillSlug: 'javascript', difficulty: 'HARD', estimatedMinutes: 240 },
          { title: 'Xử lý lỗi toàn diện & Loading State', description: 'Chuẩn hóa error boundary, skeleton loaders và toast notification khi API lỗi.', skillSlug: 'react', difficulty: 'MEDIUM', estimatedMinutes: 120 }
        ]
      },
      {
        title: 'Giai đoạn 5: Deployment & DevOps',
        description: 'Đóng gói ứng dụng, triển khai lên cloud và xây dựng pipeline CI/CD tự động để release nhanh chóng.',
        tasks: [
          { title: 'Containerize ứng dụng với Docker', description: 'Viết Dockerfile và docker-compose để chạy Frontend, Backend và Database trên cùng một môi trường.', skillSlug: 'devops', difficulty: 'HARD', estimatedMinutes: 240 },
          { title: 'Deploy lên Vercel (Frontend) & Render (Backend)', description: 'Cấu hình environment variables, custom domain và automatic preview deployments.', skillSlug: 'devops', difficulty: 'MEDIUM', estimatedMinutes: 120 },
          { title: 'Thiết lập CI/CD cơ bản với GitHub Actions', description: 'Tự động chạy lint, test và build mỗi khi push code lên nhánh main.', skillSlug: 'devops', difficulty: 'HARD', estimatedMinutes: 180 }
        ]
      },
      {
        title: 'Giai đoạn 6: Capstone Project',
        description: 'Tổng hợp toàn bộ kiến thức để xây dựng một sản phẩm Web hoàn chỉnh, trải qua code review và viết tài liệu kỹ thuật.',
        tasks: [
          { title: 'Xây dựng dự án tổng hợp end-to-end', description: 'Tự lên ý tưởng và thực hiện ứng dụng thực tế: chọn đề tài, thiết kế DB, code Frontend + Backend và deploy.', skillSlug: 'react', difficulty: 'EXPERT', estimatedMinutes: 600 },
          { title: 'Code Review & Refactoring', description: 'Review code của bạn cùng Mentor, áp dụng SOLID principles và tái cấu trúc để tăng khả năng bảo trì.', skillSlug: 'javascript', difficulty: 'HARD', estimatedMinutes: 180 },
          { title: 'Viết tài liệu kỹ thuật README', description: 'Soạn hướng dẫn cài đặt, kiến trúc hệ thống, API spec và changelog theo chuẩn open-source.', skillSlug: 'devops', difficulty: 'MEDIUM', estimatedMinutes: 90 }
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
    totalSkills: 12,
    bannerGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    accessType: 'PREMIUM',
    price: 750000,
    phases: [
      {
        title: 'Giai đoạn 1: Python Foundations',
        description: 'Làm quen với ngôn ngữ Python, cấu trúc dữ liệu và lập trình hướng đối tượng cơ bản.',
        tasks: [
          { title: 'Cú pháp cơ bản và kiểu dữ liệu Python', description: 'Nắm vững List, Dictionary, Tuple, Set và các hàm điều khiển luồng.', skillSlug: 'python', difficulty: 'EASY', estimatedMinutes: 120 },
          { title: 'Hàm và Lập trình hướng đối tượng (OOP)', description: 'Tạo Classes, Objects và áp dụng các tính chất Inheritance, Polymorphism.', skillSlug: 'python', difficulty: 'MEDIUM', estimatedMinutes: 180 },
          { title: 'Làm việc với File và Exception Handling', description: 'Đọc ghi file CSV/JSON và xử lý lỗi bằng khối try-except.', skillSlug: 'python', difficulty: 'EASY', estimatedMinutes: 90 }
        ]
      },
      {
        title: 'Giai đoạn 2: Data Manipulation (Pandas & NumPy)',
        description: 'Xử lý ma trận dữ liệu và làm sạch dữ liệu cấu trúc lớn.',
        tasks: [
          { title: 'Tính toán mảng đa chiều với NumPy', description: 'Thao tác các phép toán vector hóa, slicing mảng n-chiều.', skillSlug: 'python', difficulty: 'MEDIUM', estimatedMinutes: 120 },
          { title: 'Làm sạch và phân tích dữ liệu với Pandas', description: 'Xử lý dữ liệu bị khuyết (missing values), lọc và gộp các DataFrames.', skillSlug: 'python', difficulty: 'MEDIUM', estimatedMinutes: 180 },
          { title: 'Tính toán Pivot Table và GroupBy', description: 'Thực hiện gom nhóm dữ liệu để tính toán tổng hợp (aggregation).', skillSlug: 'python', difficulty: 'EASY', estimatedMinutes: 120 }
        ]
      },
      {
        title: 'Giai đoạn 3: Data Visualization',
        description: 'Kể chuyện bằng dữ liệu thông qua các biểu đồ trực quan mạnh mẽ.',
        tasks: [
          { title: 'Trực quan hóa cơ bản với Matplotlib', description: 'Vẽ Line chart, Bar chart và Scatter plot để phân tích xu hướng.', skillSlug: 'python', difficulty: 'EASY', estimatedMinutes: 120 },
          { title: 'Biểu đồ phân phối thống kê với Seaborn', description: 'Vẽ biểu đồ Boxplot, Violin plot và Heatmap để tìm kiếm tương quan.', skillSlug: 'python', difficulty: 'MEDIUM', estimatedMinutes: 150 },
          { title: 'Dashboard tương tác với Plotly', description: 'Tạo các biểu đồ có khả năng zoom, hover tooltips tương tác.', skillSlug: 'python', difficulty: 'HARD', estimatedMinutes: 180 }
        ]
      },
      {
        title: 'Giai đoạn 4: Statistics cơ bản',
        description: 'Nền tảng toán học và thống kê ứng dụng cho Khoa học dữ liệu.',
        tasks: [
          { title: 'Thống kê mô tả (Descriptive Statistics)', description: 'Tính mean, median, mode, variance và standard deviation.', skillSlug: 'statistics', difficulty: 'MEDIUM', estimatedMinutes: 120 },
          { title: 'Phân phối xác suất (Probability Distributions)', description: 'Tìm hiểu Normal Distribution, Binomial và Z-scores.', skillSlug: 'statistics', difficulty: 'HARD', estimatedMinutes: 180 },
          { title: 'Kiểm định giả thuyết (Hypothesis Testing)', description: 'Thực hiện A/B Testing, T-Test và P-value diễn giải.', skillSlug: 'statistics', difficulty: 'HARD', estimatedMinutes: 240 }
        ]
      },
      {
        title: 'Giai đoạn 5: Machine Learning - Regressions & Classification',
        description: 'Xây dựng thuật toán Học có giám sát (Supervised Learning).',
        tasks: [
          { title: 'Hồi quy tuyến tính (Linear Regression)', description: 'Xây dựng mô hình dự báo giá trị liên tục bằng scikit-learn.', skillSlug: 'machine-learning', difficulty: 'MEDIUM', estimatedMinutes: 180 },
          { title: 'Phân loại Logistic (Logistic Regression)', description: 'Dự báo xác suất nhị phân (VD: Khách hàng rời rạc).', skillSlug: 'machine-learning', difficulty: 'MEDIUM', estimatedMinutes: 180 },
          { title: 'Mô hình Cây quyết định (Decision Trees & Random Forest)', description: 'Sử dụng mô hình ensemble để tăng độ chính xác dự đoán.', skillSlug: 'machine-learning', difficulty: 'HARD', estimatedMinutes: 240 }
        ]
      },
      {
        title: 'Giai đoạn 6: Model Evaluation & Tuning',
        description: 'Đánh giá chất lượng và tinh chỉnh siêu tham số mô hình ML.',
        tasks: [
          { title: 'Các chỉ số đánh giá Classification', description: 'Tính toán Precision, Recall, F1-Score và ROC/AUC.', skillSlug: 'machine-learning', difficulty: 'HARD', estimatedMinutes: 180 },
          { title: 'Xử lý dữ liệu mất cân bằng (Imbalanced Data)', description: 'Sử dụng kỹ thuật SMOTE hoặc Class Weights.', skillSlug: 'machine-learning', difficulty: 'HARD', estimatedMinutes: 150 },
          { title: 'Cross-Validation & Grid Search', description: 'K-Fold validation và tự động dò tìm bộ siêu tham số tốt nhất.', skillSlug: 'machine-learning', difficulty: 'EXPERT', estimatedMinutes: 240 }
        ]
      },
      {
        title: 'Giai đoạn 7: Deep Learning Foundations',
        description: 'Làm quen với mạng nơ-ron nhân tạo thông qua PyTorch hoặc TensorFlow.',
        tasks: [
          { title: 'Mạng nơ-ron cơ bản (ANN)', description: 'Khái niệm Forward Pass, Backpropagation và Activation Functions.', skillSlug: 'machine-learning', difficulty: 'HARD', estimatedMinutes: 180 },
          { title: 'Phân loại hình ảnh bằng CNN', description: 'Xây dựng mạng tích chập (Convolutional) để nhận dạng ảnh số.', skillSlug: 'machine-learning', difficulty: 'EXPERT', estimatedMinutes: 300 },
          { title: 'Lưu và triển khai mô hình (Model Deployment)', description: 'Export mô hình ra định dạng ONNX hoặc Pickle.', skillSlug: 'devops', difficulty: 'MEDIUM', estimatedMinutes: 120 }
        ]
      },
      {
        title: 'Giai đoạn 8: Capstone Project (Dự báo thực tế)',
        description: 'Áp dụng vào một bài toán phân tích kinh doanh hoặc nhận dạng máy học thực tế.',
        tasks: [
          { title: 'Khai phá dữ liệu (EDA) trên tập dữ liệu lớn', description: 'Tải dataset từ Kaggle, làm sạch và tóm tắt thống kê toàn diện.', skillSlug: 'python', difficulty: 'HARD', estimatedMinutes: 240 },
          { title: 'Feature Engineering & Training', description: 'Tạo sinh đặc trưng mới và huấn luyện nhiều mô hình để so sánh.', skillSlug: 'machine-learning', difficulty: 'EXPERT', estimatedMinutes: 300 },
          { title: 'Viết báo cáo Jupyter Notebook', description: 'Trình bày markdown kết luận kinh doanh và insight lấy được từ mô hình.', skillSlug: 'python', difficulty: 'MEDIUM', estimatedMinutes: 120 }
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
    totalSkills: 8,
    bannerGradient: 'from-orange-600 via-rose-600 to-red-600',
    accessType: 'FREE',
    price: 0,
    phases: [
      {
        title: 'Giai đoạn 1: JS/ES6 Foundations cho Mobile',
        description: 'Ôn tập nền tảng ngôn ngữ lõi để viết code React Native chuẩn.',
        tasks: [
          { title: 'Thao tác với Array/Object destructuring', description: 'Ứng dụng destructuring và spread operators để quản lý data mobile.', skillSlug: 'javascript', difficulty: 'EASY', estimatedMinutes: 90 },
          { title: 'Arrow functions & Asynchronous JS', description: 'Quản lý Promise, async/await để chuẩn bị kết nối API di động.', skillSlug: 'javascript', difficulty: 'MEDIUM', estimatedMinutes: 120 },
          { title: 'Tư duy cấu trúc Component trong React', description: 'Thực hành tách nhỏ các khối giao diện có thể tái sử dụng.', skillSlug: 'react', difficulty: 'EASY', estimatedMinutes: 90 }
        ]
      },
      {
        title: 'Giai đoạn 2: React Native Core Components',
        description: 'Làm quen với các thẻ UI gốc của di động và tương tác vật lý.',
        tasks: [
          { title: 'Thiết kế giao diện View, Text & Image', description: 'Sử dụng StyleSheet và Flexbox để render UI responsive theo màn hình điện thoại.', skillSlug: 'react-native', difficulty: 'EASY', estimatedMinutes: 120 },
          { title: 'Xử lý tương tác Touch & ScrollView', description: 'Sử dụng TouchableOpacity, Pressable và ScrollView cho các màn hình dài.', skillSlug: 'react-native', difficulty: 'EASY', estimatedMinutes: 120 },
          { title: 'FlatList & Hiệu năng danh sách lớn', description: 'Hiển thị dữ liệu danh sách vô hạn (infinite scrolling) siêu mượt.', skillSlug: 'react-native', difficulty: 'MEDIUM', estimatedMinutes: 180 }
        ]
      },
      {
        title: 'Giai đoạn 3: Navigation & State Management',
        description: 'Quản lý luồng màn hình và lưu trữ trạng thái người dùng trong App.',
        tasks: [
          { title: 'Cài đặt React Navigation (Stack & Tab)', description: 'Tạo Bottom Tabs và Stack Navigation chuyển qua lại các màn hình.', skillSlug: 'react-native', difficulty: 'MEDIUM', estimatedMinutes: 180 },
          { title: 'Truyền tham số giữa các màn hình (Params)', description: 'Truyền ID dữ liệu từ màn hình danh sách sang màn hình chi tiết.', skillSlug: 'react-native', difficulty: 'MEDIUM', estimatedMinutes: 120 },
          { title: 'Lưu trữ cục bộ với AsyncStorage', description: 'Lưu session đăng nhập và trạng thái offline của người dùng.', skillSlug: 'react-native', difficulty: 'MEDIUM', estimatedMinutes: 150 }
        ]
      },
      {
        title: 'Giai đoạn 4: Native Module & API Integration',
        description: 'Tương tác với phần cứng thiết bị và dữ liệu đám mây thực tế.',
        tasks: [
          { title: 'Fetch API và hiển thị Loading Spinner', description: 'Lấy dữ liệu RESTful API và hiển thị ActivityIndicator trong lúc đợi.', skillSlug: 'react-native', difficulty: 'MEDIUM', estimatedMinutes: 120 },
          { title: 'Tích hợp chụp ảnh (Camera/Image Picker)', description: 'Yêu cầu quyền OS truy cập album và cho người dùng upload avatar.', skillSlug: 'react-native', difficulty: 'HARD', estimatedMinutes: 240 },
          { title: 'Bản đồ di động (Maps & Location)', description: 'Lấy tọa độ GPS người dùng và hiển thị marker trên bản đồ Google/Apple.', skillSlug: 'react-native', difficulty: 'HARD', estimatedMinutes: 200 }
        ]
      },
      {
        title: 'Giai đoạn 5: Publish App (Capstone)',
        description: 'Tối ưu hiệu năng, đóng gói (build) ứng dụng và đưa lên Store.',
        tasks: [
          { title: 'Thiết kế App Icon & Splash Screen', description: 'Tạo icon ứng dụng và cấu hình màn hình chờ khởi động.', skillSlug: 'react-native', difficulty: 'EASY', estimatedMinutes: 120 },
          { title: 'Xây dựng dự án App tổng hợp', description: 'Kết nối toàn bộ Frontend React Native với Backend API có sẵn.', skillSlug: 'react', difficulty: 'EXPERT', estimatedMinutes: 400 },
          { title: 'Build tệp APK/AAB cho Android', description: 'Ký chứng chỉ số (Keystore) và chuẩn bị release ứng dụng Android.', skillSlug: 'devops', difficulty: 'HARD', estimatedMinutes: 180 }
        ]
      }
    ]
  },
  {
    id: 'devops-cloud',
    title: 'DevOps & Cloud Engineer',
    description: 'Triển khai và vận hành hệ thống trên Cloud, container hóa ứng dụng và xây dựng pipeline CI/CD chuyên nghiệp.',
    difficulty: 'Khó',
    durationWeeks: 14,
    totalSkills: 5,
    bannerGradient: 'from-slate-600 via-gray-600 to-zinc-600',
    accessType: 'PREMIUM',
    price: 800000,
    phases: [
      {
        title: 'Giai đoạn 1: Linux & Scripting Foundations',
        description: 'Làm quen với hệ điều hành Linux và tự động hóa tác vụ.',
        tasks: [
          { title: 'Quản trị hệ thống Linux cơ bản', description: 'Các lệnh bash, quản lý file, phân quyền (chmod, chown) và process.', skillSlug: 'devops', difficulty: 'MEDIUM', estimatedMinutes: 180 },
          { title: 'Shell Scripting', description: 'Viết bash script để tự động hóa sao lưu dữ liệu và cron jobs.', skillSlug: 'devops', difficulty: 'MEDIUM', estimatedMinutes: 240 },
          { title: 'Mạng máy tính cơ bản', description: 'Hiểu về TCP/IP, DNS, HTTP/HTTPS và các công cụ ping, curl, netstat.', skillSlug: 'devops', difficulty: 'MEDIUM', estimatedMinutes: 120 }
        ]
      },
      {
        title: 'Giai đoạn 2: Containerization với Docker',
        description: 'Đóng gói ứng dụng để chạy nhất quán trên mọi môi trường.',
        tasks: [
          { title: 'Xây dựng Dockerfile', description: 'Tối ưu image size với multi-stage builds cho Node.js/Python apps.', skillSlug: 'devops', difficulty: 'MEDIUM', estimatedMinutes: 180 },
          { title: 'Docker Compose', description: 'Chạy ứng dụng đa dịch vụ (Frontend, Backend, Database) cùng lúc.', skillSlug: 'devops', difficulty: 'HARD', estimatedMinutes: 240 },
          { title: 'Quản lý Docker Volumes & Networks', description: 'Lưu trữ dữ liệu bền vững và bảo mật mạng giữa các container.', skillSlug: 'devops', difficulty: 'MEDIUM', estimatedMinutes: 120 }
        ]
      },
      {
        title: 'Giai đoạn 3: CI/CD Pipelines',
        description: 'Xây dựng quy trình tích hợp và triển khai liên tục.',
        tasks: [
          { title: 'Thiết lập GitHub Actions cơ bản', description: 'Tạo workflow chạy linter và unit tests khi có push/pull request.', skillSlug: 'devops', difficulty: 'MEDIUM', estimatedMinutes: 180 },
          { title: 'Tự động hóa Build & Push Docker Image', description: 'Push image lên Docker Hub hoặc AWS ECR qua CI.', skillSlug: 'devops', difficulty: 'HARD', estimatedMinutes: 200 },
          { title: 'Triển khai CD (Continuous Deployment)', description: 'Tự động deploy code mới lên server thông qua SSH actions.', skillSlug: 'devops', difficulty: 'HARD', estimatedMinutes: 240 }
        ]
      },
      {
        title: 'Giai đoạn 4: Cloud Infrastructure (AWS)',
        description: 'Triển khai kiến trúc đám mây có khả năng mở rộng cao.',
        tasks: [
          { title: 'Cấu hình VPC & EC2', description: 'Thiết lập mạng ảo riêng, subnets, security groups và chạy máy chủ EC2.', skillSlug: 'devops', difficulty: 'HARD', estimatedMinutes: 240 },
          { title: 'Lưu trữ S3 & RDS', description: 'Cấu hình bucket S3 cho tài nguyên tĩnh và database RDS an toàn.', skillSlug: 'devops', difficulty: 'MEDIUM', estimatedMinutes: 180 },
          { title: 'Load Balancing & Auto Scaling', description: 'Cân bằng tải lưu lượng truy cập bằng ALB và tự động mở rộng instance.', skillSlug: 'devops', difficulty: 'EXPERT', estimatedMinutes: 300 }
        ]
      },
      {
        title: 'Giai đoạn 5: Infrastructure as Code (Terraform)',
        description: 'Quản lý cơ sở hạ tầng bằng code thay vì thao tác thủ công.',
        tasks: [
          { title: 'Cú pháp HCL và Terraform cơ bản', description: 'Định nghĩa providers, resources và variables.', skillSlug: 'devops', difficulty: 'MEDIUM', estimatedMinutes: 180 },
          { title: 'Triển khai AWS Architecture', description: 'Dùng Terraform để tự động hóa việc tạo VPC, EC2 và S3.', skillSlug: 'devops', difficulty: 'HARD', estimatedMinutes: 240 },
          { title: 'Quản lý Terraform State', description: 'Lưu trữ file state an toàn trên S3 và khóa state với DynamoDB.', skillSlug: 'devops', difficulty: 'HARD', estimatedMinutes: 120 }
        ]
      },
      {
        title: 'Giai đoạn 6: Monitoring & Logging (Capstone)',
        description: 'Giám sát hệ thống và phân tích log để duy trì tính sẵn sàng.',
        tasks: [
          { title: 'Cài đặt Prometheus & Grafana', description: 'Thu thập metrics phần cứng (CPU, RAM) và tạo dashboard theo dõi.', skillSlug: 'devops', difficulty: 'HARD', estimatedMinutes: 240 },
          { title: 'Thiết lập Alerting', description: 'Gửi cảnh báo qua Slack/Email khi server quá tải hoặc down.', skillSlug: 'devops', difficulty: 'MEDIUM', estimatedMinutes: 150 },
          { title: 'Dự án tổng hợp: Kube/Cloud Deployment', description: 'Thiết kế kiến trúc toàn diện từ code, CI/CD, Terraform đến Monitoring.', skillSlug: 'devops', difficulty: 'EXPERT', estimatedMinutes: 400 }
        ]
      }
    ]
  },
  {
    id: 'ielts-65-plus',
    title: 'IELTS 6.5+ trong 3 tháng',
    description: 'Lộ trình luyện thi IELTS toàn diện 4 kỹ năng Nghe Nói Đọc Viết theo khung thời gian 3 tháng.',
    difficulty: 'Trung bình',
    durationWeeks: 12,
    totalSkills: 4,
    bannerGradient: 'from-cyan-600 via-blue-600 to-indigo-600',
    accessType: 'FREE',
    price: 0,
    phases: [
      {
        title: 'Giai đoạn 1: Nền tảng Từ vựng & Ngữ pháp',
        description: 'Củng cố các chủ điểm ngữ pháp IELTS và học từ vựng theo chủ đề cơ bản.',
        tasks: [
          { title: 'Ôn tập 12 thì cơ bản', description: 'Làm bài tập trắc nghiệm và điền từ về thì Hiện tại, Quá khứ, Tương lai.', skillSlug: 'english', difficulty: 'EASY', estimatedMinutes: 120 },
          { title: 'Từ vựng chủ đề Giáo dục & Công việc', description: 'Học 100 từ vựng cốt lõi qua flashcards, luyện phát âm chuẩn.', skillSlug: 'english', difficulty: 'MEDIUM', estimatedMinutes: 150 },
          { title: 'Câu phức và Mệnh đề quan hệ', description: 'Cải thiện cấu trúc câu để đạt điểm Grammatical Range cao hơn.', skillSlug: 'english', difficulty: 'MEDIUM', estimatedMinutes: 120 }
        ]
      },
      {
        title: 'Giai đoạn 2: Kỹ năng Nghe (Listening) Cơ bản',
        description: 'Làm quen format đề thi Listening và các dạng câu hỏi thường gặp.',
        tasks: [
          { title: 'Luyện nghe Form Completion', description: 'Nghe đánh vần tên, số điện thoại, ngày tháng chuẩn xác (Section 1).', skillSlug: 'english', difficulty: 'EASY', estimatedMinutes: 120 },
          { title: 'Kỹ năng bắt Keywords & Paraphrasing', description: 'Nhận diện từ đồng nghĩa trong dạng bài Multiple Choice.', skillSlug: 'english', difficulty: 'MEDIUM', estimatedMinutes: 180 },
          { title: 'Luyện nghe Map Labeling', description: 'Học từ vựng chỉ phương hướng và xác định vị trí trên bản đồ.', skillSlug: 'english', difficulty: 'HARD', estimatedMinutes: 150 }
        ]
      },
      {
        title: 'Giai đoạn 3: Kỹ năng Đọc (Reading) Tốc độ',
        description: 'Áp dụng kỹ năng Skimming & Scanning để tiết kiệm thời gian đọc hiểu.',
        tasks: [
          { title: 'Kỹ năng Skimming & Scanning', description: 'Thực hành đọc lướt để tìm ý chính và quét tìm thông tin cụ thể.', skillSlug: 'english', difficulty: 'MEDIUM', estimatedMinutes: 120 },
          { title: 'Chiến thuật True/False/Not Given', description: 'Phân biệt rạch ròi sự khác nhau giữa False và Not Given.', skillSlug: 'english', difficulty: 'HARD', estimatedMinutes: 180 },
          { title: 'Matching Headings & Information', description: 'Đọc hiểu nội dung đoạn văn để ghép với tiêu đề phù hợp.', skillSlug: 'english', difficulty: 'HARD', estimatedMinutes: 200 }
        ]
      },
      {
        title: 'Giai đoạn 4: Kỹ năng Viết (Writing) Học thuật',
        description: 'Xây dựng bố cục bài viết logic và sử dụng từ nối linh hoạt.',
        tasks: [
          { title: 'Phân tích Biểu đồ (Task 1)', description: 'Viết báo cáo mô tả xu hướng Line graph, Bar chart và Pie chart.', skillSlug: 'english', difficulty: 'MEDIUM', estimatedMinutes: 180 },
          { title: 'Viết luận Tranh luận (Task 2)', description: 'Lên dàn ý và viết mở bài chuẩn xác cho dạng Agree/Disagree.', skillSlug: 'english', difficulty: 'HARD', estimatedMinutes: 240 },
          { title: 'Sử dụng Cohesive Devices', description: 'Sử dụng từ nối (Furthermore, However, Consequently) để liên kết ý tưởng.', skillSlug: 'english', difficulty: 'MEDIUM', estimatedMinutes: 120 }
        ]
      },
      {
        title: 'Giai đoạn 5: Kỹ năng Nói (Speaking) Tự nhiên',
        description: 'Luyện tập phản xạ trả lời câu hỏi và mở rộng ý tưởng trôi chảy.',
        tasks: [
          { title: 'Speaking Part 1: Giới thiệu bản thân', description: 'Trả lời các câu hỏi về sở thích, quê quán, công việc một cách tự nhiên.', skillSlug: 'english', difficulty: 'EASY', estimatedMinutes: 120 },
          { title: 'Speaking Part 2: Cue Card', description: 'Sử dụng kỹ thuật 1 phút ghi chú để nói liên tục trong 2 phút.', skillSlug: 'english', difficulty: 'HARD', estimatedMinutes: 180 },
          { title: 'Speaking Part 3: Thảo luận sâu', description: 'Phát triển ý kiến đa chiều, đưa ra ví dụ và so sánh.', skillSlug: 'english', difficulty: 'EXPERT', estimatedMinutes: 200 }
        ]
      },
      {
        title: 'Giai đoạn 6: Thi Thử Thực Tế (Mock Tests)',
        description: 'Làm đề thi thử trọn vẹn dưới áp lực thời gian để đánh giá trình độ.',
        tasks: [
          { title: 'Mock Test Listening & Reading', description: 'Làm bài liên tục 120 phút không nghỉ ngơi, sử dụng đề Cambridge IELTS.', skillSlug: 'english', difficulty: 'HARD', estimatedMinutes: 180 },
          { title: 'Mock Test Writing Task 1+2', description: 'Hoàn thành 2 bài viết trong vòng đúng 60 phút.', skillSlug: 'english', difficulty: 'EXPERT', estimatedMinutes: 120 },
          { title: '1-on-1 Speaking Test Review', description: 'Thi nói với Mentor và nhận feedback chi tiết về phát âm, ngữ pháp.', skillSlug: 'english', difficulty: 'HARD', estimatedMinutes: 90 }
        ]
      }
    ]
  },
  {
    id: 'jlpt-n5',
    title: 'JLPT N5 cho người mới bắt đầu',
    description: 'Làm chủ Hiragana, Katakana, ngữ pháp và 800 từ vựng cơ bản N5.',
    difficulty: 'Dễ',
    durationWeeks: 8,
    totalSkills: 4,
    bannerGradient: 'from-pink-500 via-rose-500 to-red-500',
    accessType: 'FREE',
    price: 0,
    phases: [
      {
        title: 'Giai đoạn 1: Bảng Chữ Cái & Phát Âm',
        description: 'Thuộc lòng bảng chữ cái và các quy tắc phát âm cơ bản của tiếng Nhật.',
        tasks: [
          { title: 'Bảng chữ mềm Hiragana', description: 'Học viết và phát âm 46 ký tự Hiragana cơ bản, biến âm, ảo âm.', skillSlug: 'japanese', difficulty: 'EASY', estimatedMinutes: 180 },
          { title: 'Bảng chữ cứng Katakana', description: 'Học viết và phân biệt các ký tự Katakana dễ nhầm lẫn (shi/tsu).', skillSlug: 'japanese', difficulty: 'EASY', estimatedMinutes: 180 },
          { title: 'Quy tắc Trường âm, Xúc âm', description: 'Luyện đọc các từ vựng có trường âm và xúc âm (chữ tsu nhỏ).', skillSlug: 'japanese', difficulty: 'EASY', estimatedMinutes: 90 }
        ]
      },
      {
        title: 'Giai đoạn 2: Từ Vựng N5 Mở Đầu',
        description: 'Tích lũy vốn từ vựng thiết yếu cho giao tiếp hằng ngày.',
        tasks: [
          { title: 'Số đếm, thời gian, ngày tháng', description: 'Cách đọc giờ giấc, thứ ngày tháng năm và đếm đồ vật.', skillSlug: 'japanese', difficulty: 'EASY', estimatedMinutes: 120 },
          { title: 'Từ vựng chủ đề gia đình, trường học', description: 'Học từ vựng chỉ người thân, địa điểm và đồ dùng học tập.', skillSlug: 'japanese', difficulty: 'EASY', estimatedMinutes: 150 },
          { title: 'Động từ & Tính từ cơ bản', description: 'Các động từ sinh hoạt hằng ngày (ăn, ngủ, đi) và tính từ (to, nhỏ, nóng, lạnh).', skillSlug: 'japanese', difficulty: 'MEDIUM', estimatedMinutes: 180 }
        ]
      },
      {
        title: 'Giai đoạn 3: Ngữ Pháp Sơ Cấp (Phần 1)',
        description: 'Xây dựng nền tảng ngữ pháp câu cơ bản.',
        tasks: [
          { title: 'Cấu trúc câu khẳng định/phủ định (Desu/Masu)', description: 'Sử dụng thể lịch sự ở thì hiện tại và quá khứ.', skillSlug: 'japanese', difficulty: 'MEDIUM', estimatedMinutes: 120 },
          { title: 'Các trợ từ cơ bản (Wa, Ga, O, Ni, De)', description: 'Phân biệt cách dùng trợ từ chỉ phương hướng, phương tiện, địa điểm.', skillSlug: 'japanese', difficulty: 'HARD', estimatedMinutes: 200 },
          { title: 'Câu hỏi nghi vấn & Từ để hỏi', description: 'Đặt câu hỏi với nan (cái gì), doko (ở đâu), itsu (khi nào).', skillSlug: 'japanese', difficulty: 'MEDIUM', estimatedMinutes: 120 }
        ]
      },
      {
        title: 'Giai đoạn 4: Kanji N5 Cơ Bản',
        description: 'Làm quen với chữ Hán (Kanji) đơn giản và thông dụng nhất.',
        tasks: [
          { title: 'Kanji chữ số và thứ ngày', description: 'Học cách viết và âm On/Kun của bộ chữ số 1-10 và các ngày trong tuần.', skillSlug: 'japanese', difficulty: 'MEDIUM', estimatedMinutes: 150 },
          { title: 'Kanji tự nhiên & Con người', description: 'Học các chữ Nhật, Nguyệt, Sơn, Xuyên, Nhân, Nam, Nữ.', skillSlug: 'japanese', difficulty: 'MEDIUM', estimatedMinutes: 150 },
          { title: 'Luyện tập đọc hiểu câu chứa Kanji', description: 'Thực hành đọc câu có ghép Kanji sơ cấp không cần Furigana.', skillSlug: 'japanese', difficulty: 'HARD', estimatedMinutes: 120 }
        ]
      },
      {
        title: 'Giai đoạn 5: Ngữ Pháp Sơ Cấp (Phần 2)',
        description: 'Các mẫu câu xin phép, rủ rê và chỉ định.',
        tasks: [
          { title: 'Mẫu câu rủ rê (Mashou/Masenka)', description: 'Cách rủ người khác cùng làm một việc gì đó.', skillSlug: 'japanese', difficulty: 'MEDIUM', estimatedMinutes: 120 },
          { title: 'Mẫu câu xin phép (Te mo ii desu ka)', description: 'Chia động từ thể TE và cấu trúc xin phép/cấm đoán.', skillSlug: 'japanese', difficulty: 'HARD', estimatedMinutes: 180 },
          { title: 'Chỉ thị từ (Ko/So/A/Do)', description: 'Sử dụng Kore, Sore, Are, Kono, Sono, Ano.', skillSlug: 'japanese', difficulty: 'MEDIUM', estimatedMinutes: 90 }
        ]
      },
      {
        title: 'Giai đoạn 6: Nghe Hiểu & Luyện Thi N5',
        description: 'Kỹ năng nghe giao tiếp và ôn tập tổng hợp giải đề JLPT.',
        tasks: [
          { title: 'Luyện nghe tranh hội thoại (Mondai 1-2)', description: 'Nghe đoạn hội thoại ngắn và chọn đáp án tranh phù hợp.', skillSlug: 'japanese', difficulty: 'MEDIUM', estimatedMinutes: 180 },
          { title: 'Luyện nghe phản xạ (Mondai 3-4)', description: 'Nghe câu hỏi và chọn câu đáp trả tức thì.', skillSlug: 'japanese', difficulty: 'HARD', estimatedMinutes: 150 },
          { title: 'Thi thử JLPT N5 (Mock Test)', description: 'Làm đề thi mô phỏng JLPT N5 đầy đủ Từ vựng, Ngữ pháp, Đọc, Nghe.', skillSlug: 'japanese', difficulty: 'EXPERT', estimatedMinutes: 180 }
        ]
      }
    ]
  }
];

export default function CommunityRoadmaps() {
  const [selectedTemplate, setSelectedTemplate] = useState<RoadmapTemplate | null>(null);
  const [skillsList, setSkillsList] = useState<any[]>([]);
  const [isCloning, setIsCloning] = useState<boolean>(false);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [purchasedRoadmaps, setPurchasedRoadmaps] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchSkills();
    fetchPurchasedRoadmaps();
  }, []);

  const fetchPurchasedRoadmaps = async () => {
    try {
      const response = await api.get('/roadmap/purchased');
      if (response.data.success) {
        setPurchasedRoadmaps(response.data.purchasedRoadmapIds || []);
      }
    } catch (_) {}
  };

  const fetchSkills = async () => {
    try {
      const response = await api.get('/auth/skills');
      if (response.data.success) {
        // Flatten children to make slug mapping easier
        const flat: any[] = [];
        response.data.skills.forEach((s: any) => {
          flat.push(s);
          if (s.children && s.children.length > 0) {
            flat.push(...s.children);
          }
        });
        setSkillsList(flat);
      }
    } catch (_) {
      toast.error('Không thể tải danh sách kỹ năng hệ thống.');
    }
  };

  const getSkillIdBySlug = (slug: string): string => {
    const matched = skillsList.find(s => s.slug === slug || s.name.toLowerCase().includes(slug));
    if (matched) return matched.id;
    // Default fallback to first skill if available, otherwise mock UUID
    return skillsList[0]?.id || 'default-skill-id';
  };

  const handleCloneRoadmap = async (template: RoadmapTemplate) => {
    setIsCloning(true);
    const loadingToast = toast.loading(`Đang khởi tạo lộ trình "${template.title}" vào bảng học tập của bạn...`);
    
    try {
      let createdCount = 0;
      // Extract all tasks from phases
      const allTasks: RoadmapTaskTemplate[] = [];
      template.phases.forEach(phase => {
        phase.tasks.forEach(t => {
          allTasks.push(t);
        });
      });

      // Post tasks one by one to ensure database order
      for (const t of allTasks) {
        const skillId = getSkillIdBySlug(t.skillSlug);
        
        await api.post('/workspace/tasks', {
          title: t.title,
          description: t.description,
          skillId,
          difficulty: t.difficulty,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days deadline default
          estimatedMinutes: t.estimatedMinutes
        });
        createdCount++;
      }

      toast.success(`Đã thêm thành công ${createdCount} nhiệm vụ vào Bảng học tập! 🎉`, { id: loadingToast });
      setSelectedTemplate(null);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi sao chép lộ trình.';
      toast.error(msg, { id: loadingToast });
    } finally {
      setIsCloning(false);
    }
  };

  const handlePurchaseRoadmap = async (template: RoadmapTemplate) => {
    setIsPurchasing(true);
    const loadingToast = toast.loading(`Đang xử lý thanh toán cho "${template.title}"...`);
    
    try {
      const res = await api.post('/roadmap/purchase', {
        roadmapId: template.id,
        price: template.price
      });
      
      if (res.data.success) {
        toast.success(`Mua lộ trình thành công! Mở khóa nội dung Premium.`, { id: loadingToast });
        setPurchasedRoadmaps([...purchasedRoadmaps, template.id]);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi thanh toán.';
      toast.error(msg, { id: loadingToast });
      
      if (msg.includes('Số dư không đủ')) {
        // Offer quick navigation to wallet
        toast(
          (t) => (
            <div className="flex flex-col gap-2">
              <span className="text-sm">Số dư của bạn không đủ để mua lộ trình này.</span>
              <button 
                onClick={() => {
                  toast.dismiss(t.id);
                  router.push('/student/wallet');
                }}
                className="bg-amber-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-amber-600 transition"
              >
                Đến Ví của tôi ngay
              </button>
            </div>
          ),
          { duration: 5000 }
        );
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Thư viện Lộ trình & Mẫu học tập
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Khám phá các lộ trình học tập tiêu chuẩn được hội đồng chuyên môn FPT phê duyệt và nhân bản về không gian cá nhân.
          </p>
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ROADMAP_TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              {/* Card Banner */}
              <div className={`h-36 bg-gradient-to-tr ${tpl.bannerGradient} p-6 flex flex-col justify-between relative`}>
                <div className="absolute inset-0 bg-slate-950/20 mix-blend-multiply"></div>
                <div className="z-10 flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-950/40 backdrop-blur-sm px-2.5 py-1 rounded-full text-slate-200">
                      Lộ trình mẫu
                    </span>
                    {tpl.accessType === 'PREMIUM' ? (
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-amber-400 border border-amber-500/30">
                        PREMIUM - {tpl.price?.toLocaleString()} VNĐ
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-emerald-400 border border-emerald-500/30">
                        FREE
                      </span>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white">
                    <Compass className="w-4 h-4 animate-spin-slow" />
                  </div>
                </div>
                <h3 className="z-10 text-white font-bold text-xl drop-shadow-md">
                  {tpl.title}
                </h3>
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-4">
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                  {tpl.description}
                </p>

                {/* Badges Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                  <div className="bg-slate-950/50 rounded-xl p-2 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">Độ khó</span>
                    <span className="text-slate-200 text-xs font-semibold">{tpl.difficulty}</span>
                  </div>
                  <div className="bg-slate-950/50 rounded-xl p-2 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">Thời gian</span>
                    <span className="text-slate-200 text-xs font-semibold">{tpl.durationWeeks} tuần</span>
                  </div>
                  <div className="bg-slate-950/50 rounded-xl p-2 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">Kỹ năng</span>
                    <span className="text-slate-200 text-xs font-semibold">{tpl.totalSkills} Units</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="p-6 pt-0">
              <Button
                onClick={() => setSelectedTemplate(tpl)}
                className="w-full bg-slate-800 hover:bg-blue-600 hover:text-white transition-all duration-300 py-2.5 rounded-xl border border-slate-700 flex items-center justify-center gap-2 group-hover:border-blue-500/30"
              >
                <span>Xem chi tiết & Lưu</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Side Slide Drawer for Detailed Roadmap Preview */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-screen shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-in">
            {/* Drawer Header */}
            <div className={`p-6 bg-gradient-to-r ${selectedTemplate.bannerGradient} text-white relative flex justify-between items-start`}>
              <div className="absolute inset-0 bg-slate-950/30 mix-blend-multiply"></div>
              <div className="z-10 space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider bg-black/30 px-2.5 py-1 rounded-full">
                  Lộ Trình Đào Tạo
                </span>
                <h2 className="text-2xl font-extrabold tracking-tight drop-shadow-md">{selectedTemplate.title}</h2>
                <p className="text-slate-200 text-xs max-w-md">{selectedTemplate.description}</p>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body - Timeline Phases */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/50">
              <h4 className="text-sm font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                Các giai đoạn đào tạo ({selectedTemplate.phases.length})
              </h4>

              <div className="relative border-l border-slate-800 pl-6 ml-3 space-y-8">
                {selectedTemplate.phases.map((phase, pIdx) => {
                  const isLocked = selectedTemplate.accessType === 'PREMIUM' && !purchasedRoadmaps.includes(selectedTemplate.id);
                  return (
                  <div key={pIdx} className="relative">
                    {/* Circle icon on timeline */}
                    <div className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-slate-900 border-2 border-blue-500 flex items-center justify-center text-xs text-blue-400 font-bold shadow-md shadow-blue-500/20">
                      {pIdx + 1}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h5 className="text-slate-100 font-bold text-base leading-snug">{phase.title}</h5>
                        <p className="text-slate-400 text-xs mt-0.5">{phase.description}</p>
                      </div>

                      {/* Tasks in phase */}
                      <div className="space-y-2 relative">
                        {isLocked && (
                          <div className="absolute inset-0 z-10 bg-slate-950/60 backdrop-blur-md flex flex-col items-center justify-center rounded-xl border border-slate-800/80">
                            <Lock className="w-5 h-5 text-amber-500 mb-1" />
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Nội dung Premium</span>
                          </div>
                        )}
                        <div className={`space-y-2 ${isLocked ? "opacity-30 pointer-events-none select-none blur-sm" : ""}`}>
                          {phase.tasks.map((task, tIdx) => (
                            <div
                              key={tIdx}
                            className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-750 transition-colors"
                          >
                            <div className="space-y-1">
                              <span className="text-slate-200 text-sm font-medium block leading-tight">
                                {task.title}
                              </span>
                              <span className="text-slate-500 text-xs block leading-relaxed max-w-md">
                                {task.description}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 self-start md:self-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                task.difficulty === 'EASY' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' :
                                task.difficulty === 'MEDIUM' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50' :
                                'bg-rose-950/40 text-rose-400 border border-rose-900/50'
                              }`}>
                                {task.difficulty}
                              </span>
                              <span className="text-slate-400 text-xs flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                {task.estimatedMinutes}m
                              </span>
                            </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer CTA */}
            <div className="p-6 border-t border-slate-800 bg-slate-900 flex items-center gap-4">
              <Button
                onClick={() => setSelectedTemplate(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-3 rounded-xl"
              >
                Hủy bỏ
              </Button>
              {selectedTemplate.accessType === 'PREMIUM' && !purchasedRoadmaps.includes(selectedTemplate.id) ? (
                <Button
                  onClick={() => handlePurchaseRoadmap(selectedTemplate)}
                  disabled={isPurchasing}
                  className="flex-[2] bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white py-3 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  {isPurchasing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>Mua lộ trình này - {selectedTemplate.price?.toLocaleString()} VNĐ</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => handleCloneRoadmap(selectedTemplate)}
                  disabled={isCloning}
                className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                {isCloning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Đang sao chép...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Thêm vào Bảng học tập</span>
                  </>
                )}
              </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
