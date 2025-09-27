const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetTiktokId: {
    type: String,
    required: true,
    trim: true
  },
  coinAmount: {
    type: Number,
    required: true,
    min: 1
  },
  priceAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'VND',
    enum: ['VND', 'USD']
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['MoMo', 'ZaloPay', 'Credit Card', 'Debit Card']
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled']
  },
  transactionId: {
    type: String,
    unique: true,
    required: false  // Changed to false to avoid validation error
  },
  paymentReference: {
    type: String,
    default: ''
  },
  specialOffer: {
    type: String,
    default: ''
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Generate unique transaction ID
transactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = 'TXN' + Date.now() + Math.random().toString(36).substring(2, 11).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
