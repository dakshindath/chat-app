# Chat App

This is a full-stack real-time chat application built with **React**, **Node.js**, **Express**, **Socket.IO**, and **MongoDB**. The app supports user authentication, real-time messaging, file uploads, and online/offline user status.

## Features

- **User Authentication**: Register and login functionality with password hashing.
- **Real-Time Messaging**: Send and receive messages instantly using Socket.IO.
- **File Attachments**: Upload and share images, videos, and documents.
- **Online Status**: View online/offline status of users.
- **Responsive Design**: Optimized for both desktop and mobile devices.
- **Recent Chats**: Quickly access recent conversations.
- **Chunked File Uploads**: Efficiently handle large file uploads.

## Tech Stack

### Frontend
- **React** with TypeScript
- **React Router** for navigation
- **Material-UI** for icons and styling
- **Axios** for API requests

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Socket.IO** for real-time communication
- **Multer** and **Sharp** for file uploads and image optimization
- **JWT** for authentication

## Project Structure

chat-app/
├── backend/
│   ├── controllers/       # API controllers
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── config/            # Database configuration
│   ├── uploads/           # Uploaded files
│   ├── .env               # Environment variables
│   └── server.js          # Main server file
├── frontend/
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # Context API for state management
│   │   ├── App.tsx        # Main app component
│   │   └── index.tsx      # Entry point
│   ├── .env               # Environment variables
│   └── package.json       # Frontend dependencies
```

## Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (local or cloud instance)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/chat-app.git
   cd chat-app
   ```

2. Install dependencies for both frontend and backend:
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

3. Set up environment variables:
   - **Backend**: Create a `.env` file in the `backend` directory:
     ```env
     PORT=5000
     MONGO_URI=mongodb://localhost:27017/chatapp
     JWT_SECRET=your_jwt_secret
     ```
   - **Frontend**: Create a .env file in the frontend directory:
     ```env
     REACT_APP_API_URL=http://localhost:5000
     ```

4. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

5. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

6. Open the app in your browser:
   ```
   http://localhost:3000
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Login a user.
- `POST /api/auth/logout`: Logout a user.
- `GET /api/auth/users`: Fetch all users.

### Messaging
- `GET /api/messages`: Fetch messages between two users.

### File Uploads
- `POST /api/files/upload`: Upload a file.
- `POST /api/files/upload-chunked`: Upload a file in chunks.
- `POST /api/files/stream-upload`: Stream a large file.

## Socket.IO Events

- **join**: Join a user to the chat.
- **send-message**: Send a message to another user.
- **receive-message**: Receive a message in real-time.
- **users-updated**: Get the updated list of online users.


## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [Socket.IO](https://socket.io/)
- [MongoDB](https://www.mongodb.com/)
- [Material-UI](https://mui.com/)
