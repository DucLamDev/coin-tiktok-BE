const mongoose = require('mongoose');
const CoinPackage = require('../models/CoinPackage');
require('dotenv').config();

const coinPackages = [
  {
    coinAmount: 30,
    priceVND: 9800,
    priceUSD: 0.42,
    isPopular: true,
    discountPercent: 25
  },
  {
    coinAmount: 350,
    priceVND: 113900,
    priceUSD: 4.85,
    discountPercent: 0
  },
  {
    coinAmount: 700,
    priceVND: 227700,
    priceUSD: 9.70,
    discountPercent: 0
  },
  {
    coinAmount: 1400,
    priceVND: 455300,
    priceUSD: 19.40,
    discountPercent: 0
  },
  {
    coinAmount: 3500,
    priceVND: 1138100,
    priceUSD: 48.50,
    discountPercent: 0
  },
  {
    coinAmount: 7000,
    priceVND: 2276200,
    priceUSD: 97.00,
    discountPercent: 0
  },
  {
    coinAmount: 17500,
    priceVND: 5690400,
    priceUSD: 242.50,
    discountPercent: 0
  },
  {
    coinAmount: 0,
    priceVND: 0,
    priceUSD: 0,
    isCustom: true,
    discountPercent: 0
  }
];

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing coin packages
    await CoinPackage.deleteMany({});
    console.log('Cleared existing coin packages');

    // Insert new coin packages
    await CoinPackage.insertMany(coinPackages);
    console.log('Coin packages seeded successfully');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedData();
