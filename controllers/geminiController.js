const { GoogleGenerativeAI } = require("@google/generative-ai");
const crypto = require('crypto');

async function GenerateResponse(database, body) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINIAPI);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const collection = database.collection("Reviews");

    const result = await model.generateContent(body.userPrompt);
    const aiResponse = result.response.text().trim();
    const uuid = crypto.randomBytes(16).toString('hex');

    const dataToStore = {
        _id: uuid,
        user: body.userid,
        dateTime: new Date().toUTCString(),
        userPrompt: body.userPrompt,
        aiResponse: aiResponse
    };

    await collection.insertOne(dataToStore);
    return aiResponse;
}
module.exports = { GenerateResponse };