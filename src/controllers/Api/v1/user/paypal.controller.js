const { successResponse, errorResponse } = require('../../baseAPI.controller');
const paypal = require('@paypal/checkout-server-sdk');
const paypalClient = require("../../../../config/paypal");
const Payment = require('../../../../models/payment.model');

// Create PayPal Order
const payment = async (req, res) => {
  const { amount, planId, duration} = req.body;
  const userId = req.user.id;
  const onDate = Date.now() + duration * 24 * 60 * 60 * 1000; // expiration timestamp based on duration (days)

  // Step 1: Store transaction in DB 
  let transaction;
  try {
    transaction = new Payment({
      userId,
      amount,
      planId,
      expiration: onDate, 
      status: 'PENDING'
    });
    await transaction.save();
  } catch (dbError) {
    console.error("DB Error:", dbError);
    // return errorResponse(res, 'Failed to store transaction information');
    res.status(500).send(err)
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

    res.json({ id: order.result.id })


  } catch (error) {
    console.error("PayPal Error:", error);
    res.status(500).send(err)
  }
};

// Capture PayPal Order
const capture = async (req, res) => {
    const request = new paypal.orders.OrdersCaptureRequest(req.body.orderID);

    try {
        const captureResponse = await paypalClient.execute(request);

        // Find payment by paypalOrderId and userId
        let payment = await Payment.findOne({
            paypalOrderId: req.body.orderID,
            userId: req.user.id
        });
        
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Update payment status to COMPLETED
        payment.status = 'COMPLETED';
        await payment.save();
        
        res.json(captureResponse.result);

    } catch (error) {
        console.error("Capture Error:", error);
        res.status(500).send(error);
    }
};

module.exports = {
  payment,
  capture
};
