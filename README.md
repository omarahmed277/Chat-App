# Chat-App

A real-time chat and login application built with Node.js, Express, Socket.io, and MongoDB. This project supports user authentication via local signup/login, Google, and LinkedIn, along with real-time messaging and friend connection features.

## Features
- **User Authentication**: 
  - Local signup and login with password hashing.
  - OAuth2 integration with Google and LinkedIn.
  - Profile completion for social login users.
- **Real-Time Messaging**: 
  - Send, receive, and delete messages using Socket.io.
  - Support for replying to messages.
  - Typing indicators.
- **Friend System**: 
  - Send and accept connection requests.
  - Search users by name.
  - Remove friends.
- **RESTful API**: 
  - User management (update, delete, get users).
  - Protected routes with JWT authentication.

## Tech Stack
- **Backend**: Node.js v22.13.1, Express.js
- **Real-Time**: Socket.io
- **Database**: MongoDB with Mongoose
- **Authentication**: Passport.js, JWT, bcrypt
- **Validation**: Joi
- **Environment**: dotenv

## Prerequisites
- Node.js (v22.13.1 or compatible)
- MongoDB (local or cloud instance like MongoDB Atlas)
- Git
- A GitHub account (for deployment)

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/Chat-App.git
   cd Chat-App