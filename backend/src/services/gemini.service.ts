import { ApiError } from "../utils/apiError";
import {
    ChatRecommendations,
    buildDoctorContextForPrompt,
    formatRecommendationsMarkdown,
    getChatRecommendations,
    replyAlreadyHasDoctorRecommendations,
} from "./chat-recommendation.service";

export interface ChatDiagnosisResult {
    reply: string;
    recommendations: ChatRecommendations;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim() || "";

// Phải khớp model có quota trên AI Studio (Free tier: 2.5 Flash / Flash Lite)
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"] as const;
const GEMINI_EMR_MODEL = "gemini-2.5-flash";

// System prompt đồng bộ luồng proj2: chẩn đoán → tư vấn → chuyên khoa → bác sĩ hệ thống
const SYSTEM_PROMPT = `
Bạn là "MedBooking AI - Trợ lý Bác sĩ Ảo" cực kỳ chuyên nghiệp, tận tâm và chu đáo.
Nhiệm vụ: lắng nghe triệu chứng, đưa ra nhận định y khoa sơ bộ, lời khuyên chăm sóc tại nhà, gợi ý chuyên khoa và bác sĩ trên MedBooking.

QUY TẮC (BẮT BUỘC):
1. Phản hồi hoàn toàn bằng tiếng Việt, lịch sự, ân cần.
2. LUÔN chẩn đoán sơ bộ ngay cả khi mô tả ngắn ("đau chân", "ho"...). KHÔNG chỉ hỏi lại mà không chẩn đoán.
3. BẮT BUỘC dùng đúng cấu trúc Markdown sau (đúng thứ tự, đủ 4 mục):

### 🩺 Chẩn đoán sơ bộ có thể xảy ra:
- (liệt kê 2-4 nguyên nhân/bệnh lý có khả năng, in đậm tên bệnh)

### 💡 Lời khuyên chăm sóc sức khỏe tại nhà:
- (liệt kê lời khuyên thực tế)

### 🏥 Chuyên khoa khuyên khám trên MedBooking:
- (tên chuyên khoa phù hợp trên hệ thống)

### 👨‍⚕️ Bác sĩ đề xuất trên MedBooking:
- (chọn 2-3 bác sĩ từ danh sách hệ thống được cung cấp, ghi đúng họ tên + chuyên khoa)

---
⚠️ *Lưu ý quan trọng: Đây chỉ là chẩn đoán AI tham khảo sơ bộ, không thay thế bác sĩ. Vui lòng đặt lịch khám trên MedBooking.*
`;

/** Chuẩn hóa tiếng Việt để so khớp từ khóa không phân biệt dấu */
function normalizeVietnamese(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d");
}

function containsAny(text: string, keywords: string[]): boolean {
    return keywords.some((k) => text.includes(k));
}

export interface ChatMessage {
    role: "user" | "model";
    text: string;
}

/**
 * Direct HTTP Call to Google Gemini API (tries multiple models)
 */
async function callGeminiApi(
    prompt: string,
    history: ChatMessage[],
    doctorContext = ""
): Promise<string> {
    if (!GEMINI_API_KEY) {
        throw new Error("API Key is missing");
    }

    const systemText = doctorContext
        ? `${SYSTEM_PROMPT}\n${doctorContext}`
        : SYSTEM_PROMPT;

    const contents = [
        ...history.map((msg) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.text }],
        })),
        {
            role: "user",
            parts: [{ text: prompt }],
        },
    ];

    const body = JSON.stringify({
        contents,
        systemInstruction: {
            parts: [{ text: systemText }],
        },
        generationConfig: {
            temperature: 0.4,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
        },
    });

    let lastError = "Unknown Gemini API error";

    for (const model of GEMINI_MODELS) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Gemini API (${model}) error:`, errorText);
            lastError = errorText;
            continue;
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
            return reply;
        }
        lastError = "Invalid response structure from Gemini API";
    }

    throw new ApiError(`Gemini API returned error: ${lastError}`, 502);
}

/**
 * Intelligent Fallback Medical Rule Engine
 * Analyzes keywords and returns highly structured and professional medical advisor text.
 */
function getFallbackMedicalResponse(userQuery: string): string {
    const norm = normalizeVietnamese(userQuery);

    // 1. Respiratory & Flu (Sốt, ho, viêm họng, sổ mũi, đau họng, cảm lạnh, cúm...)
    if (
        /\bho\b/.test(norm) ||
        containsAny(norm, ["sot", "hong", "mui", "cum", "cam la", "viem hong", "phoi", "kho tho", "sung hong", "dau hong"])
    ) {
        return `Chào bạn! Dựa trên các triệu chứng bạn mô tả như **ho, sốt, hoặc đau họng/sổ mũi**, dưới đây là một số nhận định sơ bộ y khoa:

### 🩺 Chẩn đoán sơ bộ có thể xảy ra:
- **Cảm cúm hoặc cảm lạnh thông thường**: Nhiễm trùng đường hô hấp trên do virus gây ra, thường tự khỏi sau 5-7 ngày.
- **Viêm họng cấp / Viêm amidan**: Viêm nhiễm ở niêm mạc họng, có thể do virus hoặc vi khuẩn (nếu kèm theo sốt cao và sưng đau cổ họng dữ dội).
- **Viêm phế quản nhẹ**: Nếu có triệu chứng ho khan hoặc ho có đờm kéo dài nhiều ngày.

### 💡 Lời khuyên chăm sóc sức khỏe tại nhà:
- **Giữ nước**: Uống nhiều nước ấm, nước chanh mật ong hoặc bổ sung nước điện giải (Oresol) nếu có sốt cao.
- **Vệ sinh họng**: Súc miệng bằng nước muối sinh lý ấm từ 3-4 lần mỗi ngày để làm sạch vi khuẩn và dịu niêm mạc họng.
- **Nghỉ ngơi**: Dành thời gian nghỉ ngơi hợp lý, tránh vận động gắng sức và giữ ấm cơ thể.
- **Hạ sốt an toàn**: Sử dụng Paracetamol (nếu sốt trên 38.5°C) với liều lượng phù hợp theo cân nặng và cách nhau 4-6 tiếng.

### 🏥 Chuyên khoa khuyên khám trên MedBooking:
- **Khoa Tai Mũi Họng** hoặc **Khoa Nội Hô Hấp** để được nội soi tai mũi họng hoặc nghe phổi để chẩn đoán chính xác mức độ tổn thương.

---
⚠️ *Lưu ý quan trọng: Nhận định trên chỉ mang tính chất tham khảo sơ bộ từ AI y khoa và không thay thế chẩn đoán lâm sàng của bác sĩ chuyên môn. Nếu bạn bị sốt cao liên tục không hạ, khó thở, tức ngực hoặc ho ra máu, vui lòng đặt lịch hẹn ngay với Bác sĩ chuyên khoa tại MedBooking hoặc đến cơ sở y tế gần nhất để được thăm khám kịp thời.*`;
    }

    // 2. Digestive Issues (Đau bụng, đau dạ dày, tiêu chảy, đầy hơi, buồn nôn...)
    if (
        containsAny(norm, [
            "bung",
            "da day",
            "tieu chay",
            "non",
            "day hoi",
            "tieu hoa",
            "o hoi",
            "tieu kho",
            "tao bon",
        ])
    ) {
        return `Chào bạn! Với biểu hiện **đau bụng, đau dạ dày hoặc các triệu chứng liên quan đến tiêu hóa**, dưới đây là nhận định y khoa sơ bộ dành cho bạn:

### 🩺 Chẩn đoán sơ bộ có thể xảy ra:
- **Viêm loét dạ dày - tá tràng**: Cơn đau thường xuất hiện ở vùng thượng vị (trên rốn), đau âm ỉ hoặc đau rát trước/sau khi ăn, kèm theo đầy bụng, ợ chua.
- **Rối loạn tiêu hóa / Viêm đại tràng**: Cơn đau quặn bụng dưới kèm theo thay đổi thói quen đại tiện (tiêu chảy hoặc táo bón).
- **Ngộ độc thực phẩm nhẹ**: Đau quặn bụng, buồn nôn, nôn hoặc tiêu chảy sau khi ăn thực phẩm lạ/kém vệ sinh.

### 💡 Lời khuyên chăm sóc sức khỏe tại nhà:
- **Chế độ ăn thanh đạm**: Ăn thức ăn lỏng, dễ tiêu như cháo, súp, bánh mì. Tránh ăn đồ cay nóng, dầu mỡ, đồ chua, rượu bia, cà phê và chất kích thích.
- **Chia nhỏ bữa ăn**: Tránh ăn quá no một lúc, không nằm ngay sau khi ăn ít nhất 2 giờ.
- **Bù nước**: Uống nhiều nước lọc ấm, hoặc uống Oresol từng ngụm nhỏ nếu có tình trạng nôn hoặc tiêu chảy để tránh mất nước.
- **Chườm ấm**: Sử dụng túi chườm ấm đặt lên vùng bụng bị đau để giảm co thắt dạ dày/đại tràng.

