import { GoogleGenerativeAI,HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const apiKey = "AIzaSyA6nRUwDozn7hYsRbqGXAtWwm1QU09Umwk";
const genAI = new GoogleGenerativeAI(apiKey);
let chatSession;
let uploadedImage = null;
let chatHistory = [];

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `
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
- Luôn luôn kết hợp câu trả lời với emoji để tăng sức truyền đạt.
- Tránh sử dụng ngôn ngữ khó hiểu hoặc chuyên ngành.
- Cung cấp thông tin chính xác và đáng tin cậy.
- Sử dụng markdown để trả lời câu hỏi.
`,
});

const generationConfig = {
    temperature: 0.8,
    topP: 0.9,
    topK: 10,
    maxOutputTokens: 8192,
};

async function initChat() {
    chatSession = model.startChat({
        generationConfig,
        history: chatHistory,
    });
    return chatSession;
}

function addMessage(content, isUser = false, imageBase64 = null) {
    const messagesDiv = document.getElementById('messages');
    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    if (isUser) {
        messageContainer.classList.add('user');
    }

    // Add avatar
    const avatar = document.createElement('img');
    avatar.src = isUser ? 'https://images.unsplash.com/photo-1618397746666-63405ce5d015?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' : 'https://api.dicebear.com/7.x/bottts/svg?seed=gemini';
    avatar.className = 'avatar';
    messageContainer.appendChild(avatar);

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    // Add image if present
    if (imageBase64) {
        const imageElement = document.createElement('img');
        imageElement.src = `data:image/jpeg;base64,${imageBase64}`;
        imageElement.className = 'message-image';
        messageDiv.appendChild(imageElement);
    }

    // Add text content div that will be used for streaming
    const textElement = document.createElement('div');
    textElement.className = 'message-text';
    if (content) {
        textElement.innerHTML = marked.parse(content);
    }
    messageDiv.appendChild(textElement);

    messageContainer.appendChild(messageDiv);
    messagesDiv.appendChild(messageContainer);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    return textElement; // Return the text element for streaming updates
}

async function processImageAndText(message, imageBase64 = null) {
    try {
        if (!chatSession) {
            await initChat();
        }
        
        // Add user message
        addMessage(message, true, imageBase64);
        
        // Add typing indicator
        const typingContainer = document.createElement('div');
        typingContainer.className = 'message-container'
        typingContainer.className = 'message-typing-area';
        
        const typingAvatar = document.createElement('img');
        typingAvatar.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=gemini';
        typingAvatar.className = 'avatar';
        typingContainer.appendChild(typingAvatar);
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing';
        typingDiv.innerHTML = '<span class="typing-dots"></span>';
        typingContainer.appendChild(typingDiv);
        
        document.getElementById('messages').appendChild(typingContainer);
        
        // Create bot message container
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        messageContainer.style.display = 'none'; // Hide initially
        
        const avatar = document.createElement('img');
        avatar.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=gemini';
        avatar.className = 'avatar';
        messageContainer.appendChild(avatar);
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        const textElement = document.createElement('div');
        textElement.className = 'message-text';
        messageDiv.appendChild(textElement);
        
        messageContainer.appendChild(messageDiv);
        document.getElementById('messages').appendChild(messageContainer);

        let result;
        let responseText = '';
        
        if (imageBase64) {
            result = await model.generateContentStream([
                message || "Tell me about this image (in Vietnamese)",
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: 'image/jpeg'
                    },
                }
            ]);
        } else {
            result = await chatSession.sendMessageStream(message);
        }

        // Remove typing indicator and show message container
        typingContainer.remove();
        messageContainer.style.display = '';

        // Process the stream
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            responseText += chunkText;
            textElement.innerHTML = marked.parse(responseText);
            document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
        }

        // Update chat history
        chatHistory.push({
            role: 'user',
            parts: [{ text: message }]
        });
        
        if (imageBase64) {
            chatHistory.push({
                role: 'user',
                parts: [
                    { text: message },
                    { 
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: imageBase64
                        }
                    }
                ]
            });
        }

        chatHistory.push({
            role: 'model',
            parts: [{ text: responseText }]
        });

        // Reinitialize chat with updated history
        await initChat();

        // Clean up UI
        const imagePreviewContainer = document.querySelector('.image-preview-container');
        if (imagePreviewContainer) {
            imagePreviewContainer.remove();
        }
        uploadedImage = null;
        document.getElementById('send').disabled = true;
        
    } catch (error) {
        console.error('Error:', error);
        const typingContainer = document.querySelector('.message-typing-area');
        if (typingContainer?.querySelector('.typing')) {
            typingContainer.remove();
        }
        addMessage('Xin lỗi, đã có lỗi xảy ra khi xử lý tin nhắn của bạn.', false);
    }
}

