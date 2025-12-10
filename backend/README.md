# Gamified Learning Platform Backend

A comprehensive FastAPI backend for a gamified homebuying education platform, featuring user authentication, onboarding flow, learning modules, quizzes, rewards system, and more.

## Features

### Core Functionality
- **User Authentication**: JWT-based authentication with registration, login, password reset
- **Onboarding Flow**: Step-by-step user onboarding with avatar selection, timeline, preferences
- **Learning System**: Structured modules and lessons with video progress tracking
- **Quiz System**: Interactive quizzes with scoring, coin rewards, and badge awarding
- **Gamification**: Comprehensive coin and badge system to motivate learners
- **Rewards System**: Coupon redemption using earned coins with partner offers
- **Materials & Resources**: Financial calculators and downloadable checklists
- **Help & Support**: FAQ system and support ticket management
- **Notifications**: Real-time notification system for user achievements

### Technical Features
- **FastAPI**: Modern, fast, and type-annotated API framework
- **SQLAlchemy**: Robust ORM with PostgreSQL database
- **Alembic**: Database migration management
- **JWT Authentication**: Secure token-based authentication
- **Docker Support**: Containerized deployment
- **API Documentation**: Auto-generated OpenAPI/Swagger documentation

## Database Schema

### Core Models
- **Users**: User accounts with authentication and profile information
- **UserOnboarding**: Onboarding preferences (avatar, timeline, learning style, etc.)
- **Modules/Lessons**: Learning content structure with video support
- **Quizzes**: Questions, answers, and user attempts with scoring
- **Badges**: Achievement system with different rarity levels
- **Coins**: Transaction system for earning and spending virtual currency
- **Rewards**: Partner coupons and redemption tracking
- **Materials**: Calculators, checklists, and downloadable resources
- **Support**: FAQ system and help ticket management
- **Notifications**: User notification center

## Installation & Setup

### Prerequisites
- Python 3.9+
- PostgreSQL 12+
- Docker & Docker Compose (optional)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nest-backend
   ```

2. **Install dependencies**
   ```bash
   pip install -r app/requirements.txt
   ```

3. **Environment Configuration**
   Update the `.env` file in the project root:

4. **Database Setup**
   ```bash
   # Run migrations
   cd app
   python -m alembic upgrade head
   ```

5. **Start the application**
   ```bash
   cd app
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```

### Docker Setup

1. **Build and start services**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

2. **Run migrations**
   ```bash
   docker-compose run --rm backend ./migrate.sh
   ```

3. **Access the application**
   - API: http://localhost:8000
   - Documentation: http://localhost:8000/docs

4. **Check the tables in the database**
   ```bash
   docker-compose exec db psql -U admin -d homebuyer_db
   ```

5. **Docker Logs**
   ```bash
   # View current backend logs
   docker-compose logs backend

   # View logs with timestamps
   docker-compose logs -t backend

   # View current database logs
   docker-compose logs db

   # Follow database logs in real-time
   docker-compose logs -f db

   # Follow all logs in real-time
   docker-compose logs -f
   
   # Combine multiple options
   docker-compose logs -f --tail=20 --timestamps backend

   # Search for errors in backend logs
   docker-compose logs backend | grep -i error

   # Search for errors in database logs
   docker-compose logs db | grep -i error

   # Check database startup logs
   docker-compose logs db | grep -i "ready\|listening\|connection"

   # Check backend connection attempts
   docker-compose logs backend | grep -i "database\|connection\|postgres"

   # Check migration-related logs
   docker-compose logs backend | grep -i "alembic\|migration\|revision"

   # View specific migration run logs
   docker-compose run --rm backend ./migrate.sh
   ```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/profile` - Update profile

### Onboarding Endpoints
- `GET /api/onboarding/status` - Get onboarding status
- `POST /api/onboarding/step1` - Avatar selection
- `POST /api/onboarding/step2` - Timeline setup
- `POST /api/onboarding/step3` - Professional status
- `POST /api/onboarding/step4` - Learning style
- `POST /api/onboarding/step5` - Reward interests
- `GET /api/onboarding/options` - Available options

### Learning Endpoints
- `GET /api/learning/modules` - List all modules
- `GET /api/learning/modules/{id}/lessons` - Get module lessons
- `GET /api/learning/lessons/{id}` - Get lesson details
- `POST /api/learning/lessons/{id}/progress` - Update progress
- `GET /api/learning/lessons/{id}/quiz` - Get quiz questions

### Quiz Endpoints
- `POST /api/quiz/submit` - Submit quiz answers
- `GET /api/quiz/attempts/{lesson_id}` - Get quiz attempts
- `GET /api/quiz/statistics` - User quiz statistics

