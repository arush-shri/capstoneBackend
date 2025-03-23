const express = require("express");
const application = express();
const genAiRoute = require('./routes/genai')
const paymentRoute = require('./routes/payments')
const authRoute = require('./routes/auth')
const database = require('./controllers/dbConnector') 
const crypto = require("crypto");
const fs = require("fs");
const cors = require("cors");

const RSA_KEYS_PATH = "./rsa_keys.json";
let privateKey, publicKey, clientPublicKey;

if (fs.existsSync(RSA_KEYS_PATH)) {
    const keys = JSON.parse(fs.readFileSync(RSA_KEYS_PATH, "utf8"));
    privateKey = keys.privateKey;
    publicKey = keys.publicKey;
} else {
    const { publicKey: pub, privateKey: priv } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 4096,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" }
    });

    privateKey = priv;
    publicKey = pub;
    fs.writeFileSync(RSA_KEYS_PATH, JSON.stringify({ publicKey, privateKey }));
}


function decryptAESKey(encryptedAESKeyBase64, privateKey) {
    try {
      // ✅ Convert Base64 back to a Buffer correctly
      const encryptedAESKey = Buffer.from(encryptedAESKeyBase64, "base64");
  
      // ✅ Ensure matching hash algorithm (SHA-256)
      const aesKeyBuffer = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256", // ⬅ Match the Web Crypto API hash
        },
        encryptedAESKey
      );
  
      return aesKeyBuffer;
    } catch (error) {
      console.error("Decryption Error:", error);
    }
}

function decryptAESMessage(encryptedMessageBase64, ivBase64, aesKeyBuffer) {
    try {
      const algorithm = "aes-256-gcm";
  
      // ✅ Convert Base64 IV & Encrypted Message to Buffers
      const iv = Buffer.from(ivBase64, "base64");
      const encryptedMessage = Buffer.from(encryptedMessageBase64, "base64");
  
      // ✅ Extract Authentication Tag (last 16 bytes of encrypted data)
      const tagLength = 16; // Default tag length for GCM mode
      const tag = encryptedMessage.slice(-tagLength); // Extract last 16 bytes
      const encryptedData = encryptedMessage.slice(0, -tagLength); // Remove tag
  
      // ✅ Create Decipher & Set Authentication Tag
      const decipher = crypto.createDecipheriv(algorithm, aesKeyBuffer, iv);
      decipher.setAuthTag(tag); // Essential for AES-GCM
  
      // ✅ Perform Decryption
      let decryptedMessage = decipher.update(encryptedData);
      decryptedMessage = Buffer.concat([decryptedMessage, decipher.final()]);
  
      return decryptedMessage.toString("utf-8"); // Convert Buffer to String
    } catch (error) {
      console.error("Decryption Error:", error);
    }
}

function generateAESKey() {
    return crypto.randomBytes(32); // 256-bit AES key
}

// Function to encrypt a message using AES-GCM
function encryptAESMessage(message, aesKey, iv) {
    const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
    let encrypted = cipher.update(message, "utf8", "base64");
    encrypted += cipher.final("base64");
    const authTag = cipher.getAuthTag(); // Get authentication tag
    return { encrypted, authTag };
}

// Function to encrypt the AES key using the client's RSA public key
function encryptAESKey(aesKey, clientPublicKey) {
    const pemKey = `-----BEGIN PUBLIC KEY-----\n${clientPublicKey.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;
    
    const publicKeyFinal = crypto.createPublicKey({
        key: pemKey,
        format: "pem",
        type: "spki", // The frontend exported SPKI, so use this type
    });

    return crypto.publicEncrypt(
        {
            key: publicKeyFinal,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        aesKey
    );
}

application.use(cors());
application.use(express.json());
application.use("/genai", genAiRoute);
application.use("/payment", paymentRoute);
application.use("/auth", authRoute);

application.get("/get-server-public-key", (req, res) => {
    res.json({ publicKey: Buffer.from(publicKey).toString("base64") });
});

application.post("/receive-client-public-key", async(req, res) => {
    const clientPublicKey = req.body.clientPublicKey;
    const sessionKey = req.body.sessionKey;
    const database = req.app.locals.database;
    await database.collection("PublicKeys").updateOne(
        { _id: sessionKey },
        { $set: { clientPublicKey } },
        { upsert: true }
    );
    res.json({ success: true });
});

application.post("/receive-message", (req, res) => {
    const { encryptedAESKey, encryptedMessage, iv } = req.body;
    const aesKeyBuffer = decryptAESKey(encryptedAESKey, privateKey);
    
    const decryptedMessage = decryptAESMessage(encryptedMessage, iv, aesKeyBuffer);

    console.log("Received & Decrypted:", decryptedMessage.toString());

    const responseMessage = "Hello, Client!";
    const newAesKey = generateAESKey(); // Generate a new AES key for response
    const newIv = crypto.randomBytes(12); // Generate a random IV
    const { encrypted, authTag } = encryptAESMessage(responseMessage, newAesKey, newIv);

    // Step 4: Encrypt the new AES key using client's public key
    const encryptedAESKeyResponse = encryptAESKey(newAesKey, clientPublicKey);
    // Send response with encrypted AES key and message
    res.json({
        encryptedAESKey: encryptedAESKeyResponse.toString("base64"),
        encryptedMessage: encrypted,
        iv: newIv.toString("base64"),
        authTag: authTag.toString("base64"), // Include authentication tag
    });
});

application.get('/', (req,res) => {
    res.status(200).send("Hello! Welcome to code reviewer");
});

database.initDb(
    function(err){
        application.listen(4000, () => {
            if(err){
                console.log(err)
                throw err;
            }
            application.locals.database = database.getDb();
            console.log("Server started at port 4000");
        });
    }
);