// Event Listeners
const uploadBtn = document.getElementById('uploadBtn');
const imageUpload = document.getElementById('imageUpload');
const textarea = document.getElementById('input');

uploadBtn.addEventListener('click', () => {
    imageUpload.click();
});

imageUpload.addEventListener('change', async (e) => {
    try {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async () => {
                uploadedImage = reader.result.split(',')[1];

                // Hiển thị hình ảnh preview
                const imagePreviewContainer = document.createElement('div');
                imagePreviewContainer.className = 'image-preview-container';
                const imagePreview = document.createElement('img');
                imagePreview.src = reader.result;
                imagePreview.className = 'image-preview';
                
                const removeBtn = document.createElement('button');
                removeBtn.innerHTML = '×';
                removeBtn.className = 'remove-image-btn';
                removeBtn.addEventListener('click', () => {
                    uploadedImage = null;
                    imagePreviewContainer.remove();
                    document.getElementById('send').disabled = true;
                });

                imagePreviewContainer.appendChild(imagePreview);
                imagePreviewContainer.appendChild(removeBtn);

                const existingPreview = document.querySelector('.image-preview-container');
                if (existingPreview) {
                    existingPreview.remove();
                }
                
                const inputWrapper = document.querySelector('.input-wrapper');
                inputWrapper.insertBefore(imagePreviewContainer, inputWrapper.firstChild);

                // Kích hoạt nút gửi
                document.getElementById('send').disabled = false;
            };
            reader.readAsDataURL(file);
            imageUpload.value = '';
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();

        // Remove suggestions UI
        const welcomeSection = document.querySelector('.welcome');
        const suggestionsSection = document.querySelector('.suggestions-grid');
        if (welcomeSection) welcomeSection.remove();
        if (suggestionsSection) suggestionsSection.remove();

        const existingPreview = document.querySelector('.image-preview-container');
        if (existingPreview) {
            existingPreview.remove();
        }
        const message = e.target.value.trim();
        if (message || uploadedImage) {
            processImageAndText(message, uploadedImage);
            e.target.value = '';
            e.target.style.height = 'auto';
        }
    }
});

document.getElementById('send').addEventListener('click', (e) => {
    e.preventDefault(); // Ngăn chặn reload trang

    // Remove suggestions UI
    const welcomeSection = document.querySelector('.welcome');
    const suggestionsSection = document.querySelector('.suggestions-grid');
    if (welcomeSection) welcomeSection.remove();
    if (suggestionsSection) suggestionsSection.remove();

    const existingPreview = document.querySelector('.image-preview-container');
    if (existingPreview) {
        existingPreview.remove();
    }
    const input = document.getElementById('input');
    const message = input.value.trim();
    if (message || uploadedImage) {
        processImageAndText(message, uploadedImage);
        input.value = '';
        input.style.height = 'auto';
    }
});

// Initial suggestions data
const suggestions = [
    {
        title: "🎮 Trò chơi dân gian phổ biến",
        content: "Giới thiệu cho tôi một số trò chơi dân gian phổ biến nhất ở Việt Nam"
    },
    {
        title: "🏃 Trò chơi vận động",
        content: "Những trò chơi dân gian nào giúp rèn luyện thể chất cho trẻ em?"
    },
    {
        title: "🧩 Trò chơi trí tuệ",
        content: "Giới thiệu các trò chơi dân gian giúp phát triển tư duy và trí tuệ"
    },
    {
        title: "👥 Trò chơi tập thể",
        content: "Những trò chơi dân gian nào phù hợp cho nhóm đông người chơi?"
    }
];

