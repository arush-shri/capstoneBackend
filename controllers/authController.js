import bcrypt from 'bcryptjs';
import Mailjet from 'node-mailjet';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const mailjet = Mailjet.apiConnect(process.env.MAILJETAPIKEY, process.env.MAILJETSECRETKEY);

async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(inputPassword, storedHash) {
    return await bcrypt.compare(inputPassword, storedHash);
}

function generateMfaCode() {
    return crypto.randomBytes(32).toString('hex');
}

async function sendMfaToken(email, mfaToken, name) {
    try {
        const request = mailjet
            .post("send", { version: 'v3.1' })
            .request({
                Messages: [
                    {
                      From: {
                        Email: "codereviewer.team@gmail.com",
                        Name: "Code Reviewer",
                      },
                      To: [
                        {
                          Email: email,
                        },
                      ],
                      Subject: "Code Reviewer MFA Token",
                      TextPart: `
                        Hello ${name},
                  
                        Your MFA token is: 
                        
                        ${mfaToken}
                  
                        It is valid for 30 seconds. Please use this token within that time frame to proceed with the authentication process.
                  
                        If you did not request this, please ignore this message.
                  
                        Best regards,
                        Code Reviewer
                      `,
                      HTMLPart: `
                        <html>
                          <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
                          <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333;">
                            <div style="background-color: #ffffff; padding: 20px; max-width: 600px; margin: 0 auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                              <h2 style="color: #4CAF50;">Your MFA Token</h2>
                              <p style="font-size: 16px;">Hello ${name},</p>
                              <p style="font-size: 16px;">Your MFA token is: </p><br><br> 
                              <input type="text" value="${mfaToken}" id="mfaTokenInput" readonly 
                                style="width: 100%; padding: 10px; font-size: 18px; text-align: center; border: 1px solid #ccc; border-radius: 5px; margin-bottom: 10px;">
                                
                              <button onclick="document.getElementById('mfaTokenInput').select(); document.execCommand('copy');"
                                style="background-color: #4CAF50; color: white; padding: 10px 20px; font-size: 16px; border: none; border-radius: 5px; cursor: pointer;">
                                Copy Token
                              </button>
                              <p style="font-size: 16px;">It is valid for 30 seconds. Please use this token within that time frame to proceed with the authentication process.</p>
                              <p style="font-size: 16px;">If you did not request this, please ignore this message.</p>
                              <br>
                              <p style="font-size: 16px;">Best regards,</p>
                              <p style="font-size: 16px; font-weight: bold;">Team Code Reviewer</p>
                            </div>
                          </body>
                        </html>
                      `,
                    },
                ]
            });

        await request;
        console.log("MFA token sent successfully!");
    } catch (error) {
        console.error("Error sending MFA token:", error);
    }
}

export const SingUpUser = async(db, body) => {
    const email = body.email;
    const password = await hashPassword(body.password);
    const name = body.name;
    const userCollection = db.collection("Users");
    const user = await userCollection.findOne({ _id: email });

    if(user){
        return {message: "User Exists"}
    }
    else{
        var data = {
            _id: email,
            password,
            tokens: 1,
            name
        };

        await userCollection.insertOne(data)
        
        ResendMFACode(db, body);

        return { message: 'Success' }
    }
}

export const SignInUser = async(db, body) => {
    const email = body.email;
    const password = await hashPassword(body.password);
    const userCollection = db.collection("Users");
    const user = await userCollection.findOne({ _id: email });

    if (!user) {
        return { message: "User not found" };
    } else {
        if (await verifyPassword(password, user.password)) {
            return { message: "Incorrect password" };
        }

        ResendMFACode(db, user);

        return { message: 'Success', user };
    }
}

export const ValidateMfaCode = async(db, body) => {
    // Fetch the stored MFA code and expiration time from the database
    const email = body.email
    const enteredCode = body.enteredCode
    const mfaRecord = await db.collection("MfaCodes").findOne({ _id: email });

    if (!mfaRecord) {
        return { message: "MFA code not found" };
    }

    if (Date.now() > mfaRecord.expirationTime) {
        return { message: "MFA code expired" };
    }

    if (enteredCode !== mfaRecord.mfaCode) {
        return { message: "Invalid MFA code" };
    }

    return { message: "MFA code validated successfully" };
}

export const ResendMFACode = async(db, body) => {
    const email = body.email;
    const name = body.name;
    const mfaCode = generateMfaCode();
    const expirationTime = Date.now() + 30 * 1000;
    await db.collection("MfaCodes").updateOne(
        { _id: email },
        { $set: { mfaCode, expirationTime } },
        { upsert: true }
    );

    await sendMfaToken(email, mfaCode, name);
}