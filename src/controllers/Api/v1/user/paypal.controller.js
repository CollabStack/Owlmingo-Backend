const { successResponse, errorResponse } = require('../../baseAPI.controller');
const paypal = require('@paypal/checkout-server-sdk');
const paypalClient = require("../../../../config/paypal");
const Payment = require('../../../../models/payment.model');

// Create PayPal Order
const payment = async (req, res) => {
  console.log("=========== PAYPAL PAYMENT REQUEST ===========");
  console.log(req.body);
  console.log("==============================================");

  const { amount, planId } = req.body;
  const userId = req.user.id;

  // Step 1: Store transaction in DB
  let transaction;
  try {
    transaction = new Payment({
      userId,
      amount,
      planId,
      status: 'PENDING'
    });
    await transaction.save();
  } catch (dbError) {
    console.error("DB Error:", dbError);
    return errorResponse(res, 'Failed to store transaction information');
  }

  // Step 2: Create PayPal Order
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
    console.log("=========== PAYPAL ORDER CREATED ===========");
    console.log("Order ID:", order.result.id);
    return successResponse(res, { id: order.result.id });
  } catch (error) {
    console.error("PayPal Error:", error);
    return errorResponse(res, 'Failed to create PayPal order');
  }
};

// Capture PayPal Order
const capture = async (req, res) => {
  const request = new paypal.orders.OrdersCaptureRequest(req.body.orderID);

  try {
    const capture = await paypalClient.execute(request);
    console.log("=========== PAYPAL CAPTURE ===========");
    console.log(capture);
    return successResponse(res, capture);
  } catch (error) {
    console.error("Capture Error:", error);
    return errorResponse(res, 'Failed to capture PayPal order');
  }
};

module.exports = {
  payment,
  capture
};
