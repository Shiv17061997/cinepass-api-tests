# CinePass API Test Automation Suite

Complete API test automation for CinePass movie booking system using Playwright with Allure reporting.

## 📋 Overview

This test suite provides comprehensive API testing coverage for the CinePass Backend with:

- **46 Total Test Cases** across 4 services
- **Playwright** for API testing
- **Allure** reporting with detailed metrics
- **Maximum test coverage** including happy paths, error scenarios, and edge cases

## 🎯 Test Coverage

### Auth Service (14 tests)
- ✅ User Registration (valid/invalid credentials, duplicates)
- ✅ User Login (valid/invalid credentials)
- ✅ Get Current User (authenticated/unauthenticated)
- ✅ Logout functionality

### Movies Service (11 tests)
- ✅ Get All Movies (pagination, filtering)
- ✅ Get Single Movie (valid/invalid IDs)
- ✅ Create Movie (admin-only)
- ✅ Update Movie (admin-only)
- ✅ Delete Movie (admin-only)

### Showtimes Service (8 tests)
- ✅ Get Showtimes by Movie
- ✅ Get Seat Availability
- ✅ Create Showtime (admin-only)
- ✅ Delete Showtime (admin-only)

### Bookings Service (13 tests)
- ✅ Create Booking (single/multiple seats)
- ✅ Get User Bookings
- ✅ Cancel Booking
- ✅ Conflict Detection (duplicate seats, occupied seats)
- ✅ Cross-user isolation tests

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Shiv17061997/cinepass-api-tests.git
cd cinepass-api-tests

# Install dependencies
npm install
```

### Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your service URLs
AUTH_SERVICE_URL=http://localhost:8081
BOOKING_SERVICE_URL=http://localhost:8082
```

## 📝 Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Service Tests
```bash
# Auth service tests
npm run test:auth

# Movies service tests
npm run test:movies

# Showtimes service tests
npm run test:showtimes

# Bookings service tests
npm run test:bookings
```

### Debug Tests
```bash
npm run test:debug
```

## 📊 Allure Reporting

### View Allure Reports
```bash
# Generate and serve Allure report
npm run allure:serve
```

### Generate Static Allure Report
```bash
npm run allure:report
```

Reports will be available in the `allure-report` directory.

## 📁 Project Structure

```
cinepass-api-tests/
├── tests/
│   ├── config/
│   │   ├── api.config.js          # API configuration and test data
│   │   └── test-helpers.js        # APIClient and helper utilities
│   ├── auth.spec.js               # Authentication tests
│   ├── movies.spec.js             # Movies service tests
│   ├── showtimes.spec.js          # Showtimes service tests
│   └── bookings.spec.js           # Bookings service tests
├── playwright.config.js           # Playwright configuration
├── package.json                   # Dependencies and scripts
├── .env.example                   # Environment variables template
└── README.md                      # This file
```

## 🔧 Features

### APIClient Helper
- Centralized HTTP request management
- JWT token authentication
- Automatic header handling
- Support for GET, POST, PUT, DELETE operations

### Test Organization
- Tests grouped by service and functionality
- Descriptive test names for clarity
- Reusable helper functions
- Data isolation using timestamps

### Comprehensive Assertions
- Status code validation
- Response structure validation
- Error message verification
- Cross-user isolation tests

### Error Scenarios
- Invalid input validation
- Missing required fields
- Authentication failures
- Authorization checks
- Conflict detection
- Not found errors

## 🛠️ CI/CD Integration

The test suite is configured for CI/CD pipelines with:
- Parallel test execution
- Automatic retries (2x in CI)
- HTML and Allure reporting
- Coverage tracking

## 📚 API Documentation Reference

Based on the CinePass Backend API Postman collection:

### Auth Service (Base: `http://localhost:8081`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Booking Service (Base: `http://localhost:8082`)

**Movies**
- `GET /api/movies` - List all movies
- `GET /api/movies/:id` - Get movie by ID
- `POST /api/movies` - Create movie (admin)
- `PUT /api/movies/:id` - Update movie (admin)
- `DELETE /api/movies/:id` - Delete movie (admin)

**Showtimes**
- `GET /api/movies/:id/showtimes` - Get showtimes for movie
- `GET /api/showtimes/:id/seats` - Get seat availability
- `POST /api/showtimes` - Create showtime (admin)
- `DELETE /api/showtimes/:id` - Delete showtime (admin)

**Bookings**
- `POST /api/bookings` - Create booking
- `GET /api/bookings/mine` - Get user bookings
- `DELETE /api/bookings/:id` - Cancel booking

## 💡 Best Practices

1. **Test Isolation**: Each test is independent and uses unique data
2. **Error Handling**: Tests handle both success and failure scenarios
3. **Clear Assertions**: Each assertion has clear intent
4. **Maintainability**: Centralized configuration and helpers
5. **Performance**: Parallel execution for faster test runs

## 🐛 Troubleshooting

### Tests are timing out
- Increase the `timeout` value in `playwright.config.js`
- Ensure your API services are running and accessible

### Authentication errors
- Verify `.env` file has correct service URLs
- Ensure auth service is running on configured port

### Allure report not generating
- Install Allure: `npm install -g allure-commandline`
- Ensure `allure-results` directory exists after test run

## 📞 Support

For issues or questions, please open an issue in the repository.

## 📄 License

ISC License - Feel free to use and modify as needed.
