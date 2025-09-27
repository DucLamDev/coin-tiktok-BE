const mongoose = require('mongoose');

const coinPackageSchema = new mongoose.Schema({
  coinAmount: {
    type: Number,
    required: true,
    unique: true
  },
  priceVND: {
    type: Number,
    required: true
  },
  priceUSD: {
    type: Number,
    required: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CoinPackage', coinPackageSchema);
