const { successResponse, errorResponse } = require('../../baseAPI.controller');
const paypal = require('@paypal/checkout-server-sdk');
const paypalClient = require("../../../../config/paypal");
const Payment = require('../../../../models/payment.model');

// PayPal payment creation
const payment = async (req, res) => {
    console.log("==================PAYPAL PAYMENT===================");
    console.log(req.body);
    console.log("===================================================");

    const { amount, planId, price } = req.body;
    const userId = req.user.id;
    console.log("Amount: ", amount);
    console.log("Plan ID: ", planId);
    console.log("User ID: ", userId);
    console.log("===================================================");

    // Step 1: Store transaction in DB with status 'PENDING'
    let transaction;
    try {
        transaction = new Payment({
            userId,
            amount,
            planId,
            status: 'PENDING'
            // paypalOrderId will be added after PayPal order is created
        });

        await transaction.save();
    } catch (dbError) {
        console.error("DB Error:", dbError);
        return errorResponse(res, 'Failed to store transaction information');
    }

    // Step 2: Create PayPal order
    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: 'USD',
                value: amount
            }
        }]
    });

    try {
        const order = await paypalClient.execute(request);
        transaction.paypalOrderId = order.result.id;
        await transaction.save();
        res.json({ id: order.result.id })

        // successResponse(res, order);
    } catch (error) {
        console.error("PayPal Error:", error);
        // errorResponse(res, error.message);
        res.status(500).send(err)

    }
};

// PayPal capture after user approves
const capture = async (req, res) => {
    const request = new paypal.orders.OrdersCaptureRequest(req.body.orderID);

    try {
        const capture = await paypalClient.execute(request);
        successResponse(res, capture);
    } catch (error) {
        console.error("Capture Error:", error);
        errorResponse(res, error.message);
    }
};

module.exports = {
    payment,
    capture
};