### 🏥 Chuyên khoa khuyên khám trên MedBooking:
- **Khoa Tiêu Hóa** để thực hiện nội soi dạ dày/đại tràng hoặc xét nghiệm vi khuẩn HP, tìm ra nguyên nhân chính xác gây đau bụng.

---
⚠️ *Lưu ý quan trọng: Nhận định trên chỉ mang tính chất tham khảo sơ bộ từ AI y khoa và không thay thế chẩn đoán lâm sàng của bác sĩ chuyên môn. Nếu bạn gặp cơn đau bụng dữ dội đột ngột (đặc biệt vùng bụng dưới bên phải - nghi ruột thừa), nôn ra máu, đi ngoài phân đen hoặc sốt cao kèm đau bụng, hãy đặt lịch hẹn khẩn cấp với Bác sĩ Tiêu hóa tại MedBooking hoặc đến bệnh viện ngay lập tức.*`;
    }

    // 3. Leg, foot & extremity pain (đau chân, đau gối, đau tay...)
    if (
        containsAny(norm, [
            "dau chan",
            "chan dau",
            "ban chan",
            "co chan",
            "mat ca chan",
            "gan chan",
            "te chan",
            "dau goi",
            "goi dau",
            "dau tay",
            "tay dau",
            "te tay",
            "dau canh tay",
            "dau co chan",
        ])
    ) {
        return `Chào bạn! Dựa trên triệu chứng **"${userQuery.trim()}"** bạn mô tả, dưới đây là nhận định y khoa sơ bộ:

### 🩺 Chẩn đoán sơ bộ có thể xảy ra:
- **Chuột rút / Co thắt cơ chân**: Đau đột ngột vùng bắp chân hoặc gan chân, thường sau vận động mạnh, thiếu kali/magie hoặc mất nước.
- **Viêm gân Achilles hoặc viêm cân gan chân (Plantar fasciitis)**: Đau gót chân, đau khi bước chân đầu tiên buổi sáng hoặc sau khi đứng lâu.
- **Tụ máu / Bong gân mắt cá chân**: Đau sau chấn thương, sưng nề, khó đi lại nếu bị lật cổ chân.
- **Bệnh lý tuần hoàn hoặc thần kinh ngoại biên**: Đau chân âm ỉ kèm tê bì, nặng chân về chiều (cần loại trừ nếu có bệnh nền tiểu đường, hút thuốc).
- **Đau gối do thoái hóa khớp / viêm khớp**: Đau khi leo cầu thang, ngồi xổm hoặc vận động nhiều.

### 💡 Lời khuyên chăm sóc sức khỏe tại nhà:
- **Nghỉ ngơi & chườm lạnh/ấm**: Chườm lạnh 15–20 phút trong 48 giờ đầu nếu có chấn thương; sau đó chườm ấm nếu đau cơ.
- **Giãn cơ nhẹ**: Kéo giãn cơ bắp chân, gối trước khi ngủ; tránh đứng/đi lâu liên tục.
- **Giày dép phù hợp**: Dùng giày êm, đế mềm; tránh giày cao gót hoặc dép quá mỏng khi đau gót chân.
- **Bổ sung nước & điện giải**: Uống đủ nước, ăn chuối/rau xanh nếu hay bị chuột rút.

### 🏥 Chuyên khoa khuyên khám trên MedBooking:
- **Khoa Cơ Xương Khớp** (đau khớp, chấn thương) hoặc **Khoa Nội Tim Mạch** (nếu đau chân kèm sưng nề một bên, khó thở — nghi huyết khối).

---
⚠️ *Lưu ý quan trọng: Nhận định trên chỉ mang tính chất tham khảo sơ bộ từ AI y khoa và không thay thế chẩn đoán lâm sàng của bác sĩ chuyên môn. Nếu chân sưng đỏ nóng đột ngột, đau dữ dội sau ngã, hoặc đau ngực kèm khó thở, hãy đến cấp cứu hoặc đặt lịch khám ngay trên MedBooking.*`;
    }

    // 4. Bones & Muscles (Đau vai gáy, khớp, lưng, mỏi cơ...)
    if (
        containsAny(norm, [
            "khop",
            "lung",
            "xuong",
            "vai gay",
            "vai ga",
            "co xuong",
            "thoat vi",
            "te bi",
            "dau lung",
            "dau vai",
            "mo co",
        ])
    ) {
        return `Chào bạn! Đối với các triệu chứng đau mỏi **cơ xương khớp, lưng hoặc đau vai gáy**, tôi xin đưa ra một số nhận định y tế sơ bộ như sau:

