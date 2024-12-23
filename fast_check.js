import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI("AIzaSyA6nRUwDozn7hYsRbqGXAtWwm1QU09Umwk");

const config = {temperature: 0.3, topP: 0.1, topK: 1, responseMimeType: "text/plain"};

async function check(question) {
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-8b",
        systemInstruction: 'Trả lời "true" nếu cần tìm kiếm về trò chơi dân gian. Trả lời "false" nếu đơn giản.'
    });

    const chat = await model.startChat({ generationConfig: { ...config, maxOutputTokens: 5 } });
    const needSearch = (await chat.sendMessage(`Câu lệnh này có cần sử dụng công cụ tìm kiếm không: ${question}`)).response.text().trim() === "true";

    if (!needSearch) return "Không cần tìm kiếm";

    const searchChat = await model.startChat({ generationConfig: { ...config, maxOutputTokens: 50 } });
    return (await searchChat.sendMessage(`Hãy tìm từ khóa đề tìm kiếm về vấn đề này: ${question}`)).response.text();
}

console.log(await check("Giới thiệu trò chơi thả đỉa ba ba"));
