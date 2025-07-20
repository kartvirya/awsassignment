# Youth Empowerment Hub

A comprehensive platform for youth counseling and support services, built with React, TypeScript, Express.js, and PostgreSQL.

## Features

- **Multi-role Authentication**: Support for Students, Counsellors, and Administrators
- **Dashboard System**: Role-specific dashboards with relevant metrics and actions
- **Session Management**: Book and manage counseling sessions
- **Resource Library**: Educational resources and materials
- **Messaging System**: Secure communication between users
- **Progress Tracking**: Monitor student progress and engagement
- **Analytics**: Comprehensive reporting and insights

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Radix UI
- **Backend**: Express.js, TypeScript, Drizzle ORM
- **Database**: PostgreSQL
- **Authentication**: JWT-based session management
- **State Management**: React Query for server state

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/collegesafe

# Optional: SSL Configuration
DATABASE_CA_CERT=your_ca_certificate_here

# Server
PORT=3001
NODE_ENV=production
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd collegesafe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Create the database
   createdb collegesafe
   
   # Run database migrations
   npm run db:push
   ```

4. **Build the application**
   ```bash
   npm run build
   ```

5. **Start the server**
   ```bash
   npm start
   ```

## Development

For development, you can use:

```bash
npm run dev
```

This will start the development server with hot reloading.

## Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set environment variables**
   - Ensure `DATABASE_URL` is set to your production database
   - Set `NODE_ENV=production`
   - Configure `PORT` if needed

3. **Start the production server**
   ```bash
   npm start
   ```

## Database Schema

The application uses the following main tables:

- `users` - User accounts with role-based access
- `sessions` - Counseling session bookings
- `resources` - Educational materials and resources
- `messages` - User communications
- `user_progress` - Student progress tracking

## Security Considerations

- **Password Hashing**: Implement proper password hashing (bcrypt recommended)
- **HTTPS**: Use HTTPS in production
- **Environment Variables**: Never commit sensitive data
- **Database Security**: Use connection pooling and proper access controls
- **Session Management**: Implement proper session expiration and cleanup

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/signup` - User registration
- `POST /api/logout` - User logout
- `GET /api/auth/user` - Get current user

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/role/:role` - Get users by role
- `PATCH /api/users/:id/role` - Update user role (admin only)

### Sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions` - Get sessions
- `PATCH /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session

### Resources
- `POST /api/resources` - Create resource
- `GET /api/resources` - Get resources
- `PATCH /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages` - Get messages
- `PATCH /api/messages/:id/read` - Mark message as read

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 