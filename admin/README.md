# ParcelPeer Admin Dashboard

A modern, feature-rich web-based admin dashboard for managing the ParcelPeer platform with advanced analytics, real-time notifications, and comprehensive data management tools.

## 🎯 Key Features

### 📊 Dashboard & Analytics
- **Interactive Statistics Cards** - Real-time metrics with trend indicators
- **Visual Charts** - Pie charts for status distribution (Parcels, Payments, Disputes)
- **Recent Activity Feed** - Latest system events and user actions
- **Performance Metrics** - Revenue, user growth, and engagement tracking

### 👥 User Management
- **User Directory** - Browse all platform users with filtering and search
- **User Details Page** - Comprehensive user profiles with history
- **Role Management** - Promote users to admin status
- **User Actions** - Verify, suspend, and manage user accounts
- **CSV Export** - Export user data for analysis

### 📦 Parcel Management
- **Parcel Tracking** - Monitor all parcels in the system
- **Status Management** - Update parcel status in real-time
- **Advanced Filtering** - Filter by status, route, sender, or date
- **Bulk Operations** - Export parcel data for reporting
- **Pagination** - Efficient data browsing with 20 items per page

### 💳 Payment Management
- **Transaction History** - View all payment transactions with details
- **Payment Status Tracking** - Monitor success, pending, and failed payments
- **Revenue Analytics** - Track total revenue and payment trends
- **Currency Support** - Handle multiple currencies
- **Export Capabilities** - Download payment data as CSV

### 🚗 Route Management
- **Route Monitoring** - Track all active and inactive routes
- **Capacity Management** - Monitor route capacity and utilization
- **Carrier Information** - View details about route carriers
- **Frequency Control** - Manage route schedules
- **Route Actions** - Update status and delete routes

### ⭐ Review & Rating Management
- **Review Moderation** - View and moderate user reviews
- **Rating Display** - Visual star ratings for each review
- **Review Filtering** - Filter by type, rating, or date
- **Delete Reviews** - Remove inappropriate content
- **Reviewer Information** - Contact details for reviewers

### 🔴 Dispute Resolution
- **Dispute Tracking** - Monitor open and resolved disputes
- **Dispute Details** - View complete dispute information and history
- **Status Updates** - Update dispute status through workflow
- **Refund Management** - Process refunds to user wallets
- **Resolution Notes** - Add detailed resolution information

### 💎 Subscription Management
- **Subscription Overview** - View all active and inactive subscriptions
- **Tier Management** - Track Premium and Business subscriptions
- **Revenue Tracking** - Monitor monthly recurring revenue
- **Subscription Actions** - Cancel subscriptions with reason logging
- **Status Filtering** - Filter by status (active, cancelled, expired)

### 💰 Wallet Management
- **Wallet Transactions** - View all wallet credit/debit transactions
- **Balance Tracking** - Monitor total wallet balances
- **Adjustment Controls** - Manually adjust user wallet balances
- **Refund Processing** - Process parcel refunds
- **Transaction History** - Complete audit trail

### 🔔 Notification System
- **Real-time Alerts** - Instant notifications for important events
- **Notification Center** - Dropdown panel with notification history
- **Unread Badge** - Visual indicator of new notifications
- **Notification Types** - Success, error, warning, and info alerts
- **Clear Options** - Clear individual or all notifications

### ⚙️ Settings & Administration
- **Profile Management** - Update admin profile information
- **Security Settings** - Change password with strength validation
- **Notification Preferences** - Customize alert types
- **System Configuration** - Configure platform settings
- **Data Export** - Export all personal data
- **Account Controls** - Account deletion and security options

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite (lightning-fast bundling)
- **Styling**: Tailwind CSS with custom components
- **Routing**: React Router v6
- **State Management**: React Query (@tanstack/react-query)
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React for beautiful icons
- **Date Handling**: date-fns for date manipulation
- **Authentication**: Local mock authentication in development mode

## 📋 Component Library

### Core Components
- **Table** - Enhanced table with export and pagination
- **StatsCard** - Display metrics with icons and trends
- **StatsGrid** - Grid layout for statistics
- **NotificationCenter** - Notification management UI
- **SearchFilter** - Reusable search and filter component
- **StatusBadge** - Status indicators with auto-styling
- **Modal** - Reusable modal dialog component

### Pages
- Dashboard - Main overview
- Users - User management
- UserDetail - Individual user profile
- Parcels - Parcel tracking
- Routes - Route management
- Payments - Payment transactions
- Reviews - Review moderation
- Disputes - Dispute resolution
- Subscriptions - Subscription management
- WalletTransactions - Wallet operations
- Settings - Admin settings

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 API Integration

The dashboard connects to the ParcelPeer API with:
- **Base URL**: Configured via `VITE_API_URL` environment variable
- **Authentication**: JWT tokens stored in localStorage
- **Error Handling**: Global error boundaries and toast notifications
- **Data Caching**: React Query with automatic invalidation

## 🎨 Design System

- **Primary Color**: #0891B2 (Cyan-600)
- **Secondary Color**: Dynamic (varies by feature)
- **Typography**: Responsive with Tailwind scale
- **Spacing**: 4px base unit
- **Shadows**: Subtle shadows for depth
- **Animations**: Smooth transitions and hover effects

## 📊 Data Export

All data tables support CSV export:
- One-click export from any table
- Automatic filename with timestamp
- Proper formatting and quote escaping
- All visible columns included

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth
- **Protected Routes** - Private routes require authentication
- **Auto Logout** - Automatic logout on auth failure
- **Password Validation** - Strong password requirements
- **Admin-only Features** - Role-based access control

## 📱 Responsive Design

- **Desktop**: Full-featured experience
- **Tablet**: Optimized layout
- **Mobile**: Simplified navigation and touch-friendly

## 🔄 Real-time Features

- **Data Refresh**: React Query auto-refetch on focus
- **Notifications**: Real-time system alerts
- **Live Updates**: Data updates without page reload
- **Activity Feed**: Real-time activity logging

## 📚 Documentation

For API documentation, see the main project README.
For component usage, check individual component files.

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use existing component patterns
3. Maintain Tailwind CSS styling
4. Test in multiple browsers
5. Update this README for new features

## 📄 License

MIT - See LICENSE file for details

- TanStack Query (React Query)
- Mock Authentication (Development)
- Lucide Icons

## Setup

1. Install dependencies:
   ```bash
   cd /app/admin
   yarn install
   ```

2. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your API configuration:
   - Set `VITE_API_URL` to your backend API URL (e.g., http://localhost:5000)

4. Start the development server:
   ```bash
   yarn dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3001
   ```

## Creating an Admin User

To create an admin user in development:

1. Use the default dev credentials (see `AuthContext.tsx`):
   - Email: `admin@parcelpeer.com`
   - Password: `Admin@123456`
   
2. For production, update the user's role in the database:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

## Building for Production

```bash
yarn build
```

The built files will be in the `dist` directory.

## Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn preview` - Preview production build

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |

## Security

- Only users with `role = 'admin'` can access the dashboard
- JWT authentication is required for all routes
- All API requests include authentication tokens
- Suspended admin accounts cannot access the dashboard

## API Endpoints

All admin endpoints are prefixed with `/api/admin/` and require admin authentication.

See the backend `admin-routes.ts` for the complete list of available endpoints.
