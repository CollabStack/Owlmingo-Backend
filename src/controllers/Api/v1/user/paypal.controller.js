const { successResponse, errorResponse } = require('../../baseAPI.controller');
const paypal = require('@paypal/checkout-server-sdk')
const paypalClient = require("../../../../config/paypal");

const payment = async (req, res) => {
    const { amount, userId, planId, price } = req.body;
    
    // Store transaction details in the database with status 'PENDING'
    let transaction;
    try {
        // Assuming you have a Transaction model imported from your models folder
        transaction = await Payment.create({
            userId,
            amount,
            planId,
            price,
            status: 'PENDING'
        });
    } catch (dbError) {
        return errorResponse(res, 'Failed to store transaction information');
    }
    
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
        // Optionally update the stored transaction with PayPal order id
        transaction.paypalOrderId = order.result.id;
        await transaction.save();
        successResponse(res, order);
    } catch (error) {
        errorResponse(res, error.message);
    }
};

const  capture = async (req, res) => {
    const request = new paypal.orders.OrdersCaptureRequest(req.body.orderID);

    try {
        const capture = await paypalClient.execute(request);
        successResponse(res, capture);
    } catch (error) {
        errorResponse(res, error.message);
    }
};


module.exports = {
    payment,
    capture
};