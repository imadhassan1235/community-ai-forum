# Community AI Forum

A full-stack web application for community discussions with AI-powered features, built with React, Node.js, Express, and MongoDB.

## Features

### Core Functionality
- **User Authentication**: JWT-based registration and login system
- **Posts & Comments**: Create, read, update, and delete posts and comments
- **Voting System**: Upvote/downvote posts and comments with real-time score updates
- **Tagging**: Organize posts with tags and filter by popular tags
- **Search & Filter**: Find posts by title, content, tags, or author
- **User Profiles**: View user information, posts, comments, and reputation scores

### Gamification
- **Reputation System**: Users earn points based on community engagement
- **Leaderboard**: Top contributors ranked by reputation score
- **Badges**: Visual recognition for top performers
- **Point Rules**:
  - +10 points for post upvote received
  - +5 points for comment upvote received
  - +2 points for giving an upvote (encourages engagement)
  - -2 points for receiving a downvote

### AI Integration (Optional)
- **Post Summarization**: AI-generated summaries of posts and their comments
- **Draft Generation**: AI-assisted post creation from prompts
- **Configurable**: Enable/disable AI features via environment variables

### Technical Features
- **Responsive Design**: Mobile-first design with dark mode support
- **Real-time Updates**: Optimistic UI updates for voting
- **Security**: Rate limiting, input validation, CORS protection
- **Performance**: Database indexing, pagination, efficient queries
- **Testing**: Unit tests for critical backend functionality
- **Docker Support**: Full containerization with docker-compose
- **CI/CD**: GitHub Actions workflow for automated testing and deployment

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcrypt
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

### DevOps
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Web Server**: Nginx (production)
- **Process Management**: PM2 (optional)

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or cloud)
- Docker & Docker Compose (optional)

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd community-ai-forum
   \`\`\`

2. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

3. **Start the application**
   \`\`\`bash
   docker-compose up -d
   \`\`\`

4. **Seed the database (optional)**
   \`\`\`bash
   docker-compose exec backend npm run seed
   \`\`\`

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017

### Option 2: Local Development

1. **Clone and setup**
   \`\`\`bash
   git clone <repository-url>
   cd community-ai-forum
   \`\`\`

2. **Backend setup**
   \`\`\`bash
   cd backend
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   npm install
   npm run seed  # Optional: populate with sample data
   npm run dev
   \`\`\`

3. **Frontend setup** (in a new terminal)
   \`\`\`bash
   cd frontend
   cp .env.example .env
   # Edit .env with your API URL
   npm install
   npm run dev
   \`\`\`

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Environment Variables

### Backend (.env)
\`\`\`env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/community-ai-forum

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# CORS
FRONTEND_URL=http://localhost:5173

# AI Features (optional)
AI_ENABLED=false
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key

# Gamification Points
POINTS_POST_UPVOTE=10
POINTS_COMMENT_UPVOTE=5
POINTS_GIVING_UPVOTE=2
POINTS_RECEIVING_DOWNVOTE=-2
\`\`\`

### Frontend (.env)
\`\`\`env
VITE_API_URL=http://localhost:5000/api
\`\`\`

## API Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify-token` - Verify JWT token

### Posts
- `GET /api/posts` - Get posts (with pagination, search, filters)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post (auth required)
- `PUT /api/posts/:id` - Update post (auth required, owner only)
- `DELETE /api/posts/:id` - Delete post (auth required, owner only)
- `POST /api/posts/:id/vote` - Vote on post (auth required)
- `GET /api/posts/tags/popular` - Get popular tags

### Comments
- `GET /api/comments/post/:postId` - Get comments for post
- `POST /api/comments` - Create comment (auth required)
- `PUT /api/comments/:id` - Update comment (auth required, owner only)
- `DELETE /api/comments/:id` - Delete comment (auth required, owner only)
- `POST /api/comments/:id/vote` - Vote on comment (auth required)

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update profile (auth required)
- `GET /api/users/:id/posts` - Get user's posts
- `GET /api/users/:id/comments` - Get user's comments

### Leaderboard
- `GET /api/leaderboard` - Get top users by score
- `GET /api/leaderboard/stats` - Get leaderboard statistics

### AI (Optional)
- `POST /api/ai/summarize` - Generate post summary (auth required)
- `POST /api/ai/draft` - Generate post draft (auth required)

## Database Schema

### Users Collection
\`\`\`javascript
{
  username: String (unique, 3-30 chars),
  email: String (unique, valid email),
  passwordHash: String (bcrypt hashed),
  avatarUrl: String (optional),
  bio: String (max 500 chars),
  score: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

### Posts Collection
\`\`\`javascript
{
  title: String (1-200 chars),
  content: String (1-10000 chars),
  tags: [String] (max 30 chars each),
  userId: ObjectId (ref: User),
  votes: [{
    userId: ObjectId (ref: User),
    value: Number (1 or -1)
  }],
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

### Comments Collection
\`\`\`javascript
{
  postId: ObjectId (ref: Post),
  content: String (1-2000 chars),
  userId: ObjectId (ref: User),
  votes: [{
    userId: ObjectId (ref: User),
    value: Number (1 or -1)
  }],
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

## Testing

### Backend Tests
\`\`\`bash
cd backend
npm test
\`\`\`

### Frontend Linting
\`\`\`bash
cd frontend
npm run lint
\`\`\`

## Deployment

### Production with Docker
1. Set up production environment variables
2. Build and deploy with docker-compose:
   \`\`\`bash
   docker-compose -f docker-compose.prod.yml up -d
   \`\`\`

### Manual Deployment
1. Build frontend: `cd frontend && npm run build`
2. Set up reverse proxy (nginx) to serve frontend and proxy API
3. Use PM2 or similar for backend process management
4. Set up MongoDB with proper security and backups

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on GitHub or contact the development team.