// Function to create suggestions UI
function createSuggestionsUI() {
    const messagesArea = document.getElementById('messages');
    
    // Create welcome section
    const welcome = document.createElement('div');
    welcome.className = 'welcome';
    welcome.innerHTML = `
        <h1><strong>Xin chào! 👋</strong></h1>
        <h2>Hãy để tôi giới thiệu về các trò chơi dân gian Việt Nam.</h2>
    `;
    
    // Create suggestions grid
    const suggestionsGrid = document.createElement('div');
    suggestionsGrid.className = 'suggestions-grid';
    
    // Add suggestion cards
    suggestions.forEach((suggestion, index) => {
        const card = document.createElement('div');
        card.className = 'suggestion-card';
        card.setAttribute('data-index', index); // Để xác định vị trí phần tử
        card.innerHTML = `
            <div class="card-content">${suggestion.title}</div>
            <div class="suggestion-preview">${suggestion.content}</div>
        `;
        
        // Add click handler
        card.addEventListener('click', () => {
            // Remove suggestions UI
            const welcomeSection = document.querySelector('.welcome');
            const suggestionsSection = document.querySelector('.suggestions-grid');
            if (welcomeSection) welcomeSection.remove();
            if (suggestionsSection) suggestionsSection.remove();
            
            // Send the suggestion message
            processImageAndText(suggestion.content);
        });
        
        suggestionsGrid.appendChild(card);
    });
    
    // Add welcome and suggestions to messages area
    messagesArea.appendChild(welcome);
    messagesArea.appendChild(suggestionsGrid);
    
    // Add specific styles for suggestions UI
    const style = document.createElement('style');
    style.textContent = `
        .welcome {
            margin-top: 2rem;
            padding: 2rem 1rem;
        }
        
        .welcome h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            font-weight: 400;
        }
        
        .welcome h2 {
            font-size: 1.5rem;
            color: #666;
            font-weight: 400;
        }
        
        .dark-mode .welcome h2 {
            color: #9aa0a6;
        }
        
        .suggestions-grid {
            display: grid;
            gap: 1rem;
            padding: 0 1rem;
            margin-bottom: 100px;
            grid-template-columns: repeat(2, 1fr); /* Default to 2 columns */
        }

        @media screen and (min-width: 768px) {
            .suggestions-grid {
                grid-template-columns: repeat(4, 1fr); /* 4 columns for medium screens */
            }
        }

        @media screen and (max-width: 600px) {
            .suggestions-grid {
                grid-template-columns: 1fr; /* 1 column for small screens */
            }

            .suggestion-card {
                display: none;
            }

            .suggestion-card:nth-child(-n+3) {
                display: block;
            }
        }

        .suggestion-card {
            background: var(--light-secondary-bg);
            border-radius: 12px;
            padding: 1.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid var(--light-border);
        }
        
        .dark-mode .suggestion-card {
            background: var(--dark-secondary-bg);
            border-color: var(--dark-border);
        }
        
        .suggestion-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .dark-mode .suggestion-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        
        .card-content {
            font-size: 1.2rem;
            margin-bottom: 0.5rem;
            font-weight: 500;
        }
        
        .suggestion-preview {
            font-size: 1rem;
            color: #666;
        }
        
        .dark-mode .suggestion-preview {
            color: #9aa0a6;
        }
    `;
    
    document.head.appendChild(style);
}

// Initialize suggestions UI when page loads
document.addEventListener('DOMContentLoaded', () => {
    createSuggestionsUI();
    
    // Add event listener to remove suggestions on manual message
    const textarea = document.getElementById('input');
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && textarea.value.trim()) {
            const welcomeSection = document.querySelector('.welcome');
            const suggestionsSection = document.querySelector('.suggestions-grid');
            if (welcomeSection) welcomeSection.remove();
            if (suggestionsSection) suggestionsSection.remove();
        }
    });
});

initChat();