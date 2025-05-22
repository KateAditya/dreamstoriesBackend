const Razorpay = require("razorpay");
const axios = require("axios");
const _ = require("lodash");
const retry = require("async-retry");
const db = require("../db");

const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});

let cachedProductLinks = {};

const refreshProductLinks = () => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT title, download_link FROM product_links",
      (err, results) => {
        if (err) return reject(err);

        const productLinks = {};
        results.forEach((item) => {
          productLinks[item.title] = item.download_link;
        });

        cachedProductLinks = productLinks;
        resolve(productLinks);
      }
    );
  });
};

// Initial Load
refreshProductLinks().catch(console.error);
// Refresh Every 15 Minutes
setInterval(() => {
  refreshProductLinks().catch(console.error);
}, 15 * 60 * 1000);

// Render Product Page (if needed)
const renderProductPage = (req, res) => {
  res.send("Welcome to Razorpay Payment Page!"); // Replace with res.render if using EJS
};

// Create Order Function
const createOrder = async (req, res) => {
  try {
    const amount = parseInt(req.body.amount, 10);
    const productName = req.body.name;

    if (isNaN(amount) || amount <= 0 || !productName) {
      return res.status(400).json({ success: false, msg: "Invalid input!" });
    }

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `order_rcptid_${Date.now()}`,
    };

    const order = await retry(
      async () => {
        const response = await axios.post(
          "https://api.razorpay.com/v1/orders",
          options,
          {
            auth: {
              username: RAZORPAY_ID_KEY,
              password: RAZORPAY_SECRET_KEY,
            },
          }
        );
        return response.data;
      },
      {
        retries: 3,
        factor: 2,
      }
    );

    // Get product link
    if (Object.keys(cachedProductLinks).length === 0) {
      await refreshProductLinks();
    }

    const productLink =
      cachedProductLinks[productName] ||
      "https://example.com/product-not-found";

    res.status(200).json({
      success: true,
      msg: "Order Created",
      order_id: order.id,
      amount: amount * 100,
      key_id: RAZORPAY_ID_KEY,
      product_name: productName,
      description: req.body.description || "No description provided.",
      contact: "1234567890",
      name: "DreamStories",
      email: "dreamstories@gmail.com",
      product_link: productLink,
    });
  } catch (error) {
    console.error("Error creating order:", error.message);
    res.status(500).json({ success: false, msg: "Order creation failed!" });
  }
};

module.exports = {
  renderProductPage,
  createOrder,
};