### 🩺 Chẩn đoán sơ bộ có thể xảy ra:
- **Hội chứng cổ vai gáy / Căng cơ cấp**: Rất phổ biến ở dân văn phòng hoặc người làm việc giữ nguyên một tư thế quá lâu, gây thiếu máu nuôi dưỡng cơ.
- **Thoái hóa cột sống cổ/thắt lưng**: Cơn đau âm ỉ tăng lên khi vận động và giảm khi nghỉ ngơi, đau lan xuống mông hoặc tay chân.
- **Thần kinh tọa hoặc thoát vị đĩa đệm**: Nếu có hiện tượng đau buốt lan từ thắt lưng xuống chân kèm theo cảm giác tê bì, kim châm.

### 💡 Lời khuyên chăm sóc sức khỏe tại nhà:
- **Điều chỉnh tư thế**: Luôn ngồi thẳng lưng khi làm việc, sau mỗi 45 - 60 phút nên đứng dậy vận động đi lại và giãn cơ nhẹ nhàng.
- **Liệu pháp nhiệt**: Chườm ấm lên vùng cơ bị đau mỏi từ 15-20 phút mỗi ngày giúp tăng cường lưu thông máu và thư giãn cơ.
- **Tránh mang vác nặng**: Không cúi gập người đột ngột để khênh vật nặng, sử dụng gối đầu có độ cao vừa phải khi nằm ngủ.
- **Tập thể dục nhẹ**: Tập yoga, đi bộ hoặc bơi lội để cải thiện sức mạnh nhóm cơ cột sống.

### 🏥 Chuyên khoa khuyên khám trên MedBooking:
- **Khoa Cơ Xương Khớp** hoặc **Khoa Vật Lý Trị Liệu - Phục Hồi Chức Năng** để được chụp X-quang, MRI cột sống và tiếp cận các liệu pháp phục hồi.

---
⚠️ *Lưu ý quan trọng: Nhận định trên chỉ mang tính chất tham khảo sơ bộ từ AI y khoa và không thay thế chẩn đoán lâm sàng của bác sĩ chuyên môn. Nếu bạn bị đau dữ dội đột ngột sau chấn thương, tê liệt một vùng chi, mất kiểm soát tiểu tiện hoặc teo cơ, vui lòng đặt khám khẩn cấp với Bác sĩ Cơ Xương Khớp tại MedBooking hoặc đến bệnh viện để điều trị kịp thời.*`;
    }

    // 5. Headache & Cardiovascular / Neurological
    if (
        containsAny(norm, [
            "dau dau",
            "nhuc dau",
            "hoa mat",
            "chong mat",
            "huyet ap",
            "mat ngu",
            "kho ngu",
            "than kinh",
            "tuc nguc",
            "hoi hop",
            "tim dap",
        ]) ||
        /\bdau dau\b/.test(norm)
    ) {
        return `Chào bạn! Với tình trạng **đau đầu, chóng mặt, mất ngủ hoặc lo ngại về huyết áp/tim mạch**, dưới đây là thông tin y khoa sơ bộ hữu ích cho bạn:

### 🩺 Chẩn đoán sơ bộ có thể xảy ra:
- **Đau đầu do căng thẳng (Tension headache)**: Loại đau đầu phổ biến nhất do áp lực công việc, mất ngủ hoặc mệt mỏi kéo dài, đau bó chặt quanh đầu.
- **Rối loạn tiền đình / Thiếu năng tuần hoàn não**: Chóng mặt, cảm giác mọi vật quay cuồng, buồn nôn khi thay đổi tư thế.
- **Tăng huyết áp hoặc hạ huyết áp đột ngột**: Cần đo huyết áp trực tiếp để kiểm tra, thường kèm theo hoa mắt, đau sau gáy.

