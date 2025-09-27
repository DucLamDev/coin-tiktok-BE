# TikTok Coin Recharge Backend API

Backend API for TikTok coin recharge system built with Node.js and Express.js.

## Features

- User authentication (register/login)
- Coin package management
- Transaction processing
- Payment integration simulation
- User profile management
- Transaction history

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tiktok_coin_db
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
NODE_ENV=development
```

3. Start MongoDB service on your machine

4. Seed initial data:
```bash
node scripts/seedData.js
```

5. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Coins
- `GET /api/coins/packages` - Get all coin packages
- `POST /api/coins/recharge` - Create recharge transaction
- `POST /api/coins/checkout/:transactionId` - Process payment
- `GET /api/coins/transaction/:transactionId` - Get transaction status
- `GET /api/coins/transactions` - Get user transaction history

### Users
- `GET /api/users/search/:tiktokId` - Search user by TikTok ID
- `PUT /api/users/profile` - Update user profile

## Database Models

- **User**: User accounts with authentication
- **Transaction**: Coin recharge transactions
- **CoinPackage**: Available coin packages with pricing

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Input validation
- Rate limiting
- CORS protection
- Helmet security headers
