"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Activity, Heart, Brain, Scale, ArrowLeft, Printer, ArrowRight, 
  AlertCircle, CheckCircle, Smile, ShieldAlert, Award 
} from "lucide-react";
import Button from "@/components/common/Button";

// PHQ-9 Questions
const phq9Questions = [
  "Ít hứng thú hoặc không có niềm vui khi làm các hoạt động hàng ngày.",
  "Cảm thấy chán nản, trầm cảm, sầu muộn hoặc tuyệt vọng.",
  "Gặp khó khăn khi đi vào giấc ngủ, ngủ không sâu giấc, hoặc ngủ quá nhiều.",
  "Cảm thấy mệt mỏi, uể oải hoặc không có năng lượng làm việc.",
  "Ăn không ngon miệng, chán ăn hoặc ngược lại là ăn quá nhiều.",
  "Cảm thấy thất vọng về bản thân, nghĩ mình là người thất bại hoặc làm cho gia đình thất vọng.",
  "Gặp khó khăn khi tập trung vào việc đọc báo, xem tivi hoặc làm việc.",
  "Nói hoặc di chuyển chậm chạp đến mức người xung quanh có thể nhận thấy. Hoặc ngược lại, bồn chồn, đi lại nhiều hơn bình thường.",
  "Có suy nghĩ muốn tự làm tổn thương bản thân hoặc nghĩ rằng chết đi sẽ tốt hơn."
];

const phq9Options = [
  { label: "Không ngày nào", value: 0 },
  { label: "Vài ngày", value: 1 },
  { label: "Hơn một nửa số ngày", value: 2 },
  { label: "Gần như mọi ngày", value: 3 }
];

// PSS-4 Questions
const pss4Questions = [
  { text: "Trong tháng qua, bạn có thường cảm thấy không thể kiểm soát những việc quan trọng trong cuộc sống?", reverse: false },
  { text: "Trong tháng qua, bạn có thường cảm thấy tự tin về khả năng tự giải quyết các vấn đề cá nhân của mình?", reverse: true },
  { text: "Trong tháng qua, bạn có thường cảm thấy mọi việc đang diễn ra đúng theo ý muốn của mình?", reverse: true },
  { text: "Trong tháng qua, bạn có thường cảm thấy những khó khăn chồng chất đến mức không thể vượt qua nổi?", reverse: false }
];

const pss4Options = [
  { label: "Không bao giờ", value: 0 },
  { label: "Hầu như không bao giờ", value: 1 },
  { label: "Thỉnh thoảng", value: 2 },
  { label: "Khá thường xuyên", value: 3 },
  { label: "Rất thường xuyên", value: 4 }
];

type TestType = "menu" | "bmi" | "phq9" | "pss4";

