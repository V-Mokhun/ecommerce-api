const express = require("express");
const compression = require("compression");
const cors = require("cors");

const app = express();

const env = require("dotenv").config({ path: "./.env" });

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const RateLimit = require("express-rate-limit");
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
});

app.use(compression());
app.use(limiter);
app.use(express.static("public"));
app.use(express.json());
app.use(
  cors({
    origin: process.env.SITE_URL,
  })
);

const calculateOrderAmount = (items, shippingPrice) => {
  const total =
    items.reduce((acc, item) => acc + item.price * item.quantity, 0) +
    shippingPrice;
  return total * 100;
};

app.post("/create-payment-intent", async (req, res) => {
  const { items, shippingPrice } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items, shippingPrice),
    currency: "usd",
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

app.listen(4242, () => console.log("Node server listening on port 4242!"));
