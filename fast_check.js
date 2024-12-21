import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI("AIzaSyA6nRUwDozn7hYsRbqGXAtWwm1QU09Umwk");  
const model = genAI.getGenerativeModel({model: "gemini-1.5-flash-8b",systemInstruction: "Trả lời \"true\" nếu câu hỏi phức tạp cần tìm kiếm (ví dụ: lịch sử trò chơi dân gian).  Trả lời \"false\" nếu đơn giản.  Ưu tiên tìm kiếm cho thông tin trò chơi dân gian."});
const generationConfig = {temperature: 0.3,topP: 0.1,topK: 1,maxOutputTokens: 5,responseMimeType: "text/plain",};
  
async function check(question) {
    const chatSession = model.startChat({generationConfig, history: [],});
    const result = await chatSession.sendMessage(`Câu lệnh này có cần sử dụng công cụ tìm kiếm không: ${question}`);
    return result.response.text().trim() == "true";
}
console.log(await check("Bạn có thể làm gì"));