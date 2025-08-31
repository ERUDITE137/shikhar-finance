# Shikar - Personal Finance Management 

A comprehensive personal finance management application built with React, Node.js, and MongoDB. Shikar helps users track their income and expenses with advanced features including AI-powered receipt processing and detailed analytics.

## [Demo Video Link](https://drive.google.com/file/d/14NgIWU9UTI6wv2KKqBPM4lq88Of5wnLZ/view?usp=sharing)

## Features

### Core Functionality
- **User Authentication**: Secure registration and login system with JWT-based authentication
- **Transaction Management**: Create, edit, delete, and categorize financial transactions
- **Category Management**: Organize transactions with customizable categories and icons
- **Dashboard Overview**: Real-time financial summary with key metrics and recent transactions
- ** Analytics**: Visual insights with charts, spending patterns, and monthly trends

### Advanced Features
- **AI-Powered Receipt Processing**: Upload receipt images or PDFs for automatic transaction extraction
- **OCR Text Extraction**: Extract text from receipt images using Tesseract.js
- **Gemini AI Integration**: Intelligent parsing of receipt data to identify merchant, amount, date, and category
- **Bulk Transaction Import**: Process bank statements and transaction history from PDF files

### User Interface
- **Responsive Design**: Mobile-first design that works on all devices
- **Modern UI Components**: Built with Radix UI and Tailwind CSS
- **Interactive Charts**: Data visualization using Recharts library
- **Intuitive Navigation**: Clean and organized interface with sidebar navigation

### Data Management
- **Advanced Filtering**: Filter transactions by date range, category, type, and search terms
- **Pagination**: Efficient data loading with pagination support


## Technology Stack

### Frontend
- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible UI component library
- **Recharts**: Chart library for data visualization
- **Axios**: HTTP client for API communication
- **React Hook Form**: Form management and validation

### Backend
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database for data storage
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Tokens for authentication
- **Multer**: File upload handling
- **Tesseract.js**: OCR text extraction
- **PDF Parse**: PDF text extraction

### AI Integration
- **Google Gemini API**: Advanced AI for receipt parsing and transaction categorization
- **Smart Data Extraction**: Automatic identification of merchant, amount, date, and category

### Infrastructure
- **Docker**: Containerized deployment
- **Docker Compose**: Multi-container orchestration
- **MongoDB Atlas**: Cloud database.
- **Environment Configuration**: Secure environment variable management

## Installation and Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Docker and Docker Compose (optional)
- Google Gemini API key (for AI features)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shikar
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Configuration**
   
   Create `.env` file in the backend directory:
   ```env
   NODE_ENV=development
   PORT=8000
   MONGODB_URI=mongodb://localhost:27017/shikar
   JWT_SECRET=your-super-secret-jwt-key
   GEMINI_API_KEY=your-gemini-api-key
   ```

4. **Start the application**
   ```bash
   # Start backend (from backend directory)
   npm run dev

   # Start frontend (from frontend directory)
   npm run dev
   ```

### Docker Deployment

1. **Using Docker Compose**
   ```bash
   # Build and start all services
   docker-compose up --build

   # Run in detached mode
   docker-compose up -d
   ```

2. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - MongoDB: localhost:27017

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Transaction Endpoints
- `GET /api/transactions` - Get transactions with filtering and pagination
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/analytics` - Get analytics data

### Category Endpoints
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Upload Endpoints
- `POST /api/upload/receipt` - Upload and process receipt
- `POST /api/upload/transaction-history` - Upload transaction history PDF
- `POST /api/upload/bulk-create-transactions` - Bulk create transactions

## Key Features in Detail

### Receipt Processing Workflow
1. Upload receipt image or PDF
2. OCR text extraction using Tesseract.js
3. AI parsing with Google Gemini to extract structured data
4. Smart category suggestion based on merchant and description
5. Review and edit extracted information
6. Automatic transaction creation

### Analytics Dashboard
- Monthly income vs expense trends
- Category-wise spending breakdown
- Daily spending patterns
- Financial health indicators
- Interactive charts and visualizations

### Smart Filtering
- Date range selection (start and end dates)
- Category-based filtering
- Transaction type filtering (income/expense)
- Text search across descriptions, locations, and notes
- Real-time filter application

## Database Schema

### User Collection
- Personal information and authentication credentials
- Encrypted password storage
- User preferences and settings

### Transaction Collection
- Amount, description, type (income/expense)
- Category reference and user association
- Date, location, payment method
- Receipt attachments and metadata
- Tags and notes for organization

### Category Collection
- Name, icon, and color customization
- Type specification (income, expense, both)
- User-specific categories

