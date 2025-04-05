const { successResponse, errorResponse } = require('../../baseAPI.controller');
const paypal = require('@paypal/checkout-server-sdk');
const paypalClient = require("../../../../config/paypal");
const Payment = require('../../../../models/payment.model');

const checkSubscription = async (req, res) => {
  const userId = req.user.id;
  const planId = req.body.planId;
  const currentDate = new Date();
  console.log("================== ======================");
  console.log("userId", userId);
  console.log("planId", planId);
  console.log("currentDate", currentDate);

  try {
    const payment = await Payment.findOne({
      userId,
      planId,
      expiration: { $gt: currentDate } // Check if the subscription is still valid
    });
    console.log("Payment", payment);
    console.log("================== ======================");

    if (payment) {
      // return res.status(200).json({ message: 'Subscription is active' });
      return successResponse(res, null, 'Subscription is active', 201);
    } else {
      // return res.status(404).json({ message: 'No active subscription found' });
      return successResponse(res, null,'No active subscription found');
    }
  } catch (error) {
    console.error("DB Error:", error);
    // return res.status(500).json({ message: 'Internal server error' });
    return errorResponse(res, 'Internal server error')
  }

}

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
  capture,
  checkSubscription
};
