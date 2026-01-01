# Messaging System Architecture - Visual Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MESSAGING SYSTEM FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

BEFORE FIX ❌:
┌──────────────┐         ┌──────────────┐
│   Frontend   │────────►│   Firebase   │
│  (Messages)  │         │  Firestore   │
└──────────────┘         └──────────────┘
                               ❌ Not connected
                         ┌──────────────┐
                         │  PostgreSQL  │
                         │   (Backend)  │
                         └──────────────┘

AFTER FIX ✅:
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │────────►│   Backend    │────────►│  PostgreSQL  │
│  (Messages)  │  REST   │  Express API │   ORM   │   Database   │
└──────────────┘  API    └──────────────┘         └──────────────┘


═══════════════════════════════════════════════════════════════════════════════

CONVERSATION CREATION FLOW:

1️⃣  PARCEL CREATION (Sender creates parcel with receiver info)
    ┌────────┐                                        ┌────────┐
    │ Sender │──── POST /api/parcels ───────►        │Receiver│
    └────────┘                                        └────────┘
         │                                                 ▲
         │                                                 │
         └──────► Backend Auto-Creates Conversation ──────┘
         
         Result: Sender ↔ Receiver conversation created

═══════════════════════════════════════════════════════════════════════════════

2️⃣  PARCEL ACCEPTANCE (Carrier accepts the parcel)
    ┌────────┐                                        ┌────────┐
    │ Sender │◄──── Backend Auto-Creates ────────────│Carrier │
    └────────┘        3 Conversations                └────────┘
         │                                                 │
         │            ┌────────────────┐                  │
         └────────────┤    Receiver    ├──────────────────┘
                      └────────────────┘
         
         Results:
         ✅ Sender ↔ Carrier conversation
         ✅ Sender ↔ Receiver conversation (if doesn't exist)
         ✅ Carrier ↔ Receiver conversation

═══════════════════════════════════════════════════════════════════════════════

MESSAGING DATA FLOW:

1. User Opens Messages Screen
   │
   ├─► Frontend: useConversations hook
   │   └─► API: GET /api/users/:userId/conversations
   │       └─► Backend queries PostgreSQL
   │           └─► Returns: All conversations with last message
   │
   └─► Frontend displays conversation list

2. User Opens a Conversation
   │
   ├─► Frontend: Conversation screen
   │   └─► API: GET /api/conversations/:id/messages
   │       └─► Backend queries PostgreSQL
   │           └─► Returns: All messages in chronological order
   │
   └─► Frontend displays message history

3. User Sends a Message
   │
   ├─► Frontend: User types and hits send
   │   └─► API: POST /api/conversations/:id/messages
   │       │       Body: { text: "Hello!", senderId: "user123" }
   │       │
   │       └─► Backend validates and saves to PostgreSQL
   │           │
   │           └─► Message saved with timestamp
   │
   └─► Frontend refreshes conversation (polling every 5s)

═══════════════════════════════════════════════════════════════════════════════

DATABASE SCHEMA:

conversations
┌─────────────────┬──────────────────────────┐
│ id              │ UUID (Primary Key)       │
│ participant1Id  │ UUID (User Reference)    │
│ participant2Id  │ UUID (User Reference)    │
│ parcelId        │ UUID (Parcel Reference)  │
│ createdAt       │ Timestamp                │
└─────────────────┴──────────────────────────┘

messages
┌─────────────────┬──────────────────────────┐
│ id              │ UUID (Primary Key)       │
│ conversationId  │ UUID (Conv Reference)    │
│ senderId        │ UUID (User Reference)    │
│ text            │ Text                     │
│ createdAt       │ Timestamp                │
└─────────────────┴──────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════

API ENDPOINTS IMPLEMENTED:

📨 CONVERSATIONS:
   ✅ GET  /api/users/:userId/conversations
      - Fetches all conversations for a user
      - Includes last message, timestamp, other user info
      
   ✅ POST /api/conversations
      - Creates new conversation
      - Prevents duplicates automatically
      
   ✅ POST /api/parcels/:parcelId/conversation
      - Helper: Get or create conversation for specific parcel
      - Validates user is involved (sender/carrier/receiver)

📤 MESSAGES:
   ✅ GET  /api/conversations/:id/messages
      - Fetches all messages in a conversation
      - Ordered chronologically
      
   ✅ POST /api/conversations/:id/messages
      - Sends a new message
      - Saves to PostgreSQL
      
   ✅ DELETE /api/messages/:id
      - Deletes a message

═══════════════════════════════════════════════════════════════════════════════

REAL-TIME UPDATES:

Current Implementation:
   Frontend polls every 5 seconds:
   setInterval(() => loadConversations(), 5000)

Future Enhancement (Recommended):
   WebSockets or Server-Sent Events for true real-time messaging

═══════════════════════════════════════════════════════════════════════════════

WHO CAN MESSAGE WHOM:

✅ Sender ↔ Receiver (Created on parcel creation)
✅ Sender ↔ Carrier  (Created on parcel acceptance)  
✅ Carrier ↔ Receiver (Created on parcel acceptance)

All conversations are:
- Automatically created by the system
- Linked to the parcel
- Persistent in PostgreSQL
- Accessible via the Messages tab

═══════════════════════════════════════════════════════════════════════════════

SECURITY:

✅ Firebase Authentication required for all messaging endpoints
✅ Users can only see their own conversations
✅ Duplicate conversations prevented
✅ Authorization checks on conversation creation

═══════════════════════════════════════════════════════════════════════════════
```
