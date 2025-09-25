# Personal Expense Tracker - Backend

A Node.js/Express backend API for managing personal expenses with Firebase Firestore integration and Redis caching.

## Features

- RESTful API for expense management
- Firebase Firestore for data persistence
- Redis caching for improved performance
- Docker support for easy deployment
- Secure API endpoints with proper error handling
- TypeScript for type safety

## Tech Stack

- Node.js with Express
- TypeScript
- Firebase Firestore
- Redis for caching
- CORS for cross-origin requests

## Getting Started

### Prerequisites

Make sure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (v10 or higher)
- [Firebase account](https://firebase.google.com/) with a Firestore database
- [Redis](https://redis.io/) (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jeryjs/Personal-Expense-Tracker.git
   cd Personal-Expense-Tracker
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Copy the example environment file and update it with your values:
   ```bash
   cp backend/.env.example backend/.env
   ```
   
   Then edit `backend/.env` with your Firebase configuration and other settings.

   **To get your Firebase config:**
   - Go to Firebase Console → Project Settings
   - Scroll down to "Your apps" section
   - Click on the web app or create one
   - Copy the `firebaseConfig` object and update your `.env` file

### Development

#### Running Directly

Start the development server:

```bash
cd backend
pnpm run dev
```

The backend server will be available at `http://localhost:3000`

#### Running with Docker

You can also run the application using Docker:

1. **Make sure you have your `backend/.env` file configured**

2. **Run with Docker Compose**
   ```bash
   docker compose up --build
   ```

This will start:
- The backend server at `http://localhost:3000`
- Redis server for caching
- All services will be networked together

## API Endpoints

The backend provides the following endpoints:

- `GET /api` - API health check
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `FIREBASE_CONFIG` | Firebase configuration JSON string | ✅ |
| `DEFAULT_USER_ID` | Default user ID for expenses | ❌ |
| `PORT` | Server port (default: 3000) | ❌ |
| `REDIS_URL` | Redis connection URL | ❌ |

## Troubleshooting

**Common issues:**

1. **Firebase connection issues**
   - Verify your `FIREBASE_CONFIG` is correctly formatted JSON
   - Ensure Firestore is enabled in your Firebase project
   - Check that your Firebase project ID matches the config

2. **pnpm command not found**
   - Install pnpm globally: `npm install -g pnpm`

3. **Port already in use**
   - Change the `PORT` in your `backend/.env` file
   - Or kill the process using the port

4. **Dependencies installation fails**
   - Clear pnpm cache: `pnpm store prune`
   - Delete node_modules and try again: `rm -rf node_modules && pnpm install`

## License

This project is licensed under the ISC License.
