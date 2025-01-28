// Setup variable
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
const fileManager = new GoogleAIFileManager("AIzaSyA6nRUwDozn7hYsRbqGXAtWwm1QU09Umwk");

const genAI = new GoogleGenerativeAI("AIzaSyA6nRUwDozn7hYsRbqGXAtWwm1QU09Umwk");
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });


// Load an image from URL
// const imageResp = await fetch(
//     'https://8486d3381d.vws.vegacdn.vn/UploadFolderNew/SGDLongBien/Image/mnbaccau/Thu_muc_chung/Lop%20A1/175931-tro-choi-dan-gian-o-an-quan_22022022.jpg?w=1130'
// )
//     .then((response) => response.arrayBuffer());

// const result = await model.generateContent([
//     {
//         inlineData: {
//             data: Buffer.from(imageResp).toString("base64"),
//             mimeType: "image/jpeg",
//         },
//     },
//     'Đây là trò chơi dân gian gì? Nêu chi tiết',
// ]);
// console.log(result.response.text());



// Upload a local file
const uploadResult = await fileManager.uploadFile(
  `./image.png`,
  {
    mimeType: "image/jpeg",
    displayName: "Image",
  },
);
// View the response.
console.log(
  `Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`,
);

const result = await model.generateContent([
  "Tell me about this image (in Vietnamese)",
  {
    fileData: {
      fileUri: uploadResult.file.uri,
      mimeType: uploadResult.file.mimeType,
    },
  },
]);
console.log(result.response.text());