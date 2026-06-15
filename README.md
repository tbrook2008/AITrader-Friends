# AITrader-Friends

AITrader-Friends is the Execution Node for the friends platform of AI Trader. It listens for webhooks from the master AI Trader and mirrors the executed trades to multiple user accounts using the Alpaca API.

## Features
- Listens for trade signals at `/api/internal/signal`.
- Distributes and scales trades according to the configured buying power (currently fixed at 5% per trade).
- Uses a local SQLite database to securely store user credentials using bcrypt for passwords and JWT for session tokens.

## Setup and Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configuration (.env)
Create a `.env` file in the root directory and specify the following variables:
```env
JWT_SECRET=your_jwt_secret_here
PORT=4000 # Optional, defaults to 4000
```
*(If `JWT_SECRET` is not provided, it falls back to `super_secret_dev_key` for development purposes).*

### 3. Database
The application uses SQLite to manage user data (credentials, Alpaca keys). 
- Passwords are encrypted via `bcrypt`.
- The database file is stored in `data/friends.sqlite`.
It will be initialized automatically when the server starts.

### 4. Running the Server
Start the server by running:
```bash
node server/index.js
```

The execution node will listen on the specified port (default: 4000) for incoming webhooks from the Master AI Trader bot.
