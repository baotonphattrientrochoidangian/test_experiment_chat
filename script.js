import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyA6nRUwDozn7hYsRbqGXAtWwm1QU09Umwk"; // Replace with your actual API key
const genAI = new GoogleGenerativeAI(apiKey);
let chatSession;

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: 
`
# Character
Bạn là một AI chuyên giới thiệu và hướng dẫn về Trò chơi dân gian Việt Nam.  Bạn có khả năng giải thích luật chơi, nguồn gốc, và ý nghĩa văn hóa của các trò chơi một cách rõ ràng và dễ hiểu. Bạn cũng có thể gợi ý những trò chơi phù hợp với độ tuổi và sở thích của người dùng.

## Skills
### Skill 1: Giới thiệu trò chơi dân gian
- Mô tả chi tiết luật chơi, cách chơi của trò chơi.
- Giải thích nguồn gốc và ý nghĩa văn hóa của trò chơi.
- Cung cấp hình ảnh hoặc video minh họa (nếu có).
- Đánh giá mức độ phổ biến và sự lan truyền của trò chơi.

### Skill 2: Hướng dẫn cách chơi
- Cung cấp hướng dẫn từng bước một cách rõ ràng và dễ hiểu.
- Sử dụng ngôn ngữ đơn giản, dễ tiếp cận với mọi đối tượng.
- Gợi ý các biến thể hoặc cách chơi khác nhau của trò chơi (nếu có).

### Skill 3: Gợi ý trò chơi phù hợp
- Xác định độ tuổi và sở thích của người dùng.
- Đề xuất các trò chơi dân gian phù hợp với độ tuổi và sở thích đó.
- Giải thích lý do tại sao các trò chơi đó phù hợp.

## Constraints:
- Chỉ tập trung vào các trò chơi dân gian Việt Nam.
- Sử dụng ngôn ngữ Việt Nam chính xác và rõ ràng.
- Tránh sử dụng ngôn ngữ khó hiểu hoặc chuyên ngành.
- Cung cấp thông tin chính xác và đáng tin cậy.
- Trả lời ngắn gọn, xúc tích và dễ hiểu.
`,
});

const generationConfig = {
    temperature: 0.8,
    topP: 0.9,
    topK: 10,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

async function initChat() {
    chatSession = await model.startChat({
        generationConfig,
        history: [],
    });
}

function addMessage(content, isUser = false) {
    const messagesDiv = document.getElementById('messages');
    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
      if (isUser) {
        messageContainer.classList.add('user'); 
    }
    
    if (!isUser) {
        const avatar = document.createElement('img');
        avatar.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=gemini';
        avatar.className = 'avatar';
        messageContainer.appendChild(avatar);
    } else {
          const avatar = document.createElement('img');
        avatar.src = 'https://images.unsplash.com/photo-1618397746666-63405ce5d015?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
        avatar.className = 'avatar';
        messageContainer.appendChild(avatar);
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.innerHTML = marked.parse(content);
    messageContainer.appendChild(messageDiv);
    
    messagesDiv.appendChild(messageContainer);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendMessage(message) {
    try {
        if (!chatSession) await initChat();
        const timestamp = new Date().toLocaleString();
        addMessage(message, true, timestamp);
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message-container';
        const avatar = document.createElement('img');
        avatar.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=gemini';
        avatar.className = 'avatar';
        typingDiv.appendChild(avatar);
        
        const typingContent = document.createElement('div');
        typingContent.className = 'typing';
        typingContent.innerHTML = 'Typing<span class="typing-dots"></span>';
        typingDiv.appendChild(typingContent);
        
        document.getElementById('messages').appendChild(typingDiv);

        const result = await chatSession.sendMessage(message);
        const response = result.response.text();
        
        typingDiv.remove();
        addMessage(response, false, timestamp);
    } catch (error) {
        console.error('Error:', error);
        typingDiv?.remove();
        addMessage('Sorry, there was an error processing your message.');
    }
}

const textarea = document.getElementById('input');

textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const message = e.target.value.trim();
        if (message) {
            sendMessage(message);
            e.target.value = '';
            e.target.style.height = 'auto';
        }
    }
});

document.getElementById('send').addEventListener('click', () => {
    console.log('Update!');
    const input = document.getElementById('input');
    const message = input.value.trim();
    if (message) {
        sendMessage(message);
        input.value = '';
        input.style.height = 'auto';
    }
});

initChat();