async function processWithGemini(htmlContent) {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");

    const apiKey = "AIzaSyA6nRUwDozn7hYsRbqGXAtWwm1QU09Umwk";
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
    });

    const generationConfig = {
        temperature: 0.8,
        topP: 0.9,
        topK: 10,
        maxOutputTokens: 8192,
    };

    const chatSession = model.startChat({
        generationConfig,
        history: [],
    });

    try {
        const result = await chatSession.sendMessage(`Chọn lọc và định dạng markdown các nội dung sau, chỉ lấy nội dung của phần nội dung chính, đầy đủ:\n\`\`\`\n${htmlContent}\n\`\`\``);
        return result.response.text();
    } catch (error) {
        console.error('Error processing content:', error);
        return 'Error processing content';
    }
}

async function fetchAndProcessHTML() {
    const urlInput = document.getElementById('urlInput');
    const htmlOutput = document.getElementById('htmlOutput');
    const errorDiv = document.getElementById('error');
    const loadingDiv = document.getElementById('loading');
    const copyButton = document.getElementById('copyButton');
    const fetchButton = document.getElementById('fetchButton');

    // Reset previous state
    errorDiv.style.display = 'none';
    htmlOutput.textContent = '';
    copyButton.style.display = 'none';

    // Split URLs by comma and trim whitespace
    const urls = urlInput.value.split(',').map(url => url.trim());

    // Show loading state
    loadingDiv.style.display = 'block';
    fetchButton.disabled = true;

    try {
        const results = [];
        
        for (const url of urls) {
            try {
                // Validate URL
                new URL(url);
                
                // Use a CORS proxy to fetch the HTML
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
                const response = await fetch(proxyUrl);

                if (!response.ok) {
                    results.push(`Error fetching ${url}: ${response.statusText}`);
                    continue;
                }

                const html = await response.text();
                const processedHTML = processHTMLContent(html);
                const geminiProcessed = await processWithGemini(processedHTML);
                results.push(`# Content from ${url}\n\n${geminiProcessed}\n\n---\n`);

            } catch (urlError) {
                results.push(`Error processing ${url}: ${urlError.message}`);
            }
        }

        htmlOutput.textContent = results.join('\n');
        copyButton.style.display = 'block';

    } catch (error) {
        errorDiv.textContent = `Error: ${error.message}. Try another URL or check your internet connection.`;
        errorDiv.style.display = 'block';
    } finally {
        loadingDiv.style.display = 'none';
        fetchButton.disabled = false;
    }
}

function processHTMLContent(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove headers and scripts
    const headers = doc.querySelectorAll('header');
    headers.forEach(header => header.remove());
    const scripts = doc.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    const body = doc.body;
    const ketQua = [];

    function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            ketQua.push(node.textContent);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName.toLowerCase() === 'p') {
                processChildren(node);
                ketQua.push("\n");
            } else if (node.tagName.toLowerCase() === 'span') {
                processChildren(node);
                ketQua.push(" ");
            } else {
                processChildren(node);
            }
        }
    }

    function processChildren(element) {
        element.childNodes.forEach(child => {
            processNode(child);
        });
    }

    processChildren(body);

    return ketQua.join('')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
}

function copyToClipboard() {
    const htmlOutput = document.getElementById('htmlOutput');
    const copyButton = document.getElementById('copyButton');

    navigator.clipboard.writeText(htmlOutput.textContent)
        .then(() => {
            const originalText = copyButton.textContent;
            copyButton.textContent = 'Copied!';
            setTimeout(() => {
                copyButton.textContent = originalText;
            }, 2000);
        })
        .catch(err => {
            console.error('Could not copy text: ', err);
            const textarea = document.createElement('textarea');
            textarea.value = htmlOutput.textContent;
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            try {
                document.execCommand('copy');
                const originalText = copyButton.textContent;
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = originalText;
                }, 2000);
            } catch (copyErr) {
                console.error('Fallback copy failed: ', copyErr);
                copyButton.textContent = 'Copy Failed';
            } finally {
                document.body.removeChild(textarea);
            }
        });
}

// Event listeners
document.getElementById('fetchButton').addEventListener('click', fetchAndProcessHTML);
document.getElementById('copyButton').addEventListener('click', copyToClipboard);