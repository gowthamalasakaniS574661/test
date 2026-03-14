const config = require('./index');

const stripe = require('stripe')(config.stripe.secretKey);

module.exports = stripe;
