const express = require('express');
const { body, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const CoinPackage = require('../models/CoinPackage');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/coins/packages
// @desc    Get all coin packages
// @access  Public
router.get('/packages', async (req, res) => {
  try {
    const packages = await CoinPackage.find({ isActive: true }).sort({ coinAmount: 1 });
    
    res.json({
      success: true,
      packages
    });
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/coins/recharge
// @desc    Create a coin recharge transaction
// @access  Private
router.post('/recharge', [
  auth,
  body('targetTiktokId')
    .notEmpty()
    .withMessage('Target TikTok ID is required'),
  body('coinAmount')
    .isInt({ min: 1 })
    .withMessage('Coin amount must be a positive integer'),
  body('paymentMethod')
    .isIn(['MoMo', 'ZaloPay', 'Credit Card', 'Debit Card'])
    .withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { targetTiktokId, coinAmount, paymentMethod, specialOffer } = req.body;

    // Find coin package or calculate custom price
    let coinPackage = await CoinPackage.findOne({ coinAmount });
    let priceAmount;
    let discountPercent = 0;

    if (coinPackage) {
      priceAmount = coinPackage.priceVND;
      discountPercent = coinPackage.discountPercent;
    } else {
      // Custom amount calculation (base rate: 1000 VND per coin)
      priceAmount = coinAmount * 1000;
    }

    // Apply special offer discount
    if (specialOffer === '5% cash back on your next order') {
      discountPercent = Math.max(discountPercent, 5);
    }

    // Calculate final price with discount
    const finalPrice = priceAmount * (1 - discountPercent / 100);

    // Generate unique transaction ID
    const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substring(2, 11).toUpperCase();

    // Create transaction
    const transaction = new Transaction({
      userId: req.user._id,
      targetTiktokId,
      coinAmount,
      priceAmount: finalPrice,
      paymentMethod,
      specialOffer: specialOffer || '',
      discountPercent,
      transactionId
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction: {
        id: transaction._id,
        transactionId: transaction.transactionId,
        coinAmount: transaction.coinAmount,
        priceAmount: transaction.priceAmount,
        paymentMethod: transaction.paymentMethod,
        status: transaction.status,
        createdAt: transaction.createdAt
      }
    });
  } catch (error) {
    console.error('Recharge error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during recharge'
    });
  }
});

// @route   POST /api/coins/checkout/:transactionId
// @desc    Process payment for a transaction
// @access  Private
router.post('/checkout/:transactionId', auth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { paymentReference } = req.body;

    const transaction = await Transaction.findOne({
      transactionId,
      userId: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Transaction already processed'
      });
    }

    // Simulate payment processing
    transaction.status = 'processing';
    transaction.paymentReference = paymentReference || `PAY_${Date.now()}`;
    await transaction.save();

    // Simulate payment success (in real app, integrate with payment gateway)
    setTimeout(async () => {
      try {
        transaction.status = 'completed';
        await transaction.save();

        // Update target user's coin balance if they exist
        const targetUser = await User.findOne({ tiktokId: transaction.targetTiktokId });
        if (targetUser) {
          targetUser.coinBalance += transaction.coinAmount;
          await targetUser.save();
        }
      } catch (error) {
        console.error('Payment completion error:', error);
      }
    }, 2000);

    res.json({
      success: true,
      message: 'Payment processing started',
      transaction: {
        id: transaction._id,
        transactionId: transaction.transactionId,
        status: transaction.status,
        paymentReference: transaction.paymentReference
      }
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during checkout'
    });
  }
});

// @route   GET /api/coins/transaction/:transactionId
// @desc    Get transaction status
// @access  Private
router.get('/transaction/:transactionId', auth, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findOne({
      transactionId,
      userId: req.user._id
    }).populate('userId', 'username tiktokId');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/coins/transactions
// @desc    Get user's transaction history
// @access  Private
router.get('/transactions', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
