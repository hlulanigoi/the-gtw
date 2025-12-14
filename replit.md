# The GTW - Parcel Route-Matching App

## Overview
The GTW is a mobile-first parcel delivery route-matching platform that connects senders and carriers along shared routes. Users can both send parcels and transport parcels, enabling a peer-to-peer delivery network.

## Core Features
- **Browse Parcels**: Search and filter parcels by origin/destination routes
- **Create Parcels**: Simple form to create parcel listings with size, pickup date, and compensation
- **My Parcels**: View parcels you've created or are transporting
- **Messages**: Chat with other users to coordinate pickups and deliveries
- **Profile**: User profile with stats, ratings, and settings

## Route Matching Logic
The app matches parcels based on:
1. Origin to destination (exact matches)
2. Intermediate stops along the route
3. Parcels from any location between origin/destination

## Tech Stack
- **Frontend**: React Native with Expo SDK 54
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: React Query for server state
- **Navigation**: React Navigation 7 (bottom tabs + stack navigators)
- **UI**: Custom components following iOS liquid glass design guidelines

## Project Structure
```
client/
├── App.tsx                    # Root with providers
├── components/
│   ├── Button.tsx            # Primary button component
│   ├── Card.tsx              # Card with elevation
│   ├── ErrorBoundary.tsx     # Error handling
│   ├── FloatingActionButton.tsx # FAB for create parcel
│   ├── HeaderTitle.tsx       # App header with logo
│   ├── ParcelCard.tsx        # Parcel listing card
│   └── ThemedText/View.tsx   # Themed components
├── constants/
│   └── theme.ts              # Colors, spacing, typography
├── hooks/
│   ├── useConversations.tsx  # Messages state (React Query)
│   ├── useParcels.tsx        # Parcels state (React Query)
│   └── useTheme.ts           # Theme hook
├── lib/
│   └── query-client.ts       # React Query client and API helpers
├── navigation/
│   └── ...                   # Stack and tab navigators
└── screens/
    └── ...                   # All app screens

server/
├── index.ts                  # Express server entry point
├── routes.ts                 # API route handlers
└── storage.ts                # Database storage class

shared/
└── schema.ts                 # Drizzle database schema
```

## Database Schema
- **users**: id, name, email, phone, rating, verified, createdAt
- **parcels**: id, origin, destination, intermediateStops, size, weight, description, specialInstructions, isFragile, compensation, pickupDate, status, senderId, transporterId, createdAt
- **conversations**: id, parcelId, participant1Id, participant2Id, createdAt
- **messages**: id, conversationId, senderId, text, createdAt

## API Endpoints
- `GET /api/parcels` - List all parcels with sender info
- `GET /api/parcels/:id` - Get single parcel
- `POST /api/parcels` - Create new parcel
- `PATCH /api/parcels/:id` - Update parcel
- `PATCH /api/parcels/:id/accept` - Accept parcel for transport
- `DELETE /api/parcels/:id` - Delete parcel
- `GET /api/users/:userId/conversations` - Get user conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/conversations/:id/messages` - Send message
- `DELETE /api/messages/:id` - Delete message

## Design System
- **Primary Color**: Deep Teal (#0A7EA4)
- **Secondary Color**: Warm Orange (#F97316)
- **Icons**: Feather icons from @expo/vector-icons
- **Border Radius**: 8px (inputs), 12px (cards)
- **Spacing**: 4, 8, 12, 16, 20, 24, 32px scale

## Recent Changes
- December 14, 2025: Backend persistence implemented with PostgreSQL and Drizzle ORM
- December 14, 2025: Initial prototype created with full navigation and in-memory data

## Next Phase
Planned features:
1. User authentication (currently using hardcoded user ID)
2. Real-time messaging with WebSockets
3. Parcel status tracking with push notifications
4. Rating/review system
5. Route optimization and matching algorithms
