const paypal = require('@paypal/checkout-server-sdk')
const {paypalClientID, paypalSecret} = require('./app.config')
const environment = new paypal.core.SandboxEnvironment(
    paypalClientID, 
    paypalSecret
)
const client = new paypal.core.PayPalHttpClient(environment)

module.exports = client
