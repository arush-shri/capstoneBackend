const { GoogleGenerativeAI } = require("@google/generative-ai");

async function GenerateResponse(database, body) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINIAPI);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const collection = database.collection("Reviews");

    const result = await model.generateContent(body.userPrompt);
    const aiResponse = result.response.text();

    const dataToStore = {
        user: body.userid,
        dateTime: new Date.toUTCString(),
        userPrompt: body.userPrompt,
        aiResponse: aiResponse
    };

    await collection.insertOne(dataToStore);
    return aiResponse;
}
module.exports = { GenerateResponse };