### 💡 Lời khuyên chăm sóc sức khỏe tại nhà:
- **Thiết lập không gian thư giãn**: Nghỉ ngơi trong phòng yên tĩnh, mát mẻ và thiếu ánh sáng khi xuất hiện cơn đau đầu, chóng mặt.
- **Quản lý stress**: Tập thở sâu, thiền định hoặc nghe nhạc nhẹ. Hạn chế sử dụng các thiết bị điện tử ít nhất 1 giờ trước khi ngủ.
- **Dinh dưỡng lành mạnh**: Giảm lượng muối trong khẩu phần ăn, uống đủ nước, hạn chế rượu bia, cà phê và thuốc lá.
- **Thay đổi tư thế chậm**: Tránh đứng lên hoặc ngồi xuống quá đột ngột để máu kịp lưu thông lên não.

### 🏥 Chuyên khoa khuyên khám trên MedBooking:
- **Khoa Thần Kinh** (đối với đau đầu, chóng mặt kéo dài) hoặc **Khoa Tim Mạch** (nếu nghi ngờ cao huyết áp, đau thắt ngực, tim đập nhanh hồi hộp).

---
⚠️ *Lưu ý quan trọng: Nhận định trên chỉ mang tính chất tham khảo sơ bộ từ AI y khoa và không thay thế chẩn đoán lâm sàng của bác sĩ chuyên môn. Nếu bạn gặp các triệu chứng nguy hiểm như: đau đầu dữ dội đột ngột (đau như búa bổ), méo miệng, yếu liệt nửa người, khó nói, hoặc mất ý thức tạm thời, đây có thể là dấu hiệu đột quỵ nguy hiểm, hãy đến bệnh viện cấp cứu ngay lập tức.*`;
    }

    // 6. Skin Problems (tránh khớp nhầm "dau" chứa "da")
    if (
        containsAny(norm, [
            "ngua",
            "mun",
            "di ung",
            "phat ban",
            "noi man",
            "viem da",
            "da li",
            "noi me day",
            "mẩn",
        ]) ||
        /\bda\b/.test(norm) && containsAny(norm, ["ngua", "mun", "do", "noi", "ban", "di ung"])
    ) {
        return `Chào bạn! Đối với vấn đề **mẩn ngứa, phát ban, nổi mẩn dị ứng hoặc tổn thương trên da**, dưới đây là những nhận định y khoa sơ bộ từ trợ lý AI:

### 🩺 Chẩn đoán sơ bộ có thể xảy ra:
- **Viêm da dị ứng / Mề đay cấp**: Phản ứng của hệ miễn dịch cơ thể trước các tác nhân môi trường (thời tiết thay đổi, phấn hoa, lông động vật, bụi bẩn) hoặc thực phẩm (hải sản, trứng, sữa).
- **Viêm da cơ địa**: Bệnh lý da mãn tính gây khô da, đỏ da và ngứa ngáy dữ dội từng đợt.
- **Viêm nang lông hoặc mụn trứng cá**: Nhiễm trùng nhẹ ở lỗ chân lông do tăng tiết dầu hoặc vệ sinh da chưa đúng cách.

### 💡 Lời khuyên chăm sóc sức khỏe tại nhà:
- **Tuyệt đối không gãi**: Việc cào gãi sẽ gây xước da, tổn thương nặng hơn và làm tăng nguy cơ nhiễm trùng, tạo sẹo.
- **Làm mát da**: Tắm rửa bằng nước ấm nhẹ hoặc mát (không tắm nước quá nóng gây khô da), có thể chườm mát vùng da ngứa.
- **Dưỡng ẩm**: Sử dụng kem dưỡng ẩm lành tính dịu nhẹ, không chứa hương liệu để củng cố hàng rào bảo vệ da.
- **Tránh tác nhân kích ứng**: Hạn chế tiếp xúc hóa chất tẩy rửa mạnh, xà phòng thơm đậm đặc và các thực phẩm nghi ngờ gây dị ứng.

### 🏥 Chuyên khoa khuyên khám trên MedBooking:
- **Khoa Da Liễu** để bác sĩ soi da, kiểm tra phản ứng dị ứng và kê đơn thuốc bôi hoặc thuốc uống kháng histamin phù hợp.

