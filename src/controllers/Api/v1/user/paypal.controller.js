const { successResponse, errorResponse } = require('../../baseAPI.controller');
const paypal = require('@paypal/checkout-server-sdk')
const paypalClient = require("../../../../config/paypal");

const payment = async (req, res) => {
    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: 'USD',
                value: '100.00'
            }
        }]
    })

    try {
        const order = await paypalClient.execute(request);
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