const { GoogleGenerativeAI } = require("@google/generative-ai");

async function GenerateResponse(database, userPrompt) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINIAPI);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(userPrompt);
    console.log(result.response.text());
    return result.response.text();
}
module.exports = { GenerateResponse };