---
⚠️ *Lưu ý quan trọng: Nhận định trên chỉ mang tính chất tham khảo sơ bộ từ AI y khoa và không thay thế chẩn đoán lâm sàng của bác sĩ chuyên môn. Nếu bạn xuất hiện nốt ban lan nhanh toàn thân kèm theo khó thở, sưng nề môi mắt, sốt cao hoặc các nốt mụn mủ lở loét rộng, hãy đặt lịch khám hoặc đến bệnh viện để được can thiệp kịp thời.*`;
    }

    // 7. Generic pain / discomfort (đau, nhức, mệt...)
    if (containsAny(norm, ["dau", "nhuc", "met moi", "kho chiu", "benh", "trieu chung"])) {
        return `Chào bạn! Với triệu chứng **"${userQuery.trim()}"** bạn chia sẻ, đây là nhận định y khoa sơ bộ:

### 🩺 Chẩn đoán sơ bộ có thể xảy ra:
- **Đau cơ xương khớp hoặc căng cơ do vận động**: Thường sau làm việc nặng, tập luyện hoặc giữ tư thế lâu.
- **Viêm nhiễm nhẹ hoặc rối loạn chức năng**: Cần thêm thời gian, mức độ đau và triệu chứng kèm theo để thu hẹp nguyên nhân.
- **Stress / mệt mỏi thể chất**: Có thể làm tăng cảm giác đau nhức toàn thân.

### 💡 Lời khuyên chăm sóc sức khỏe tại nhà:
- Nghỉ ngơi hợp lý, uống đủ nước, tránh vận động gắng sức vùng đau.
- Theo dõi thêm: thời gian xuất hiện, mức độ đau (1–10), triệu chứng kèm (sốt, sưng, tê bì, khó thở).
- Dùng thuốc giảm đau thông thường (Paracetamol) nếu không dị ứng và không có bệnh gan/thận nặng — đúng liều trên bao bì.

### 🏥 Chuyên khoa khuyên khám trên MedBooking:
- **Khoa Nội tổng quát** hoặc **Khoa Cơ Xương Khớp** tùy vùng đau và triệu chứng kèm theo.

*Bạn có thể bổ sung thêm: triệu chứng xuất hiện bao lâu, mức độ đau và có sốt/sưng/tê bì không để tôi tinh chỉnh nhận định hơn.*

---
⚠️ *Lưu ý quan trọng: Nhận định từ AI y khoa chỉ mang tính chất tham khảo sơ bộ, hoàn toàn không thay thế việc khám chữa bệnh lâm sàng với bác sĩ chuyên môn. Bạn nên đặt lịch khám trực tiếp với các Bác sĩ tại MedBooking để được thăm khám chi tiết.*`;
    }

    // 8. Default — vẫn đưa nhận định sơ bộ, không chỉ hỏi lại
    return `Chào bạn! Tôi là **MedBooking AI - Trợ lý Bác sĩ Ảo**. Dựa trên mô tả **"${userQuery.trim()}"** của bạn:

### 🩺 Nhận định sơ bộ:
Triệu chứng cần được đánh giá thêm qua khám lâm sàng. Tạm thời, bạn nên theo dõi mức độ khó chịu, thời gian kéo dài và các dấu hiệu báo động (sốt cao, khó thở, đau dữ dội đột ngột, yếu liệt chi).

### 💡 Gợi ý:
- Ghi chú triệu chứng theo ngày; chụp ảnh vùng tổn thương nếu có thay đổi trên da.
- Tránh tự ý dùng kháng sinh hoặc thuốc mạnh khi chưa có chỉ định bác sĩ.

### 🏥 Chuyên khoa trên MedBooking:
- **Khoa Nội tổng quát** để khám ban đầu và được chỉ định chuyên khoa phù hợp.