### Dashboard Endpoints
- `GET /api/dashboard/overview` - Dashboard overview
- `GET /api/dashboard/modules` - Module progress
- `GET /api/dashboard/badges` - User badges
- `GET /api/dashboard/coins` - Coin balance

### Rewards Endpoints
- `GET /api/rewards/coupons` - Available coupons
- `POST /api/rewards/redeem` - Redeem coupon
- `GET /api/rewards/my-redemptions` - Redemption history

### Materials Endpoints
- `GET /api/materials/resources` - Available resources
- `GET /api/materials/calculators` - Calculator list
- `POST /api/materials/calculators/calculate` - Perform calculation
- `GET /api/materials/checklists` - Downloadable checklists

### Help & Support Endpoints
- `GET /api/help/faqs` - Frequently asked questions
- `POST /api/help/contact` - Submit support ticket
- `GET /api/help/my-tickets` - User's support tickets

### Notification Endpoints
- `GET /api/notifications/` - Get notifications
- `GET /api/notifications/unread-count` - Unread count
- `POST /api/notifications/mark-all-read` - Mark all as read

## Gamification System

### Coin System
- **Earning Coins**: Complete lessons, pass quizzes, achieve milestones
- **Spending Coins**: Redeem partner coupons and rewards
- **Bonus Coins**: Perfect quiz scores, streak bonuses, special achievements

### Badge System
- **Achievement Badges**: Lesson completion, quiz mastery, streaks
- **Rarity Levels**: Common, Rare, Epic, Legendary
- **Special Badges**: Perfect scores, early completion, help others

### Rewards System
- **Partner Coupons**: Discounts from real estate and financial partners
- **Categories**: Savings, cashback, experiences, professional services
- **Redemption Tracking**: History and usage monitoring

## Financial Calculators

### Available Calculators
1. **Mortgage Payment Calculator**
   - Monthly payment calculation
   - Principal, interest, taxes, insurance
   - PMI calculation

2. **Home Affordability Calculator**
   - Income-based affordability
   - Debt-to-income ratios
   - Recommended price range

3. **Closing Costs Calculator**
   - Comprehensive closing cost estimation
   - State-specific calculations
   - Loan type adjustments

4. **Rent vs Buy Calculator**
   - Long-term cost comparison
   - Appreciation and equity calculations
   - Break-even analysis

## Onboarding Flow

### Step-by-Step Process
1. **Avatar Selection**: Choose learning persona
2. **Timeline Setup**: Homebuying timeline in months
3. **Professional Status**: Realtor and loan officer status
4. **Learning Style**: Visual, auditory, reading, kinesthetic
5. **Reward Interests**: Preferred reward categories

### Completion Benefits
- Welcome bonus coins
- Personalized learning recommendations
- Customized dashboard experience

## Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: Bcrypt password security
- **Input Validation**: Pydantic schema validation
- **SQL Injection Protection**: SQLAlchemy ORM
- **CORS Configuration**: Cross-origin request handling

## Monitoring & Analytics

### User Progress Tracking
- Lesson completion rates
- Quiz performance metrics
- Learning streak calculations
- Time spent tracking

### Engagement Metrics
- Daily/weekly active users
- Feature usage statistics
- Reward redemption patterns
- Support ticket trends

## Deployment

### Production Considerations
- **Environment Variables**: Secure configuration management
- **Database**: PostgreSQL with connection pooling
- **Caching**: Redis for session management
- **Monitoring**: Application performance monitoring
- **Backup**: Regular database backups
- **SSL/TLS**: HTTPS encryption

### Scaling Options
- **Horizontal Scaling**: Multiple API instances
- **Database Scaling**: Read replicas, partitioning
- **CDN**: Static asset delivery
- **Load Balancing**: Distribute traffic

## Testing

### Test Coverage
- Unit tests for business logic
- Integration tests for API endpoints
- Database migration testing
- Authentication flow testing

### Running Tests
```bash
pytest app/tests/
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {...}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- **Documentation**: `/docs` endpoint for API documentation
- **Issues**: GitHub Issues for bug reports
- **Email**: support@learningplatform.com
- **Help Center**: In-app help and FAQ system

## Database Migration Commands

```bash
# Create a new migration
python -m alembic revision --autogenerate -m "Description"

# Apply migrations
python -m alembic upgrade head

# Rollback migration
python -m alembic downgrade -1

# Show migration history
python -m alembic history
```

## Key Features Highlight

- **Comprehensive Learning Management**: Full LMS-inspired system
- **Gamification Elements**: Coins, badges, leaderboards, streaks
- **Real-world Applications**: Financial calculators and tools
- **Partner Integration**: Coupon and reward system
- **User Experience**: Smooth onboarding and progress tracking
- **Scalable Architecture**: Modern FastAPI with proper separation of concerns
- **Documentation**: Auto-generated API docs and comprehensive README

---

Built using FastAPI, SQLAlchemy, and PostgreSQL