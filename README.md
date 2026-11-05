Finora — Personal Finance Management System

Finora is a full-stack personal finance management application designed to help users manage their finances, track transactions, monitor savings goals, and analyze their financial habits.

Features

- User Authentication (Signup/Login)
- Dashboard with financial summaries
- Transaction Management
- Savings Goals Tracking
- Habit Tracking
- Financial Analytics
- Wealth Portfolio Management
- Assets and Liabilities Tracking
- Net Worth Calculation
- Feedback System
- Admin Dashboard
- Responsive UI for Desktop, Tablet, and Mobile

Tech Stack

Frontend

- React
- Vite
- React Router
- Axios
- Recharts
- Lucide React

Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcryptjs
- Helmet
- Express Rate Limit

Project Structure

Finora/
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── server.js
│   └── package.json
│
└── README.md

Installation

1. Clone the Repository

git clone <your-github-repository-url>
cd Finora

2. Setup Frontend

cd client
npm install
npm run dev

3. Setup Backend

Open a separate terminal:

cd server
npm install
npm run dev

Environment Variables

Create a ".env" file inside the "server" directory.

PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret

Never commit your actual ".env" file or credentials.

Application

Frontend: http://localhost:5173

Backend: http://localhost:5000

License

This project is developed for educational and internship purposes.