---
⚠️ *Lưu ý quan trọng: Nhận định từ AI y khoa chỉ mang tính chất tham khảo sơ bộ. Vui lòng đặt lịch khám với bác sĩ trên MedBooking để chẩn đoán chính xác.*`;
}

/**
 * Chẩn đoán AI + gợi ý bác sĩ/chuyên khoa thật trong DB (luồng chat đầy đủ).
 */
export async function getChatDiagnosis(
    userMessage: string,
    chatHistory: ChatMessage[]
): Promise<ChatDiagnosisResult> {
    const recommendations = await getChatRecommendations(userMessage);
    let reply = await getMedicalDiagnosis(userMessage, chatHistory, recommendations);

    const recBlock = formatRecommendationsMarkdown(recommendations);
    if (recBlock && !replyAlreadyHasDoctorRecommendations(reply, recommendations)) {
        reply = reply.trimEnd() + recBlock;
    }

    return { reply, recommendations };
}

/**
 * Main Service Handler (chỉ phần văn bản AI)
 */
export async function getMedicalDiagnosis(
    userMessage: string,
    chatHistory: ChatMessage[],
    recommendations?: ChatRecommendations
): Promise<string> {
    try {
        if (!userMessage || userMessage.trim() === "") {
            throw new ApiError("User message cannot be empty", 400);
        }

        const cleanedMessage = userMessage.trim();
        const doctorContext = recommendations
            ? buildDoctorContextForPrompt(recommendations)
            : "";

        if (GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY_HERE") {
            try {
                console.log("Calling Gemini API with user prompt...");
                return await callGeminiApi(cleanedMessage, chatHistory, doctorContext);
            } catch (apiError) {
                console.error("Failed call to Gemini API, falling back to smart rules:", apiError);
                // Fallback on HTTP errors or rate limits
                return getFallbackMedicalResponse(cleanedMessage);
            }
        } else {
            console.log("No GEMINI_API_KEY found, running Smart Medical Fallback Engine...");
            // Run locally if key is not configured
            return getFallbackMedicalResponse(cleanedMessage);
        }
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(error instanceof Error ? error.message : "Internal chatbot error", 500);
    }
}

async function callGeminiEmrWithFallback(contents: any[]): Promise<string> {
    if (!GEMINI_API_KEY) {
        throw new ApiError("GEMINI_API_KEY is not configured.", 400);
    }

    const emrModels = [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b"
    ];

    let lastError = "Unknown Gemini EMR error";

    for (const model of emrModels) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        try {
            console.log(`Trying EMR extraction with model: ${model}`);
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents,
                    generationConfig: {
                        temperature: 0.1,
                        responseMimeType: "application/json",
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Gemini EMR API (${model}) error:`, errorText);
                lastError = errorText;
                continue;
            }

            const data = await response.json();
            const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (replyText) {
                console.log(`EMR extraction succeeded with model: ${model}`);
                return replyText;
            }
            lastError = "Invalid response structure from Gemini API";
        } catch (err: any) {
            console.error(`Fetch exception for model ${model}:`, err);
            lastError = err.message || String(err);
        }
    }

    throw new ApiError(`Không thể xử lý bằng AI EMR trên bất kỳ Model nào. Lỗi cuối cùng: ${lastError}`, 502);
}

/**
 * AI-assisted transcription structurer.
 * Takes raw voice transcription of doctor-patient consult and parses it into EMR format.
 */
export async function getStructuredEmrFromTranscript(transcriptText: string): Promise<any> {
    if (!transcriptText || transcriptText.trim() === "") {
        throw new ApiError("Transcript text cannot be empty", 400);
    }

    const prompt = `
Bạn là một trợ lý y khoa chuyên nghiệp. Hãy phân tích đoạn hội thoại khám bệnh sau đây giữa bác sĩ và bệnh nhân và trích xuất thông tin bệnh án thành định dạng JSON hợp lệ dưới đây.
Bắt buộc CHỈ trả về một chuỗi JSON hợp lệ duy nhất, KHÔNG chứa các ký tự đánh dấu khối mã như \`\`\`json hay bất kỳ văn bản giải thích nào khác.

QUY TẮC NGHIÊM NGẶT VỀ TRÍCH XUẤT:
1. KHÔNG tự ý bịa tên thuốc. Nếu trong đoạn hội thoại không nhắc đến tên thuốc cụ thể (ví dụ chỉ nói "uống 2 viên", "kê đơn thuốc giảm đau" mà không nói rõ tên biệt dược như Paracetamol, Panadol, Amoxicillin...), hãy để trống trường "medicationName" (tức là "").
2. Tóm tắt ghi chú (notes) phải trung thực với nội dung hội thoại, không thêm thắt các triệu chứng hoặc lời dặn dò mà bác sĩ/bệnh nhân không hề nhắc tới.
3. TUYỆT ĐỐI KHÔNG tự bịa ra chẩn đoán hoặc các câu nói/ý kiến giả định nếu không có cơ sở trực tiếp từ văn bản hội thoại cung cấp.

Cấu trúc JSON:
{
  "diagnosis": "Chẩn đoán bệnh chính xác nhất",
  "notes": "Tóm tắt triệu chứng lâm sàng và lời dặn dò của bác sĩ",
  "prescriptions": [
     {
       "medicationName": "Tên thuốc cụ thể được nhắc tới (để trống nếu không có tên cụ thể)",
       "dosage": "Liều lượng sử dụng (ví dụ: 1 viên)",
       "frequency": "Tần suất sử dụng (ví dụ: 2 lần/ngày, sau ăn)",
       "duration": "Thời gian uống thuốc (ví dụ: 5 ngày)"
     }
  ]
}

Đoạn hội thoại cần phân tích:
"${transcriptText}"
`;

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "" || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        throw new ApiError("GEMINI_API_KEY chưa được cấu hình trên server. Vui lòng thiết lập khóa API Gemini.", 400);
    }

    const contents = [
        {
            role: "user",
            parts: [{ text: prompt }]
        }
    ];

    const replyText = await callGeminiEmrWithFallback(contents);

    try {
        return JSON.parse(replyText.trim());
    } catch (parseError) {
        console.error("Failed to parse JSON reply from Gemini:", replyText);
        const cleaned = replyText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned);
    }
}

