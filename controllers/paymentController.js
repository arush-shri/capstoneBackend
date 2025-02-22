const Razorpay = require('razorpay');
const crypto = require('crypto');

async function InitializePayment(db, body) {
    var razorpay = new Razorpay({ key_id: process.env.RAZOR_KEY_ID, key_secret: process.env.RAZOR_KEY_SEC })
    const amount = body.amount;
    const payCollection = db.collection("Plans");
    const plan = await payCollection.findOne({ _id: amount });

    if(plan){
        const uuid = crypto.randomBytes(16).toString('hex');
        var options = {
            amount: amount*100,
            currency: "INR",
            receipt: uuid
        };

        const order = await razorpay.orders.create(options);

        return { orderId: order.id, amount: order.amount, currency: order.currency }
    }
    else{
        return {message: "Invalid amount"}
    }
}

async function VerifyPayment(db, body) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userid, amount } = body;
    const timestamp = new Date().toUTCString();

    const hmac = crypto.createHmac('sha256', process.env.RAZOR_KEY_SEC);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const calculatedSignature = hmac.digest('hex');

    if (calculatedSignature === razorpay_signature) {
        const planCollection = db.collection("Plans");
        const userCollection = db.collection("Users");
        const payCollection = db.collection("Payments");

        const plan = await planCollection.findOne({ _id: amount });
        const token = plan.tokens;

        const dataToStore = {
            dateTime: timestamp,
            user: userid,
            amount: amount,
            _id: razorpay_order_id,
            payId: razorpay_payment_id,
        };

        await userCollection.findOneAndUpdate(
            { _id: userid },
            { $inc: { tokens: token } },
            { returnDocument: 'after' }
        );
        await payCollection.insertOne(dataToStore);

        return { success: true, message: "Payment verified successfully." };
    } else {
        return { success: false, message: "Payment verification failed." };
    }
}

module.exports = { InitializePayment, VerifyPayment };