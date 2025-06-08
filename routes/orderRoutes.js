const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// ✅ GET: View Past Orders
router.get('/user/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).populate('products.productId');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve orders' });
  }
});

// ✅ POST: Place New Order
router.post('/create', async (req, res) => {
  const { userId, items } = req.body;

  try {
    let total = 0;
    const orderProducts = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.productId}` });

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      // Deduct stock
      product.stock -= item.quantity;
      await product.save();

      total += product.price * item.quantity;
      orderProducts.push({ productId: product._id, quantity: item.quantity });
    }

    const order = new Order({
      userId,
      products: orderProducts,
      total
    });

    await order.save();
    res.status(201).json({ message: 'Order placed successfully', order });

  } catch (err) {
    res.status(500).json({ message: 'Order creation failed', error: err.message });
  }
});

module.exports = router;
