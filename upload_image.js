// Setup
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyA6nRUwDozn7hYsRbqGXAtWwm1QU09Umwk");
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// BUTTON
const uploadBtn = document.getElementById('uploadBtn');

uploadBtn.addEventListener('click', () => {
    imageUpload.click();
});

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

imageUpload.addEventListener('change', async (e) => {
    try {
        const file = e.target.files[0];
        if (file) {
            // Hiển thị URL file tạm thời
            const imageUrl = URL.createObjectURL(file);
            console.log('Image URL:', imageUrl);
            
            // Reset input để có thể chọn lại cùng một ảnh
            imageUpload.value = '';
            
            const reader = new FileReader();
            reader.onload = async () => {
                const base64Data = reader.result.split(',')[1];
                // Generate nội dung dựa trên ảnh
                const result = await model.generateContent([
                    "Tell me about this image (in Vietnamese)",
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: file.type,
                        },
                    }
                ]);
                
                console.log('Response:', result.response.candidates[0].content.parts[0].text);
                addMessage(result.response.candidates[0].content.parts[0].text);
            };
            
            reader.onerror = (error) => {
                console.error('Error reading file:', error);
            };
            reader.readAsDataURL(file);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});