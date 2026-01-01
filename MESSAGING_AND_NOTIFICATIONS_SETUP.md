# Messaging and Push Notifications Setup Guide

## ✅ What Was Implemented

### Backend Changes

1. **WebSocket Server** (`/app/server/websocket.ts`)
   - Real-time bidirectional communication between server and clients
   - Automatic reconnection and heartbeat monitoring
   - User authentication and session management
   - Supports message broadcasting and typing indicators

2. **Push Notification Service** (`/app/server/notifications.ts`)
   - Integration with Expo Push Notification service
   - Automatic token validation and cleanup
   - Smart notifications that don't send if user is online via WebSocket
   - Notification types:
     - New messages
     - Parcel status changes (In Transit, Delivered, Expired)
     - New reviews received
     - Payment successful
     - Route matches

3. **Updated Backend Routes** (`/app/server/routes.ts`)
   - POST `/api/conversations/:id/messages` - Send message with real-time delivery + push notification
   - PATCH `/api/parcels/:id` - Update parcel with status change notifications
   - PATCH `/api/parcels/:id/accept` - Accept parcel with notification to sender
   - POST `/api/reviews` - Create review with notification to reviewee
   - GET `/api/payments/verify/:reference` - Verify payment with success notification

4. **Dependencies Added**
   - `expo-server-sdk@4.0.0` - For sending push notifications

### Frontend Changes

1. **WebSocket Hook** (`/app/client/hooks/useWebSocket.tsx`)
   - Manages WebSocket connection lifecycle
   - Auto-reconnection with exponential backoff
   - Message subscription system
   - Heartbeat/ping-pong for connection health

2. **Updated Conversations Hook** (`/app/client/hooks/useConversations.tsx`)
   - Now uses backend PostgreSQL API instead of Firebase
   - Real-time message updates via WebSocket
   - Optimistic UI updates for better UX
   - Automatic conversation sorting by last message time

3. **App Integration** (`/app/client/App.tsx`)
   - WebSocket connection initialized on app start
   - Persists throughout app lifecycle

## 🔧 Configuration Required

### 1. Database Setup

The app requires PostgreSQL. You need to:

**Option A: Use External PostgreSQL (Recommended for Production)**
```bash
# Get a PostgreSQL database from:
# - Neon (https://neon.tech) - Free tier available
# - Supabase (https://supabase.com) - Free tier available
# - Railway (https://railway.app)
# - Heroku Postgres

# Then set the DATABASE_URL in your environment
```

**Option B: Install PostgreSQL Locally (Development)**
```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL
sudo service postgresql start

# Create database
sudo -u postgres psql -c "CREATE DATABASE parcelpeer;"
sudo -u postgres psql -c "CREATE USER parcelpeer WITH PASSWORD 'parcelpeer';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE parcelpeer TO parcelpeer;"
```

### 2. Environment Variables

Create `/app/.env` file with:

```env
# Database
DATABASE_URL=postgresql://parcelpeer:parcelpeer@localhost:5432/parcelpeer

# Firebase Admin (for authentication)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com

# Payment (if using Paystack)
PAYSTACK_SECRET_KEY=sk_test_xxx

# Server
NODE_ENV=development
PORT=5000
```

### 3. Run Database Migrations

```bash
cd /app
yarn db:push
```

### 4. Start the Server

```bash
cd /app
yarn server:dev
```

## 📱 How It Works

### Real-Time Messaging Flow

1. **User A sends a message:**
   - Frontend calls `POST /api/conversations/:id/messages`
   - Backend saves message to PostgreSQL
   - Backend checks if User B is online via WebSocket
   - If online: Message sent immediately via WebSocket
   - If offline: Push notification sent to User B's device

2. **User B receives message:**
   - If online: WebSocket instantly delivers message
   - Frontend updates conversation UI in real-time
   - If offline: Gets push notification, opens app, sees message

### Push Notifications Flow

1. **App Startup:**
   - User grants notification permission
   - Expo generates push token
   - Token sent to backend via `POST /api/push-tokens`
   - Stored in PostgreSQL

2. **Notification Trigger:**
   - Event occurs (new message, parcel update, review)
   - Backend checks if user is online
   - If offline, backend sends push via Expo service
   - User device receives notification
   - Tapping notification opens relevant screen

### WebSocket Features

- **Authentication:** Users authenticate with their Firebase UID
- **Heartbeat:** 30-second ping/pong keeps connection alive
- **Auto-reconnect:** Exponential backoff up to 5 attempts
- **Typing Indicators:** Can be implemented using `typing` message type
- **Presence:** Can determine if user is online

## 🧪 Testing

### Test Real-Time Messaging

1. Open app on two devices/emulators with different users
2. Start a conversation
3. Send messages back and forth
4. Messages should appear instantly on both devices

### Test Push Notifications

1. Open app on one device
2. Close the app or put it in background
3. Send a message from another device
4. First device should receive push notification

### Test Parcel Notifications

1. Create a parcel
2. Have another user accept it (status → In Transit)
3. Creator receives push notification
4. Mark as delivered
5. Both users receive notifications

## 🐛 Troubleshooting

### WebSocket not connecting

```bash
# Check if server is running
curl http://localhost:5000/health

# Check WebSocket endpoint
wscat -c ws://localhost:5000/ws
```

### Push notifications not working

```bash
# Check if tokens are being saved
# Make a request to check push tokens for a user
curl http://localhost:5000/api/users/:userId/push-tokens

# Check server logs for push notification errors
tail -f /tmp/server.log
```

### Messages not appearing in real-time

1. Check WebSocket connection status in app
2. Verify DATABASE_URL is set correctly
3. Check that conversations exist in database
4. Verify both users are authenticated

## 🚀 Next Steps

1. **Set up PostgreSQL database** (see Configuration Required)
2. **Add DATABASE_URL** to environment
3. **Run migrations** with `yarn db:push`
4. **Start server** with `yarn server:dev`
5. **Test on mobile devices** to verify push notifications work

## 📚 Code References

- **Backend WebSocket:** `/app/server/websocket.ts`
- **Backend Notifications:** `/app/server/notifications.ts`
- **Backend Routes:** `/app/server/routes.ts`
- **Frontend WebSocket Hook:** `/app/client/hooks/useWebSocket.tsx`
- **Frontend Conversations:** `/app/client/hooks/useConversations.tsx`
- **Database Schema:** `/app/shared/schema.ts`

## ⚠️ Important Notes

1. **Firebase is still used for user authentication** (not messaging anymore)
2. **PostgreSQL stores all conversations and messages** now
3. **WebSocket requires server restart** if you make changes
4. **Push notifications require physical devices** - they don't work in simulators
5. **Expo push tokens** are managed automatically by the app