export default function HealthTestsPage() {
  const [activeTest, setActiveTest] = useState<TestType>("menu");

  // BMI State
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [bmiResult, setBmiResult] = useState<{
    score: number;
    category: string;
    color: string;
    advice: string;
    specSuggestion: string;
  } | null>(null);

  // PHQ-9 State
  const [phqAnswers, setPhqAnswers] = useState<number[]>(new Array(phq9Questions.length).fill(-1));
  const [currentPhqIdx, setCurrentPhqIdx] = useState<number>(0);
  const [phqResult, setPhqResult] = useState<{
    score: number;
    category: string;
    color: string;
    advice: string;
    severity: "low" | "mod" | "high";
  } | null>(null);

  // PSS-4 State
  const [pssAnswers, setPssAnswers] = useState<number[]>(new Array(pss4Questions.length).fill(-1));
  const [currentPssIdx, setCurrentPssIdx] = useState<number>(0);
  const [pssResult, setPssResult] = useState<{
    score: number;
    category: string;
    color: string;
    advice: string;
    severity: "low" | "mod" | "high";
  } | null>(null);

  // Reset all states
  const handleReset = () => {
    setActiveTest("menu");
    setWeight("");
    setHeight("");
    setBmiResult(null);
    setPhqAnswers(new Array(phq9Questions.length).fill(-1));
    setCurrentPhqIdx(0);
    setPhqResult(null);
    setPssAnswers(new Array(pss4Questions.length).fill(-1));
    setCurrentPssIdx(0);
    setPssResult(null);
  };

  // BMI Calculation Logic
  const calculateBMI = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // cm to meters

    if (!w || !h || w <= 0 || h <= 0) return;

    const bmi = parseFloat((w / (h * h)).toFixed(1));
    let cat = "";
    let color = "";
    let adv = "";
    let spec = "";

    if (bmi < 18.5) {
      cat = "Thiếu cân (Underweight)";
      color = "text-amber-500 bg-amber-50 border-amber-200";
      adv = "Cơ thể bạn đang thiếu dưỡng chất. Bạn nên bổ sung chế độ ăn giàu protein, chia làm nhiều bữa nhỏ, rèn luyện thể thao điều độ và bổ sung vitamin.";
      spec = "Dinh dưỡng";
    } else if (bmi >= 18.5 && bmi < 23) {
      cat = "Cân nặng bình thường (Normal)";
      color = "text-emerald-600 bg-emerald-50 border-emerald-200";
      adv = "Chúc mừng! Bạn có chỉ số cơ thể rất lý tưởng. Hãy tiếp tục duy trì chế độ ăn uống lành mạnh và thói quen rèn luyện thể thao hiện tại.";
      spec = "";
    } else if (bmi >= 23 && bmi < 25) {
      cat = "Thừa cân (Overweight)";
      color = "text-amber-600 bg-amber-50 border-amber-200";
      adv = "Bạn đang ở mức tiền béo phì. Cần kiểm soát lại lượng tinh bột, chất béo nạp vào cơ thể, hạn chế đồ ngọt và tích cực tập thể dục ít nhất 30 phút mỗi ngày.";
      spec = "Dinh dưỡng";
    } else {
      cat = "Béo phì (Obese)";
      color = "text-red-600 bg-red-50 border-red-200";
      adv = "Chỉ số BMI báo động mức độ béo phì. Bạn có nguy cơ cao mắc các bệnh tim mạch, huyết áp, tiểu đường. Nên hạn chế tối đa dầu mỡ, đồ ăn nhanh và đi khám để nhận tư vấn giảm cân khoa học.";
      spec = "Dinh dưỡng";
    }

    setBmiResult({ score: bmi, category: cat, color, advice: adv, specSuggestion: spec });
  };

  // PHQ-9 Handling
  const handlePhqSelect = (val: number) => {
    const nextAnswers = [...phqAnswers];
    nextAnswers[currentPhqIdx] = val;
    setPhqAnswers(nextAnswers);

    if (currentPhqIdx < phq9Questions.length - 1) {
      setCurrentPhqIdx(currentPhqIdx + 1);
    } else {
      // Last question answered, calculate score
      const totalScore = nextAnswers.reduce((sum, curr) => sum + curr, 0);
      let cat = "";
      let color = "";
      let adv = "";
      let sev: "low" | "mod" | "high" = "low";

      if (totalScore <= 4) {
        cat = "Không có trầm cảm / Rất nhẹ";
        color = "text-emerald-600 bg-emerald-50 border-emerald-200";
        adv = "Sức khỏe tâm thần của bạn đang ở mức rất tốt. Cảm xúc lo lắng hay buồn chán tạm thời là hoàn toàn bình thường trong cuộc sống.";
        sev = "low";
      } else if (totalScore <= 9) {
        cat = "Trầm cảm mức độ nhẹ (Mild)";
        color = "text-yellow-600 bg-yellow-50 border-yellow-200";
        adv = "Bạn có một vài dấu hiệu buồn bã nhẹ. Hãy dành thời gian nghỉ ngơi, tham gia các hoạt động ngoài trời, trò chuyện chia sẻ với người thân bạn bè nhiều hơn.";
        sev = "low";
      } else if (totalScore <= 14) {
        cat = "Trầm cảm mức độ vừa (Moderate)";
        color = "text-amber-600 bg-amber-50 border-amber-200";
        adv = "Dấu hiệu trầm cảm mức độ trung bình có thể đang ảnh hưởng tới công việc và sinh hoạt của bạn. Bạn nên chủ động đặt lịch tư vấn từ xa hoặc khám trực tiếp với chuyên gia Tâm lý/Tâm thần.";
        sev = "mod";
      } else if (totalScore <= 19) {
        cat = "Trầm cảm mức độ vừa nặng (Moderately Severe)";
        color = "text-red-600 bg-red-50 border-red-200";
        adv = "Bạn có biểu hiện trầm cảm rõ rệt. Đừng ngần ngại tìm kiếm sự giúp đỡ từ bác sĩ tâm lý để được tham vấn y khoa và có hướng can thiệp sớm.";
        sev = "high";
      } else {
        cat = "Trầm cảm mức độ nặng (Severe)";
        color = "text-red-700 bg-red-100 border-red-300";
        adv = "Cảnh báo đỏ! Tình trạng trầm cảm nghiêm trọng có thể đe dọa trực tiếp tới an toàn sức khỏe của bạn. Bạn hãy liên hệ ngay với người thân hoặc đặt khám cấp tốc với Bác sĩ chuyên khoa Tâm thần.";
        sev = "high";
      }

      setPhqResult({ score: totalScore, category: cat, color, advice: adv, severity: sev });
    }
  };

  // PSS-4 Handling
  const handlePssSelect = (val: number) => {
    const nextAnswers = [...pssAnswers];
    nextAnswers[currentPssIdx] = val;
    setPssAnswers(nextAnswers);

    if (currentPssIdx < pss4Questions.length - 1) {
      setCurrentPssIdx(currentPssIdx + 1);
    } else {
      // Calculate score (reverse scoring for questions 1 & 2 in 0-indexed i.e. pss4Questions[1] and [2])
      const totalScore = nextAnswers.reduce((sum, curr, idx) => {
        const isReverse = pss4Questions[idx].reverse;
        const score = isReverse ? (4 - curr) : curr;
        return sum + score;
      }, 0);

      let cat = "";
      let color = "";
      let adv = "";
      let sev: "low" | "mod" | "high" = "low";

      if (totalScore <= 5) {
        cat = "Căng thẳng thấp (Low Stress)";
        color = "text-emerald-600 bg-emerald-50 border-emerald-200";
        adv = "Mức độ stress của bạn rất thấp. Bạn đang kiểm soát và cân bằng cuộc sống rất tốt.";
        sev = "low";
      } else if (totalScore <= 10) {
        cat = "Căng thẳng vừa phải (Moderate Stress)";
        color = "text-amber-600 bg-amber-50 border-amber-200";
        adv = "Bạn đang cảm thấy áp lực ở mức trung bình. Hãy tập thói quen thiền định, nghe nhạc thư giãn và ngủ đủ giấc từ 7-8 tiếng mỗi đêm để giảm bớt stress.";
        sev = "mod";
      } else {
        cat = "Căng thẳng cao (High Stress)";
        color = "text-red-600 bg-red-50 border-red-200";
        adv = "Mức độ quá tải và căng thẳng của bạn đang ở mức rất cao. Hãy tạm thời dừng các công việc gây áp lực lớn và đặt lịch tham vấn tâm lý để tránh rơi vào trạng thái suy nhược.";
        sev = "high";
      }

      setPssResult({ score: totalScore, category: cat, color, advice: adv, severity: sev });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow print:p-0">
      {/* Header Banner - Hidden on print */}
      <div className="text-center space-y-3 mb-10 print:hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-semibold">
          <Activity className="w-3.5 h-3.5" />
          <span>Tiện Ích Chăm Sóc Sức Khỏe Tự Động</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Đánh Giá Sức Khỏe Trực Tuyến
        </h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Nhận diện nhanh các nguy cơ sức khỏe thông qua các công cụ đo lường và bài trắc nghiệm chuẩn y khoa.
        </p>
      </div>

      {/* Menu - Hidden on print */}
      {activeTest === "menu" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
          {/* Card 1: BMI */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Chỉ số Khối Cơ thể (BMI)</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Tính toán nhanh thể trạng dinh dưỡng dựa trên chiều cao và cân nặng theo chuẩn Tổ chức Y tế Thế giới (WHO).
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTest("bmi")}
              className="mt-6 w-full py-2.5 rounded-xl border border-teal-200 hover:border-teal-500 hover:bg-teal-50 text-teal-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              Bắt đầu tính toán <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: PHQ-9 */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Đánh giá Trầm cảm (PHQ-9)</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Bảng khảo sát 9 câu hỏi chuẩn hóa toàn cầu giúp sàng lọc sớm các dấu hiệu trầm cảm trong 2 tuần gần nhất.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTest("phq9")}
              className="mt-6 w-full py-2.5 rounded-xl border border-teal-200 hover:border-teal-500 hover:bg-teal-50 text-teal-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              Làm bài test <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: PSS-4 */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Đo mức độ Căng thẳng (PSS-4)</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Thang đo cảm nhận căng thẳng giản lược gồm 4 câu hỏi định lượng áp lực cuộc sống đè nặng lên tâm trí bạn.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTest("pss4")}
              className="mt-6 w-full py-2.5 rounded-xl border border-teal-200 hover:border-teal-500 hover:bg-teal-50 text-teal-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              Làm bài test <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* --- 1. BMI CALCULATOR --- */}
      {activeTest === "bmi" && (
        <div className="space-y-6">
          <button onClick={handleReset} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-teal-600 font-semibold print:hidden">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách bài test
          </button>

          {!bmiResult ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto shadow-sm">
              <div className="text-center space-y-2 mb-6">
                <Scale className="w-10 h-10 text-teal-600 mx-auto" />
                <h3 className="font-bold text-xl text-slate-800">Tính chỉ số khối cơ thể (BMI)</h3>
                <p className="text-xs text-slate-400">Vui lòng nhập chính xác chiều cao và cân nặng hiện tại.</p>
              </div>

              <form onSubmit={calculateBMI} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Chiều cao (cm)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 170"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Cân nặng (kg)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 65"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-sm"
                  />
                </div>

                <Button variant="teal" type="submit" className="w-full rounded-xl py-3 font-bold text-xs mt-2">
                  Tính chỉ số BMI
                </Button>
              </form>
            </div>
          ) : (
            /* Result Panel */
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-md relative overflow-hidden space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">Phiếu Đánh Giá Chỉ Số BMI</h3>
                  <p className="text-xs text-slate-400 mt-1">Dịch vụ chăm sóc sức khỏe MedBooking</p>
                </div>
                <button onClick={handlePrint} className="p-2 border border-slate-200 hover:border-slate-400 rounded-xl text-slate-500 hover:text-slate-700 transition-colors print:hidden" title="In phiếu kết quả">
                  <Printer className="w-4 h-4" />
                </button>
              </div>

              {/* Core metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="text-center md:text-left space-y-2">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Chỉ số BMI của bạn</span>
                  <div className="flex items-baseline justify-center md:justify-start gap-2">
                    <span className="text-5xl font-black text-teal-600">{bmiResult.score}</span>
                    <span className="text-sm text-slate-500 font-semibold">kg/m²</span>
                  </div>
                  <div className={`inline-flex px-3 py-1 rounded-full border text-xs font-bold ${bmiResult.color.split(" ")[0]} ${bmiResult.color.split(" ")[1]} ${bmiResult.color.split(" ")[2]}`}>
                    {bmiResult.category}
                  </div>
                </div>

                {/* BMI Gauge bar */}
                <div className="space-y-3">
                  <span className="text-xs text-slate-400 font-semibold block">Thước đo phân cấp BMI</span>
                  <div className="h-4 w-full bg-slate-100 rounded-full flex overflow-hidden border border-slate-200 relative">
                    <div style={{ width: "20%" }} className="bg-amber-400 h-full" title="Thiếu cân < 18.5" />
                    <div style={{ width: "35%" }} className="bg-emerald-500 h-full" title="Bình thường 18.5 - 23" />
                    <div style={{ width: "15%" }} className="bg-amber-500 h-full" title="Thừa cân 23 - 25" />
                    <div style={{ width: "30%" }} className="bg-red-500 h-full" title="Béo phì >= 25" />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold px-1">
                    <span>&lt; 18.5 (Gầy)</span>
                    <span>18.5 - 23 (Đẹp)</span>
                    <span>23 - 25 (Béo nhẹ)</span>
                    <span>&gt; 25 (Béo phì)</span>
                  </div>
                </div>
              </div>

              {/* Diagnostic and advice */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Lời khuyên y khoa:</h4>
                    <p className="text-slate-600 text-xs leading-relaxed mt-1">{bmiResult.advice}</p>
                  </div>
                </div>

                {/* Recommendation to consult a doctor */}
                {bmiResult.specSuggestion && (
                  <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4 print:hidden">
                    <div className="flex gap-2">
                      <Award className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">Tham vấn trực tiếp chuyên gia dinh dưỡng</h4>
                        <p className="text-[10px] text-slate-500">Đặt khám nhanh với bác sĩ dinh dưỡng trên MedBooking.</p>
                      </div>
                    </div>
                    <Link href={`/doctors?specialty=spec_noi_tong_quat`}>
                      <Button variant="teal" className="rounded-xl py-2 px-4 text-[10px] font-bold shrink-0">
                        Đặt khám dinh dưỡng ngay
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              <Button variant="outline" onClick={handleReset} className="w-full rounded-xl py-2 text-xs font-bold print:hidden">
                Làm bài kiểm tra khác
              </Button>
            </div>
          )}
        </div>
      )}

      {/* --- 2. PHQ-9 DEPRESSION TEST --- */}
      {activeTest === "phq9" && (
        <div className="space-y-6">
          <button onClick={handleReset} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-teal-600 font-semibold print:hidden">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách bài test
          </button>

          {!phqResult ? (
            /* Test Interface */
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
              {/* Stepper info */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-xl text-slate-800">Trắc nghiệm Sàng lọc Trầm cảm (PHQ-9)</h3>
                  <p className="text-xs text-slate-400 mt-1">Câu hỏi đánh giá tần suất lặp lại của biểu hiện trong 2 tuần qua.</p>
                </div>
                <span className="text-xs bg-teal-50 border border-teal-100 text-teal-700 font-extrabold px-3 py-1.5 rounded-full shrink-0">
                  Câu {currentPhqIdx + 1} / {phq9Questions.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 transition-all duration-300"
                  style={{ width: `${((currentPhqIdx + 1) / phq9Questions.length) * 100}%` }}
                />
              </div>

              {/* Question Statement */}
              <div className="py-6 min-h-[80px] flex items-center justify-center text-center">
                <p className="text-base sm:text-lg font-bold text-slate-800 leading-relaxed max-w-xl">
                  {phq9Questions[currentPhqIdx]}
                </p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {phq9Options.map((opt: { label: string; value: number }) => (
                  <button
                    key={opt.value}
                    onClick={() => handlePhqSelect(opt.value)}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-slate-700 hover:text-teal-700 text-sm font-semibold text-left transition-all active:scale-98"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Test Result */
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-md relative overflow-hidden space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">Phiếu Đánh Giá Sức Khỏe Tâm Thần (PHQ-9)</h3>
                  <p className="text-xs text-slate-400 mt-1">Dịch vụ chăm sóc sức khỏe MedBooking</p>
                </div>
                <button onClick={handlePrint} className="p-2 border border-slate-200 hover:border-slate-400 rounded-xl text-slate-500 hover:text-slate-700 transition-colors print:hidden" title="In phiếu kết quả">
                  <Printer className="w-4 h-4" />
                </button>
              </div>

              {/* Core metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="text-center md:text-left space-y-2">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tổng điểm trầm cảm</span>
                  <div className="flex items-baseline justify-center md:justify-start gap-2">
                    <span className="text-5xl font-black text-teal-600">{phqResult.score}</span>
                    <span className="text-sm text-slate-500 font-semibold">/ 27 điểm</span>
                  </div>
                  <div className={`inline-flex px-3 py-1 rounded-full border text-xs font-bold ${phqResult.color.split(" ")[0]} ${phqResult.color.split(" ")[1]} ${phqResult.color.split(" ")[2]}`}>
                    {phqResult.category}
                  </div>
                </div>

                {/* Classification info */}
                <div className="text-xs text-slate-500 space-y-2 border-l border-slate-100 pl-4">
                  <p className="font-bold text-slate-700">Thang điểm đánh giá PHQ-9:</p>
                  <p>• 0 - 4: Không trầm cảm hoặc trầm cảm tối thiểu.</p>
                  <p>• 5 - 9: Trầm cảm nhẹ (Mild Depression).</p>
                  <p>• 10 - 14: Trầm cảm vừa (Moderate Depression).</p>
                  <p>• 15 - 19: Trầm cảm vừa nặng (Moderately Severe).</p>
                  <p>• 20 - 27: Trầm cảm nặng (Severe Depression).</p>
                </div>
              </div>

              {/* Advice */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Lời khuyên từ Bác sĩ:</h4>
                    <p className="text-slate-600 text-xs leading-relaxed mt-1">{phqResult.advice}</p>
                  </div>
                </div>

                {/* Redirect for moderate or high depression severity */}
                {phqResult.severity !== "low" && (
                  <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4 print:hidden animate-pulse">
                    <div className="flex gap-2">
                      <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-red-900 text-xs">Cần tư vấn y tế với Bác sĩ chuyên khoa</h4>
                        <p className="text-[10px] text-red-700">Đặt khám nhanh chuyên khoa Thần kinh/Tâm lý để nhận chỉ định điều trị.</p>
                      </div>
                    </div>
                    <Link href={`/doctors?specialty=spec_than_kinh`}>
                      <Button variant="danger" className="rounded-xl py-2.5 px-4 text-[10px] font-bold shrink-0 shadow-sm shadow-red-200">
                        Đặt khám thần kinh/tâm thần
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              <Button variant="outline" onClick={handleReset} className="w-full rounded-xl py-2 text-xs font-bold print:hidden">
                Làm bài kiểm tra khác
              </Button>
            </div>
          )}
        </div>
      )}

      {/* --- 3. PSS-4 STRESS TEST --- */}
      {activeTest === "pss4" && (
        <div className="space-y-6">
          <button onClick={handleReset} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-teal-600 font-semibold print:hidden">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách bài test
          </button>

          {!pssResult ? (
            /* Test Interface */
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
              {/* Stepper info */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-xl text-slate-800">Thang đo Cảm nhận Căng thẳng (PSS-4)</h3>
                  <p className="text-xs text-slate-400 mt-1">Đánh giá nhanh trạng thái cảm xúc quá tải của bạn trong tháng qua.</p>
                </div>
                <span className="text-xs bg-teal-50 border border-teal-100 text-teal-700 font-extrabold px-3 py-1.5 rounded-full shrink-0">
                  Câu {currentPssIdx + 1} / {pss4Questions.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 transition-all duration-300"
                  style={{ width: `${((currentPssIdx + 1) / pss4Questions.length) * 100}%` }}
                />
              </div>

              {/* Question Statement */}
              <div className="py-6 min-h-[80px] flex items-center justify-center text-center">
                <p className="text-base sm:text-lg font-bold text-slate-800 leading-relaxed max-w-xl">
                  {pss4Questions[currentPssIdx].text}
                </p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-3">
                {pss4Options.map((opt: { label: string; value: number }) => (
                  <button
                    key={opt.value}
                    onClick={() => handlePssSelect(opt.value)}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-slate-700 hover:text-teal-700 text-sm font-semibold text-left transition-all active:scale-98"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Test Result */
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-md relative overflow-hidden space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">Báo Cáo Mức Độ Căng Thẳng (PSS-4)</h3>
                  <p className="text-xs text-slate-400 mt-1">Dịch vụ chăm sóc sức khỏe MedBooking</p>
                </div>
                <button onClick={handlePrint} className="p-2 border border-slate-200 hover:border-slate-400 rounded-xl text-slate-500 hover:text-slate-700 transition-colors print:hidden" title="In phiếu kết quả">
                  <Printer className="w-4 h-4" />
                </button>
              </div>

              {/* Core metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="text-center md:text-left space-y-2">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Điểm cảm nhận stress</span>
                  <div className="flex items-baseline justify-center md:justify-start gap-2">
                    <span className="text-5xl font-black text-teal-600">{pssResult.score}</span>
                    <span className="text-sm text-slate-500 font-semibold">/ 16 điểm</span>
                  </div>
                  <div className={`inline-flex px-3 py-1 rounded-full border text-xs font-bold ${pssResult.color.split(" ")[0]} ${pssResult.color.split(" ")[1]} ${pssResult.color.split(" ")[2]}`}>
                    {pssResult.category}
                  </div>
                </div>

                {/* Classification info */}
                <div className="text-xs text-slate-500 space-y-2 border-l border-slate-100 pl-4">
                  <p className="font-bold text-slate-700">Phân loại thang điểm PSS-4:</p>
                  <p>• 0 - 5: Căng thẳng thấp (Low Stress).</p>
                  <p>• 6 - 10: Căng thẳng vừa phải (Moderate Stress).</p>
                  <p>• 11 - 16: Căng thẳng cao (High Stress).</p>
                </div>
              </div>

              {/* Advice */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Lời khuyên y khoa giải tỏa căng thẳng:</h4>
                    <p className="text-slate-600 text-xs leading-relaxed mt-1">{pssResult.advice}</p>
                  </div>
                </div>

                {/* Redirect for moderate or high stress severity */}
                {pssResult.severity !== "low" && (
                  <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4 print:hidden">
                    <div className="flex gap-2">
                      <Brain className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">Căng thẳng ảnh hưởng tới giấc ngủ và thể chất?</h4>
                        <p className="text-[10px] text-slate-500">Đăng ký tham vấn nhanh với Bác sĩ chuyên khoa Thần kinh trên MedBooking.</p>
                      </div>
                    </div>
                    <Link href={`/doctors?specialty=spec_than_kinh`}>
                      <Button variant="teal" className="rounded-xl py-2 px-4 text-[10px] font-bold shrink-0">
                        Hẹn gặp bác sĩ chuyên khoa
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              <Button variant="outline" onClick={handleReset} className="w-full rounded-xl py-2 text-xs font-bold print:hidden">
                Làm bài kiểm tra khác
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
