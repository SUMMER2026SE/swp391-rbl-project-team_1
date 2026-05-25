import { ApiError } from "../utils/apiError";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Empathy-driven professional System Prompt for clinical assistant
const SYSTEM_PROMPT = `
Bạn là "MedBooking AI - Trợ lý Bác sĩ Ảo" cực kỳ chuyên nghiệp, tận tâm và chu đáo.
Nhiệm vụ của bạn là lắng nghe các triệu chứng sức khỏe mà người dùng chia sẻ, đưa ra nhận định y khoa sơ bộ về các nguyên nhân/bệnh lý có khả năng cao nhất, giải thích ngắn gọn cơ chế/lý do, và cung cấp lời khuyên chăm sóc sức khỏe thiết thực tại nhà (dinh dưỡng, nghỉ ngơi, phòng ngừa).

QUY TẮC PHẢN HỒI (BẮT BUỘC):
1. Phản hồi hoàn toàn bằng tiếng Việt, lịch sự, ân cần và đồng cảm.
2. Trình bày nội dung có cấu trúc rõ ràng, chuyên nghiệp bằng định dạng Markdown (sử dụng danh sách thụt đầu dòng, dấu đầu dòng, chữ in đậm cho các thuật ngữ y học hoặc lưu ý quan trọng).
3. Đề xuất rõ ràng 1 hoặc nhiều **Chuyên khoa chuyên sâu** phù hợp nhất trên hệ thống MedBooking (ví dụ: Khoa Tai Mũi Họng, Khoa Tiêu Hóa, Khoa Da Liễu, Khoa Cơ Xương Khớp...) để người dùng tham khảo đặt lịch.
4. LUÔN LUÔN kết thúc câu trả lời bằng một thông báo cảnh báo/miễn trừ trách nhiệm y tế (Medical Disclaimer) in nghiêng hoặc đặt trong hộp chú ý: Nhấn mạnh rằng đây chỉ là chẩn đoán AI mang tính chất tham khảo sơ bộ, hoàn toàn không thay thế chẩn đoán lâm sàng của bác sĩ chuyên môn và khuyến nghị họ đặt lịch khám trực tiếp với bác sĩ chuyên khoa trên MedBooking để được kiểm tra chính xác nhất.
`;

export interface ChatMessage {
    role: "user" | "model";
    text: string;
}

/**
 * Direct HTTP Call to Google Gemini API (using gemini-1.5-flash)
 */
async function callGeminiApi(prompt: string, history: ChatMessage[]): Promise<string> {
    if (!GEMINI_API_KEY) {
        throw new Error("API Key is missing");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    // Format chat history for Gemini API Structure
    // System instruction is passed in systemInstruction field
    const contents = [
        ...history.map(msg => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.text }]
        })),
        {
            role: "user",
            parts: [{ text: prompt }]
        }
    ];

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            contents: contents,
            systemInstruction: {
                parts: [{ text: SYSTEM_PROMPT }]
            },
            generationConfig: {
                temperature: 0.4,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error details:", errorText);
        throw new ApiError(`Gemini API returned error: ${response.statusText}`, response.status);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
        throw new Error("Invalid response structure from Gemini API");
    }

    return reply;
}

/**
 * Intelligent Fallback Medical Rule Engine
 * Analyzes keywords and returns highly structured and professional medical advisor text.
 */
