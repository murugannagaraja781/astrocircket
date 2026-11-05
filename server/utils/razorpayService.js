const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay client if credentials exist
const getKeyId = () => process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const getKeySecret = () => process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';

const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: getKeyId(),
        key_secret: getKeySecret()
    });
};

/**
 * Create a new Razorpay order
 * @param {number} amountInINR - Amount in INR (e.g. 49, 500)
 * @param {string} receiptId - Unique transaction reference
 * @param {object} notes - Key-value metadata (matchId, userId, etc.)
 */
const createOrder = async (amountInINR, receiptId, notes = {}) => {
    try {
        const instance = getRazorpayInstance();
        const amountInPaise = Math.round(Number(amountInINR) * 100);

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: receiptId,
            notes: notes
        };

        const order = await instance.orders.create(options);
        return {
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: getKeyId(),
            order
        };
    } catch (error) {
        console.error('[RazorpayService] createOrder Error:', error);
        return {
            success: false,
            error: error.message || 'Razorpay Order Creation Failed'
        };
    }
};

/**
 * Verify Razorpay Payment Signature
 * formula: hmac_sha256(order_id + "|" + payment_id, secret) == signature
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
    try {
        const secret = getKeySecret();
        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        return generatedSignature === signature;
    } catch (err) {
        console.error('[RazorpayService] Signature verification failed:', err);
        return false;
    }
};

/**
 * Verify Razorpay Webhook Signature
 * formula: hmac_sha256(rawBody, webhookSecret) == signature
 */
const verifyWebhookSignature = (rawBody, signature, customSecret = null) => {
    try {
        const secret = customSecret || process.env.RAZORPAY_WEBHOOK_SECRET || getKeySecret();
        if (!signature) {
            console.warn('[RazorpayService] No webhook signature provided in header');
            return false;
        }

        const bodyData = Buffer.isBuffer(rawBody)
            ? rawBody
            : (typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody));

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(bodyData)
            .digest('hex');

        return expectedSignature === signature;
    } catch (err) {
        console.error('[RazorpayService] Webhook signature verification error:', err.message);
        return false;
    }
};

module.exports = {
    createOrder,
    verifyPaymentSignature,
    verifyWebhookSignature,
    getKeyId
};
