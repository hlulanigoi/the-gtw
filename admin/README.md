# ParcelPeer Admin Dashboard

A modern web-based admin dashboard for managing the ParcelPeer platform.

## Features

- **Dashboard**: Overview statistics and recent activity
- **User Management**: View, verify, suspend users, and assign admin roles
- **Parcel Management**: Monitor all parcels and update their status
- **Route Management**: View and manage carrier routes
- **Payment Management**: Track all payment transactions
- **Review Management**: Moderate user reviews

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query (React Query)
- Firebase Authentication
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

3. Update the `.env` file with your Firebase configuration:
   - Get your Firebase config from Firebase Console
   - Update all `VITE_FIREBASE_*` variables

4. Start the development server:
   ```bash
   yarn dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3001
   ```

## Creating an Admin User

To create an admin user:

1. First, create a regular user account through the mobile app or Firebase Console
2. Then, update the user's role in the database:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
   ```
3. You can now login to the admin dashboard with these credentials

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
| `VITE_FIREBASE_API_KEY` | Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |

## Security

- Only users with `role = 'admin'` can access the dashboard
- Firebase authentication is required for all routes
- All API requests include authentication tokens
- Suspended admin accounts cannot access the dashboard

## API Endpoints

All admin endpoints are prefixed with `/api/admin/` and require admin authentication.

See the backend `admin-routes.ts` for the complete list of available endpoints.
