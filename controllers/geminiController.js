const { GoogleGenerativeAI } = require("@google/generative-ai");
const crypto = require('crypto');

async function GenerateResponse(database, body) {
    const userCollection = database.collection("Users");
    const userData = await userCollection.findOneAndUpdate(
        { _id: body.userid, tokens: { $gt: 0 } },
        { $inc: { tokens: -1 } },
        { returnDocument: 'after' }
    );

    if(userData){
        const collection = database.collection("Reviews");
        const genAI = new GoogleGenerativeAI(process.env.GEMINIAPI);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


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
    } else{
        return "Out of tokens"
    }
}
module.exports = { GenerateResponse };