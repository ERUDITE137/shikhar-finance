# Shikar Frontend

React-based frontend application for the Shikar personal finance management system. Built with modern React patterns, Vite build tool, and a comprehensive UI component library.

## Technology Stack

- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server with hot module replacement

- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **ShadCn UI**: Accessible, styled UI component library
- **React Router v6**: Client-side routing and navigation
- **React Hook Form**: Performant forms with easy validation
- **Recharts**: Responsive chart library for data visualization


## Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   └── ui/           # Base UI components (buttons, inputs, etc.)
│   ├── contexts/         # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries and configurations
│   ├── pages/            # Page components
│   ├── services/         # API service functions
│   └── utils/            # Helper functions
├── package.json          # Dependencies and scripts
├── tailwind.config.js    # Tailwind CSS configuration
├── vite.config.js        # Vite build configuration
└── postcss.config.js     # PostCSS configuration
```

## Key Features


### Pages and Features
- **Dashboard**: Financial overview with summary cards and charts
- **Transactions**: CRUD operations with advanced filtering and pagination
- **Analytics**: Interactive charts and data visualization
- **Categories**: Category management with icons and colors
- **Upload Receipt**: File upload with progress tracking and preview
- **Authentication**: Login and registration with form validation

## Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager

### Installation
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts
```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run linting
npm run lint
```

## Environment Configuration

Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:8000/api
```

### Environment Variables
- `VITE_API_URL`: Backend API base URL (must start with VITE_ for Vite)

## API Integration

### Service Architecture
- **Centralized API Client**: Axios instance with interceptors
- **Authentication Handling**: Automatic token management
- **Error Handling**: Global error handling with user-friendly messages
- **Request/Response Transformation**: Data formatting and validation

### API Services
- **authAPI**: Authentication and user management
- **transactionsAPI**: Transaction CRUD operations and analytics
- **categoriesAPI**: Category management
- **uploadAPI**: File upload and processing

## Component Library

### Base Components (`/components/ui/`)
- **Button**: Multiple variants and sizes
- **Input**: Text inputs with validation states
- **Card**: Container components for content sections
- **Sheet**: Slide-out panels for forms and details
- **Dropdown Menu**: Accessible dropdown menus
- **Label**: Form labels with proper associations

### Layout Components
- **Layout**: Main application layout with navigation
- **LoadingSpinner**: Consistent loading indicators

### Form Components
- **Controlled Inputs**: React Hook Form integration
- **Validation**: Real-time validation with error display
- **File Upload**: Drag-and-drop file upload with progress

## Deployment

### Production Build
```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

### Docker Deployment
```bash
# Build Docker image
docker build -t shikar-frontend .

# Run container
docker run -p 3000:3000 shikar-frontend
```

### Build Output
- **dist/**: Production build output directory
- **Optimized Assets**: Minified CSS, JavaScript, and images
- **Source Maps**: Debugging information for production
