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
- **Navigation**: React Navigation 7 (bottom tabs + stack navigators)
- **State**: React Context for in-memory state (parcels, conversations)
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
│   ├── useConversations.tsx  # Messages state
│   ├── useParcels.tsx        # Parcels state
│   └── useTheme.ts           # Theme hook
├── navigation/
│   ├── BrowseStackNavigator.tsx
│   ├── MessagesStackNavigator.tsx
│   ├── MyParcelsStackNavigator.tsx
│   ├── ProfileStackNavigator.tsx
│   ├── MainTabNavigator.tsx
│   └── RootStackNavigator.tsx
└── screens/
    ├── BrowseScreen.tsx      # Main search/browse
    ├── ConversationScreen.tsx # Chat view
    ├── CreateParcelScreen.tsx # Create parcel modal
    ├── EditParcelScreen.tsx  # Edit parcel details
    ├── MessagesScreen.tsx    # Message list
    ├── MyParcelsScreen.tsx   # User's parcels
    ├── ParcelDetailScreen.tsx # Parcel details
    ├── ProfileScreen.tsx     # User profile
    ├── RouteFilterScreen.tsx # Filter modal
    └── SettingsScreen.tsx    # App settings
```

## Design System
- **Primary Color**: Deep Teal (#0A7EA4)
- **Secondary Color**: Warm Orange (#F97316)
- **Icons**: Feather icons from @expo/vector-icons
- **Border Radius**: 8px (inputs), 12px (cards)
- **Spacing**: 4, 8, 12, 16, 20, 24, 32px scale

## Recent Changes
- December 14, 2025: Initial prototype created with full navigation and in-memory data

## Next Phase (Backend)
Planned backend features:
1. PostgreSQL database for persistent storage
2. User authentication
3. Real-time messaging with WebSockets
4. Parcel status tracking
5. Rating/review system
