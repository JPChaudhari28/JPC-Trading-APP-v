JPC Trading App (Demo)

Full-stack demo trading app with React (client), Node/Express (server), MongoDB, JWT auth, wallet, and simulated Zerodha integration.

Prerequisites

- Node.js 18+
- MongoDB running locally (default port 27017)

Setup

1. Install dependencies

```
cd server && npm install
cd ../client && npm install
```

2. Configure environment

- Server env (create `server/.env`):

```
PORT=4000
CLIENT_ORIGIN=http://localhost:3000
MONGO_URI=mongodb://127.0.0.1:27017/jpc_trading
JWT_SECRET=change_me
KITE_API_KEY=your_kite_api_key
```

- Client env (create `client/.env`):

```
VITE_API_URL=http://localhost:4000
```

3. Run apps

- Server:

```
cd server
npm run dev
```

- Client:

```
cd client
npm run dev
```

Open client at http://localhost:3000

Notes

- Zerodha integration is simulated. For production, implement proper Kite Connect login, tokens, 2FA, instrument mapping, and order flows.
- Wallet add-funds is simulated. Integrate a payment gateway (Razorpay/UPI/NetBanking) for real payments.