function getFallbackMedicalResponse(userQuery: string): string {
    const query = userQuery.toLowerCase();

    // 1. Respiratory & Flu (Sốt, ho, viêm họng, sổ mũi, đau họng, cảm lạnh, cúm...)
    if (
        query.includes("ho") ||
        query.includes("sốt") ||
        query.includes("sot") ||
        query.includes("họng") ||
        query.includes("hong") ||
        query.includes("mũi") ||
        query.includes("mui") ||
        query.includes("cúm") ||
        query.includes("cum") ||
        query.includes("cảm") ||
        query.includes("cam") ||
        query.includes("phổi") ||
        query.includes("phoi")
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
        query.includes("bụng") ||
        query.includes("bung") ||
        query.includes("dạ dày") ||
        query.includes("da day") ||
        query.includes("tiêu chảy") ||
        query.includes("tieu chay") ||
        query.includes("nôn") ||
        query.includes("non") ||
        query.includes("đầy hơi") ||
        query.includes("day hoi") ||
        query.includes("tiêu hóa") ||
        query.includes("tieu hoa")
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

    // 3. Bones & Muscles (Đau vai gáy, khớp, lưng, mỏi cơ, tê tay chân...)
    if (
        query.includes("khớp") ||
        query.includes("khop") ||
        query.includes("lưng") ||
        query.includes("lung") ||
        query.includes("xương") ||
        query.includes("xuong") ||
        query.includes("vai gáy") ||
        query.includes("vai gay") ||
        query.includes("cơ") ||
        query.includes("co") ||
        query.includes("tê") ||
        query.includes("te")
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

    // 4. Headache & Cardiovascular / Neurological (Đau đầu, chóng mặt, huyết áp, ngủ không ngon, mất ngủ, tim đập nhanh...)
    if (
        query.includes("đầu") ||
        query.includes("dau") ||
        query.includes("chóng mặt") ||
        query.includes("chong mat") ||
        query.includes("tim") ||
        query.includes("huyết áp") ||
        query.includes("huyet ap") ||
        query.includes("ngủ") ||
        query.includes("ngu") ||
        query.includes("thần kinh") ||
        query.includes("than kinh")
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

    // 5. Skin Problems (Mẩn ngứa, nổi đỏ, mụn, dị ứng da, da liễu...)
    if (
        query.includes("da") ||
        query.includes("ngứa") ||
        query.includes("ngua") ||
        query.includes("mụn") ||
        query.includes("mun") ||
        query.includes("dị ứng") ||
        query.includes("di ung") ||
        query.includes("phát ban") ||
        query.includes("phat ban")
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

    // 6. General / Default Welcome
    return `Chào bạn! Tôi là **MedBooking AI - Trợ lý Bác sĩ Ảo** được tích hợp trên hệ thống. 

Tôi sẵn sàng lắng nghe và đưa ra nhận định sơ bộ về sức khỏe của bạn. Để tôi có thể chẩn đoán chính xác nhất, bạn vui lòng mô tả chi tiết hơn một chút về tình trạng của mình nhé:
- **Triệu chứng chính** là gì? (ví dụ: đau bụng, đau đầu, ho, phát ban...)
- Triệu chứng xuất hiện được **bao lâu** rồi?
- Mức độ đau đớn/khó chịu ở mức nào (âm ỉ, dữ dội, ngắt quãng)?
- Có kèm theo biểu hiện nào khác không (sốt, mệt mỏi, sụt cân...)?

Hoặc bạn có thể bấm vào một trong các **gợi ý triệu chứng nhanh** ở phía dưới để trải nghiệm nhanh dịch vụ chẩn đoán nhé!

---
⚠️ *Lưu ý quan trọng: Nhận định từ AI y khoa chỉ mang tính chất tham khảo sơ bộ, hoàn toàn không thay thế việc khám chữa bệnh lâm sàng với bác sĩ chuyên môn. Bạn nên đặt lịch khám trực tiếp với các Bác sĩ giỏi tại MedBooking để được thăm khám chi tiết.*`;
}

/**
 * Main Service Handler
 */
export async function getMedicalDiagnosis(userMessage: string, chatHistory: ChatMessage[]): Promise<string> {
    try {
        if (!userMessage || userMessage.trim() === "") {
            throw new ApiError("User message cannot be empty", 400);
        }

        // Clean user message
        const cleanedMessage = userMessage.trim();

        // Check if API Key is configured. If so, attempt real API Call.
        if (GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY_HERE") {
            try {
                console.log("Calling Gemini 1.5 Flash API with user prompt...");
                return await callGeminiApi(cleanedMessage, chatHistory);
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