export async function getStructuredEmrFromAudio(audioBase64: string, mimeType: string): Promise<any> {
    if (!audioBase64 || audioBase64.trim() === "") {
        throw new ApiError("Audio data cannot be empty", 400);
    }

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "" || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        throw new ApiError("GEMINI_API_KEY chưa được cấu hình trên server. Vui lòng thiết lập khóa API Gemini.", 400);
    }

    const prompt = `
Bạn là một trợ lý y khoa chuyên nghiệp. Hãy lắng nghe đoạn ghi âm hội thoại y tế này và thực hiện hai nhiệm vụ:
1. Nhận diện giọng nói và trích xuất thành văn bản (transcript) cuộc trò chuyện bằng tiếng Việt một cách chi tiết nhất.
2. Phân tích cuộc trò chuyện đó để trích xuất thông tin bệnh án thành định dạng EMR chuẩn.

QUY TẮC NGHIÊM NGẶT VỀ TRÍCH XUẤT:
1. KHÔNG tự ý bịa tên thuốc. Nếu trong đoạn hội thoại không nhắc đến tên thuốc cụ thể (ví dụ chỉ nói "uống 2 viên", "kê đơn thuốc giảm đau" mà không nói rõ tên biệt dược như Paracetamol, Panadol, Amoxicillin...), hãy để trống trường "medicationName" (tức là "").
2. Tóm tắt ghi chú (notes) phải trung thực với nội dung hội thoại, không thêm thắt các triệu chứng hoặc lời dặn dò mà bác sĩ/bệnh nhân không hề nhắc tới.
3. KHÔNG tự ý bịa câu nói hoặc điền thêm lời thoại giả định vào phần trích xuất văn bản (transcript). Phần transcript phải là bản ghi chép trung thực, chính xác từng từ ngữ mà bác sĩ và bệnh nhân thực sự phát ngôn trong file ghi âm. Tuyệt đối không tự suy diễn hoặc tự động thêm thắt lời dặn dò hay thông tin lâm sàng ngoài hội thoại thực tế.

Yêu cầu trả về kết quả dưới dạng JSON hợp lệ duy nhất với cấu trúc sau:
{
  "transcript": "Nội dung văn bản hội thoại chi tiết được nhận diện từ giọng nói",
  "structuredData": {
    "diagnosis": "Chẩn đoán bệnh chính xác nhất bằng tiếng Việt",
    "notes": "Tóm tắt triệu chứng lâm sàng và lời dặn dò của bác sĩ",
    "prescriptions": [
       {
         "medicationName": "Tên thuốc cụ thể được nhắc tới (để trống nếu không có tên cụ thể)",
         "dosage": "Liều lượng sử dụng (ví dụ: 1 viên)",
         "frequency": "Tần suất sử dụng (ví dụ: 2 lần/ngày, sau ăn)",
         "duration": "Thời gian uống thuốc (ví dụ: 5 ngày)"
       }
    ]
  }
}

Chú ý: CHỈ trả về duy nhất chuỗi JSON hợp lệ nêu trên, không thêm bất kỳ văn bản, giải thích hoặc ký tự markdown nào như \`\`\`json.
`;

    const contents = [
        {
            role: "user",
            parts: [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: audioBase64
                    }
                },
                {
                    text: prompt
                }
            ]
        }
    ];

    const replyText = await callGeminiEmrWithFallback(contents);

    try {
        return JSON.parse(replyText.trim());
    } catch (parseError) {
        console.error("Failed to parse JSON reply from Gemini:", replyText);
        const cleaned = replyText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned);
    }
}
