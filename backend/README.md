# Shikar Backend

Node.js REST API backend for the Shikar personal finance management system. Built with Express.js, MongoDB, and integrated with AI services for intelligent receipt processing.

## Technology Stack

- **Node.js**: JavaScript runtime environment
- **Express.js**: Fast, unopinionated web framework
- **MongoDB**: NoSQL document database
- **Mongoose**: MongoDB object modeling for Node.js

## Project Structure

```
backend/
├── config/                # Configuration files
│   ├── config.js         # Application configuration
│   └── database.js       # Database connection setup
├── controllers/          # Route controllers
│   ├── authController.js
│   ├── categoryController.js
│   ├── transactionController.js
│   └── uploadController.js
├── middleware/           # Custom middleware
│   └── auth.js          # Authentication middleware
├── models/               # Mongoose data models
│   ├── Category.js
│   ├── Transaction.js
│   └── User.js
├── routes/               # API route definitions
│   ├── auth.js
│   ├── categories.js
│   ├── transactions.js
│   └── upload.js
├── utils/                # Utility functions
│   ├── geminiService.js  # AI service integration
│   ├── pdfProcessor.js   # PDF processing utilities
│   └── receiptProcessor.js # Receipt processing utilities
├── uploads/              # File upload directory
├── package.json          # Dependencies and scripts
└── server.js            # Application entry point
```

## Core Features

### Authentication System
- **User Registration**: Secure user account creation with validation
- **User Login**: JWT-based authentication with password verification
- **Password Security**: bcrypt hashing with salt rounds
- **Token Management**: JWT token generation and verification
- **Protected Routes**: Middleware-based route protection

### Transaction Management
- **CRUD Operations**: Create, read, update, delete transactions
- **Advanced Filtering**: Filter by date range, category, type, and text search
- **Pagination**: Efficient data retrieval with page-based pagination
- **Analytics**: Aggregated financial data and insights
- **Data Validation**: Comprehensive input validation and sanitization

### Category Management
- **Custom Categories**: User-defined transaction categories
- **Icon and Color Support**: Visual customization for categories
- **Type Specification**: Income, expense, or both transaction types
- **Category Analytics**: Spending breakdown by category

### File Upload and Processing
- **Multi-format Support**: Images (JPEG, PNG) and PDF files
- **Receipt Processing**: OCR text extraction from images
- **PDF Parsing**: Transaction history extraction from bank statements
- **AI Integration**: Google Gemini API for intelligent data parsing
- **Bulk Import**: Process multiple transactions from statements

## AI and Processing Features

### Receipt Processing Pipeline
1. **File Upload**: Secure file handling with size and type validation
2. **Image Optimization**: Sharp-based image processing for better OCR
3. **OCR Extraction**: Tesseract.js text extraction from images
4. **AI Parsing**: Google Gemini API for structured data extraction
5. **Data Validation**: Comprehensive validation of extracted information
6. **Smart Categorization**: AI-powered category suggestions

### PDF Processing
- **Text Extraction**: Extract text content from PDF files
- **Transaction Detection**: Identify transaction patterns in bank statements
- **Data Structuring**: Convert unstructured text to transaction objects
- **Bulk Processing**: Handle multiple transactions efficiently

### Google Gemini Integration
- **Receipt Parsing**: Extract merchant, amount, date, and category
- **Transaction History**: Parse bank statements and transaction lists
- **Natural Language Processing**: Understand context and improve accuracy
- **Error Handling**: Graceful fallback when AI processing fails

## Environment Configuration

### Required Environment Variables
```env
NODE_ENV=development
PORT=8000
MONGODB_URI=mongodb://localhost:27017/shikar
JWT_SECRET=your-super-secret-jwt-key
GEMINI_API_KEY=your-gemini-api-key
```

### Configuration Options
- **Database**: MongoDB connection string
- **Authentication**: JWT secret for token signing
- **AI Services**: Google Gemini API credentials
- **File Storage**: Upload directory configuration
- **Security**: CORS, rate limiting, and helmet settings

## Development Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local instance or Atlas)
- Google Gemini API key

### Installation
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Available Scripts
```bash
# Start production server
npm start

# Start development server with nodemon
npm run dev

# Run tests
npm test
```
## Deployment

### Production Setup
```bash
# Install production dependencies only
npm ci --production

# Start production server
npm start
```

### Docker Deployment
```bash
# Build Docker image
docker build -t shikar-backend .

# Run container
docker run -p 8000:8000 shikar-backend
```

