const crypto = require("crypto");
const fs = require("fs");
const RSA_KEYS_PATH = "../rsa_keys.json";
let privateKey, publicKey;

if (fs.existsSync(RSA_KEYS_PATH)) {
    const keys = JSON.parse(fs.readFileSync(RSA_KEYS_PATH, "utf8"));
    privateKey = keys.privateKey;
    publicKey = keys.publicKey;
}

function generateAESKey() {
    return crypto.randomBytes(32);
}

function decryptAESKey(encryptedAESKeyBase64, privateKey) {
    try {
        const encryptedAESKey = Buffer.from(encryptedAESKeyBase64, "base64");

        const aesKeyBuffer = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
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

        const iv = Buffer.from(ivBase64, "base64");
        const encryptedMessage = Buffer.from(encryptedMessageBase64, "base64");

        const tagLength = 16;
        const tag = encryptedMessage.slice(-tagLength);
        const encryptedData = encryptedMessage.slice(0, -tagLength);

        const decipher = crypto.createDecipheriv(algorithm, aesKeyBuffer, iv);
        decipher.setAuthTag(tag);

        let decryptedMessage = decipher.update(encryptedData);
        decryptedMessage = Buffer.concat([decryptedMessage, decipher.final()]);
    
        return decryptedMessage.toString("utf-8");
    } catch (error) {
        console.error("Decryption Error:", error);
    }
}

async function DecryptBody(body) {
    const { encryptedAESKey, encryptedMessage, iv } = body;
    const aesKeyBuffer = decryptAESKey(encryptedAESKey, privateKey);
    
    const decryptedMessage = decryptAESMessage(encryptedMessage, iv, aesKeyBuffer);

    return JSON.parse(decryptedMessage.toString());
}

function encryptAESMessage(message, aesKey, iv) {
    const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
    let encrypted = cipher.update(message, "utf8", "base64");
    encrypted += cipher.final("base64");
    const authTag = cipher.getAuthTag();
    return { encrypted, authTag };
}

function encryptAESKey(aesKey, clientPublicKey) {
    const pemKey = `-----BEGIN PUBLIC KEY-----\n${clientPublicKey.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;
    
    const publicKeyFinal = crypto.createPublicKey({
        key: pemKey,
        format: "pem",
        type: "spki",
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

async function EncryptBody(body, sessionKey) {
    const newAesKey = generateAESKey();
    const newIv = crypto.randomBytes(12);
    const { encrypted, authTag } = encryptAESMessage(JSON.stringify(body), newAesKey, newIv);
    const clientKey = await database.collection("PublicKeys").findOne({ _id: sessionKey });
    if(!clientKey){
        return { message: "Public key not found" };
    }
    const clientPublicKey = clientKey.clientPublicKey
    const encryptedAESKeyResponse = encryptAESKey(newAesKey, clientPublicKey);

    return {
        encryptedAESKey: encryptedAESKeyResponse.toString("base64"),
        encryptedMessage: encrypted,
        iv: newIv.toString("base64"),
        authTag: authTag.toString("base64"),
    };
}


module.exports = { DecryptBody, EncryptBody };