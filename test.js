import puppeteer from 'puppeteer';
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI("AIzaSyA6nRUwDozn7hYsRbqGXAtWwm1QU09Umwk");  
const check_model = genAI.getGenerativeModel({model: "gemini-1.5-flash-8b"});
const check_generationConfig = {temperature: 1,topP: 1,topK: 1,maxOutputTokens: 5,responseMimeType: "text/plain",};
  
async function check(question) {
    const chatSession = check_model.startChat({check_generationConfig, history: [],});
    const result = await chatSession.sendMessage(`Trả lời \"true\" nếu câu hỏi phức tạp cần tìm kiếm (ví dụ: Giới thiệu cho tôi về trò chơi dân gian nào đó,  lịch sử trò chơi dân gian, nguồn gốc trò chơi dân gian nào đó,...).  Trả lời \"false\" nếu đơn giản (\"Xin chào\", \"Bạn là ai?\", \"Bạn có thể làm gì?\",...). Luôn ưu tiên/khuyến khích tìm kiếm cho thông tin trò chơi dân gian.  Câu hỏi: \"${question}\"`);
    return result.response.text().trim() == "true";
}

async function scrapeGoogle(query) {
  const browser = await puppeteer.launch({headless:true, args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-accelerated-2d-canvas','--disable-gpu','--window-size=1920x1080']});
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setDefaultNavigationTimeout(500);
  page.on('request', req => ['image', 'stylesheet', 'font', 'script'].includes(req.resourceType()) ? req.abort() : req.continue());
  page.setRequestInterception(true);

  try {
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}&num=5`, {waitUntil: 'domcontentloaded', timeout: 10000});
    const results = await page.$$eval('div.tF2Cxc', elements => elements.map(el => ({title: el.querySelector('h3')?.innerText || '', link: el.querySelector('a')?.href || ''})));
    await page.close();

    const detailedResults = await Promise.all(results.map(async ({title, link}) => {
      try {
        const p = await browser.newPage();
        p.on('request', req => ['image', 'stylesheet', 'font', 'script'].includes(req.resourceType()) ? req.abort() : req.continue());
        p.setRequestInterception(true);
        await p.goto(link, {waitUntil: 'domcontentloaded', timeout: 500});
        const content = await p.evaluate(() => document.querySelector('article')?.innerText || document.querySelector('main')?.innerText || document.querySelector('body')?.innerText || '');
        await p.close();
        return {title, link, content: content.trim()};
      } catch (error) {return {title, link, content: ''};}
    }));

    return detailedResults.filter(r => r.content).map((item, index) => `### ${index + 1}. [${item.title}](${item.link})\n\nContent: \"\"\"${item.content}\"\"\"\n\n---\n`).join('\n');

  } finally {await browser.close();}
}

async function processQuestion(question) {
  const needsSearch = await check(question);
  console.log(needsSearch);
  if (needsSearch) {
    return `# Đây là kết quả tìm kiếm từ web mà bạn sẽ cần tham khảo:\n\n\`\`\`${await scrapeGoogle(question)}\`\`\``;
  } else {
    return "";
  }
}
let response = await processQuestion("Trò chơi thả đỉa ba ba");
console.log(response);