import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage, db } from "./storage";
import { users, parcels, conversations, messages, connections, routes, reviews, pushTokens, payments, subscriptions, insertParcelSchema, insertMessageSchema, insertConnectionSchema, insertRouteSchema, insertReviewSchema, insertPushTokenSchema } from "@shared/schema";
import { eq, desc, and, gte, lte, ne, sql, or } from "drizzle-orm";
import { requireAuth, optionalAuth, type AuthenticatedRequest } from "./firebase-admin";
import { registerAdminRoutes } from "./admin-routes";
import { 
  SUBSCRIPTION_PLANS, 
  getSubscriptionPlan, 
  canCreateParcel, 
  calculatePlatformFee, 
  shouldResetParcelCount,
  getSubscriptionStatus 
} from "./subscription-utils";
import { generateTrackingCode } from "./tracking-utils";
import crypto from "crypto";
import logger from "./logger";
import { wsManager } from "./websocket";
import { notificationService } from "./notifications";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/health", async (req, res) => {
    const checks = {
      database: false,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };

    try {
      await db.execute(sql`SELECT 1`);
      checks.database = true;
    } catch (error) {
      logger.error('Database health check failed', { error });
    }

    const isHealthy = checks.database;
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks,
    });
  });

  // Register admin routes
  registerAdminRoutes(app);
  app.post("/api/auth/sync", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { uid, email } = req.user!;
      const { name, phone } = req.body;

      let user = await storage.getUser(uid);

      if (!user) {
        user = await storage.createUser({
          id: uid,
          name: name || email?.split("@")[0] || "User",
          email: email || "",
          phone: phone || null,
        });
      }

      res.json(user);
    } catch (error) {
      console.error("Auth sync error:", error);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/parcels", async (req, res) => {
    try {
      const allParcels = await db
        .select({
          parcel: parcels,
          sender: users,
        })
        .from(parcels)
        .innerJoin(users, eq(parcels.senderId, users.id))
        .orderBy(desc(parcels.createdAt));

      const result = allParcels.map(({ parcel, sender }) => ({
        ...parcel,
        senderName: sender.name,
        senderRating: sender.rating,
      }));

      res.json(result);
    } catch (error) {
      console.error("Failed to fetch parcels:", error);
      res.status(500).json({ error: "Failed to fetch parcels" });
    }
  });

  app.get("/api/parcels/:id", async (req, res) => {
    try {
      const parcelWithSender = await storage.getParcelWithSender(req.params.id);
      if (!parcelWithSender) {
        return res.status(404).json({ error: "Parcel not found" });
      }
      res.json({
        ...parcelWithSender,
        senderName: parcelWithSender.sender.name,
        senderRating: parcelWithSender.sender.rating,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch parcel" });
    }
  });

  // Get parcel by tracking code (for scanner)
  app.get("/api/parcels/tracking/:trackingCode", async (req, res) => {
    try {
      const result = await db
        .select({
          parcel: parcels,
          sender: users,
        })
        .from(parcels)
        .innerJoin(users, eq(parcels.senderId, users.id))
        .where(eq(parcels.trackingCode, req.params.trackingCode))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json({ error: "Parcel not found" });
      }

      const { parcel, sender } = result[0];
      res.json({
        ...parcel,
        senderName: sender.name,
        senderRating: sender.rating,
      });
    } catch (error) {
      console.error("Failed to fetch parcel by tracking code:", error);
      res.status(500).json({ error: "Failed to fetch parcel" });
    }
  });


  app.post("/api/parcels", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if monthly parcel count needs to be reset
      if (shouldResetParcelCount(user)) {
        await storage.resetMonthlyParcelCount(user.id);
        user.monthlyParcelCount = 0;
      }

      // Check subscription limits
      const { allowed, reason } = canCreateParcel(user);
      if (!allowed) {
        return res.status(403).json({ error: reason });
      }

      const parsed = insertParcelSchema.safeParse({
        ...req.body,
        senderId: req.user!.uid,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      
      const parcelData = { ...parsed.data };
      
      // Generate unique tracking code
      let trackingCode = generateTrackingCode();
      let attempts = 0;
      const maxAttempts = 10;
      
      // Ensure tracking code is unique
      while (attempts < maxAttempts) {
        const existing = await db
          .select()
          .from(parcels)
          .where(eq(parcels.trackingCode, trackingCode))
          .limit(1);
        
        if (existing.length === 0) {
          break;
        }
        trackingCode = generateTrackingCode();
        attempts++;
      }
      
      parcelData.trackingCode = trackingCode;
      
      try {
        const [originGeo, destGeo] = await Promise.all([
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(parsed.data.origin)}&limit=1`, {
            headers: { "User-Agent": "ParcelPeer/1.0" }
          }).then(r => r.json()),
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(parsed.data.destination)}&limit=1`, {
            headers: { "User-Agent": "ParcelPeer/1.0" }
          }).then(r => r.json())
        ]);
        
        if (originGeo[0]) {
          parcelData.originLat = parseFloat(originGeo[0].lat);
          parcelData.originLng = parseFloat(originGeo[0].lon);
        }
        if (destGeo[0]) {
          parcelData.destinationLat = parseFloat(destGeo[0].lat);
          parcelData.destinationLng = parseFloat(destGeo[0].lon);
        }
      } catch (geoError) {
        console.warn("Geocoding failed, continuing without coordinates:", geoError);
      }
      
      const parcel = await storage.createParcel(parcelData);
      
      // Increment parcel count for the user
      await storage.incrementParcelCount(user.id);

      // Auto-create conversation between sender and receiver when parcel is created (if receiver is set)
      if (parcel.receiverId && parcel.receiverId !== parcel.senderId) {
        try {
          // Check if conversation already exists
          const existingConv = await db
            .select()
            .from(conversations)
            .where(
              and(
                eq(conversations.parcelId, parcel.id),
                or(
                  and(
                    eq(conversations.participant1Id, parcel.senderId),
                    eq(conversations.participant2Id, parcel.receiverId)
                  ),
                  and(
                    eq(conversations.participant1Id, parcel.receiverId),
                    eq(conversations.participant2Id, parcel.senderId)
                  )
                )
              )
            );

          if (existingConv.length === 0) {
            await storage.createConversation({
              participant1Id: parcel.senderId,
              participant2Id: parcel.receiverId,
              parcelId: parcel.id,
            });
            console.log(`Created conversation between sender ${parcel.senderId} and receiver ${parcel.receiverId} for new parcel`);
          }
        } catch (convError) {
          console.error("Error creating sender-receiver conversation:", convError);
          // Don't fail the request if conversation creation fails
        }
      }
      
      res.status(201).json(parcel);
    } catch (error) {
      console.error("Failed to create parcel:", error);
      res.status(500).json({ error: "Failed to create parcel" });
    }
  });

  app.patch("/api/parcels/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const existingParcel = await storage.getParcel(req.params.id);
      if (!existingParcel) {
        return res.status(404).json({ error: "Parcel not found" });
      }
      
      const parcel = await storage.updateParcel(req.params.id, req.body);
      if (!parcel) {
        return res.status(404).json({ error: "Parcel not found" });
      }
      
      // Notify sender if status changed
      if (req.body.status && req.body.status !== existingParcel.status) {
        await notificationService.notifyParcelStatusChange(
          req.params.id,
          req.body.status,
          parcel.senderId
        );
        
        // Also notify transporter if parcel is delivered
        if (req.body.status === 'Delivered' && parcel.transporterId) {
          await notificationService.notifyParcelStatusChange(
            req.params.id,
            req.body.status,
            parcel.transporterId
          );
        }
      }
      
      res.json(parcel);
    } catch (error) {
      res.status(500).json({ error: "Failed to update parcel" });
    }
  });

  app.patch("/api/parcels/:id/accept", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { transporterId } = req.body;
      if (!transporterId) {
        return res.status(400).json({ error: "transporterId is required" });
      }
      const parcel = await storage.updateParcel(req.params.id, {
        transporterId,
        status: "In Transit",
      });
      if (!parcel) {
        return res.status(404).json({ error: "Parcel not found" });
      }

      // Auto-create conversations between all parties when parcel is accepted
      try {
        // Conversation 1: Sender <-> Carrier (transporter)
        const senderCarrierConv = await db
          .select()
          .from(conversations)
          .where(
            and(
              eq(conversations.parcelId, parcel.id),
              or(
                and(
                  eq(conversations.participant1Id, parcel.senderId),
                  eq(conversations.participant2Id, transporterId)
                ),
                and(
                  eq(conversations.participant1Id, transporterId),
                  eq(conversations.participant2Id, parcel.senderId)
                )
              )
            )
          );

        if (senderCarrierConv.length === 0) {
          await storage.createConversation({
            participant1Id: parcel.senderId,
            participant2Id: transporterId,
            parcelId: parcel.id,
          });
          console.log(`Created conversation between sender ${parcel.senderId} and carrier ${transporterId}`);
        }

        // Conversation 2: Sender <-> Receiver (if receiver is set)
        if (parcel.receiverId && parcel.receiverId !== parcel.senderId) {
          const senderReceiverConv = await db
            .select()
            .from(conversations)
            .where(
              and(
                eq(conversations.parcelId, parcel.id),
                or(
                  and(
                    eq(conversations.participant1Id, parcel.senderId),
                    eq(conversations.participant2Id, parcel.receiverId)
                  ),
                  and(
                    eq(conversations.participant1Id, parcel.receiverId),
                    eq(conversations.participant2Id, parcel.senderId)
                  )
                )
              )
            );

          if (senderReceiverConv.length === 0) {
            await storage.createConversation({
              participant1Id: parcel.senderId,
              participant2Id: parcel.receiverId,
              parcelId: parcel.id,
            });
            console.log(`Created conversation between sender ${parcel.senderId} and receiver ${parcel.receiverId}`);
          }
        }

        // Conversation 3: Carrier <-> Receiver (if receiver is set)
        if (parcel.receiverId && parcel.receiverId !== transporterId) {
          const carrierReceiverConv = await db
            .select()
            .from(conversations)
            .where(
              and(
                eq(conversations.parcelId, parcel.id),
                or(
                  and(
                    eq(conversations.participant1Id, transporterId),
                    eq(conversations.participant2Id, parcel.receiverId)
                  ),
                  and(
                    eq(conversations.participant1Id, parcel.receiverId),
                    eq(conversations.participant2Id, transporterId)
                  )
                )
              )
            );

          if (carrierReceiverConv.length === 0) {
            await storage.createConversation({
              participant1Id: transporterId,
              participant2Id: parcel.receiverId,
              parcelId: parcel.id,
            });
            console.log(`Created conversation between carrier ${transporterId} and receiver ${parcel.receiverId}`);
          }
        }
      } catch (convError) {
        console.error("Error creating conversations:", convError);
        // Don't fail the request if conversation creation fails
      }

      // Notify sender that parcel was accepted
      await notificationService.notifyParcelStatusChange(
        req.params.id,
        "In Transit",
        parcel.senderId
      );
      
      res.json(parcel);
    } catch (error) {
      console.error("Failed to accept parcel:", error);
      res.status(500).json({ error: "Failed to accept parcel" });
    }
  });

  app.patch("/api/parcels/:id/receiver-location", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { lat, lng } = req.body;
      if (typeof lat !== "number" || typeof lng !== "number") {
        return res.status(400).json({ error: "lat and lng are required numbers" });
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }

      const parcel = await storage.getParcel(req.params.id);
      if (!parcel) {
        return res.status(404).json({ error: "Parcel not found" });
      }

      const isReceiver = parcel.receiverId === req.user!.uid;
      const user = await storage.getUser(req.user!.uid);
      const isReceiverByEmail = user?.email && parcel.receiverEmail === user.email;

      if (!isReceiver && !isReceiverByEmail) {
        return res.status(403).json({ error: "Only the receiver can update the receiver location" });
      }

      const updated = await storage.updateParcel(req.params.id, {
        receiverLat: lat,
        receiverLng: lng,
        receiverLocationUpdatedAt: new Date(),
      });

      res.json(updated);
    } catch (error) {
      console.error("Failed to update receiver location:", error);
      res.status(500).json({ error: "Failed to update receiver location" });
    }
  });

  app.get("/api/users/:userId/conversations", async (req, res) => {
    try {
      const userConversations = await db
        .select()
        .from(conversations)
        .where(eq(conversations.participant1Id, req.params.userId))
        .orderBy(desc(conversations.createdAt));

      const convos2 = await db
        .select()
        .from(conversations)
        .where(eq(conversations.participant2Id, req.params.userId))
        .orderBy(desc(conversations.createdAt));

      const allConvos = [...userConversations, ...convos2];

      const result = await Promise.all(
        allConvos.map(async (conv) => {
          const otherUserId = conv.participant1Id === req.params.userId
            ? conv.participant2Id
            : conv.participant1Id;
          const otherUser = await storage.getUser(otherUserId);
          const msgs = await storage.getConversationMessages(conv.id);
          const lastMsg = msgs[msgs.length - 1];

          return {
            ...conv,
            userName: otherUser?.name || "Unknown",
            lastMessage: lastMsg?.text || "",
            lastMessageTime: lastMsg?.createdAt || conv.createdAt,
            messages: msgs.map(m => ({
              ...m,
              isMe: m.senderId === req.params.userId,
              timestamp: m.createdAt,
            })),
          };
        })
      );

      res.json(result);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const msgs = await storage.getConversationMessages(req.params.id);
      res.json(msgs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations/:id/messages", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = insertMessageSchema.safeParse({
        ...req.body,
        conversationId: req.params.id,
        senderId: req.user!.uid,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      
      const message = await storage.createMessage(parsed.data);
      
      // Get conversation to find recipient
      const conversation = await storage.getConversation(req.params.id);
      if (conversation) {
        const recipientId = conversation.participant1Id === req.user!.uid 
          ? conversation.participant2Id 
          : conversation.participant1Id;
        
        // Send via WebSocket if user is online
        const sent = wsManager.sendToUser(recipientId, {
          type: 'new_message',
          payload: message,
        });
        
        // Send push notification if user is not online or WebSocket failed
        if (!sent) {
          const sender = await storage.getUser(req.user!.uid);
          await notificationService.notifyNewMessage(
            req.params.id,
            req.user!.uid,
            sender?.name || 'Someone',
            message.text
          );
        }
      }
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Failed to create message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const { participant1Id, participant2Id, parcelId } = req.body;
      
      // Check if conversation already exists between these two users for this parcel
      const existing = await db
        .select()
        .from(conversations)
        .where(
          and(
            parcelId ? eq(conversations.parcelId, parcelId) : sql`true`,
            or(
              and(
                eq(conversations.participant1Id, participant1Id),
                eq(conversations.participant2Id, participant2Id)
              ),
              and(
                eq(conversations.participant1Id, participant2Id),
                eq(conversations.participant2Id, participant1Id)
              )
            )
          )
        );

      if (existing.length > 0) {
        // Return existing conversation
        return res.json(existing[0]);
      }

      // Create new conversation
      const conversation = await storage.createConversation(req.body);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Helper endpoint to get or create a conversation for a parcel
  app.post("/api/parcels/:parcelId/conversation", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { otherUserId } = req.body;
      const parcelId = req.params.parcelId;
      
      if (!otherUserId) {
        return res.status(400).json({ error: "otherUserId is required" });
      }

      const parcel = await storage.getParcel(parcelId);
      if (!parcel) {
        return res.status(404).json({ error: "Parcel not found" });
      }

      // Verify user is involved in this parcel
      const userId = req.user!.uid;
      const isInvolved = 
        userId === parcel.senderId || 
        userId === parcel.transporterId || 
        userId === parcel.receiverId;
      
      if (!isInvolved) {
        return res.status(403).json({ error: "Not authorized to create conversation for this parcel" });
      }

      // Check if conversation already exists
      const existing = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.parcelId, parcelId),
            or(
              and(
                eq(conversations.participant1Id, userId),
                eq(conversations.participant2Id, otherUserId)
              ),
              and(
                eq(conversations.participant1Id, otherUserId),
                eq(conversations.participant2Id, userId)
              )
            )
          )
        );

      if (existing.length > 0) {
        return res.json(existing[0]);
      }

      const conversation = await storage.createConversation({
        participant1Id: userId,
        participant2Id: otherUserId,
        parcelId,
      });

      res.status(201).json(conversation);
    } catch (error) {
      res.status(500).json({ error: "Failed to handle conversation" });
    }
  });

  app.get("/api/users/:userId/parcels", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userParcels = await storage.getUserParcels(req.params.userId);
      res.json(userParcels);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user parcels" });
    }
  });

  app.post("/api/connections", async (req, res) => {
    try {
      const parsed = insertConnectionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const connection = await storage.createConnection(parsed.data);
      res.status(201).json(connection);
    } catch (error) {
      res.status(500).json({ error: "Failed to create connection" });
    }
  });

  app.post("/api/routes", async (req, res) => {
    try {
      const parsed = insertRouteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const route = await storage.createRoute(parsed.data);
      res.status(201).json(route);
    } catch (error) {
      res.status(500).json({ error: "Failed to create route" });
    }
  });

  app.get("/api/routes", async (req, res) => {
    try {
      const allRoutes = await db
        .select({
          route: routes,
          user: users,
        })
        .from(routes)
        .innerJoin(users, eq(routes.userId, users.id))
        .orderBy(desc(routes.createdAt));

      const result = allRoutes.map(({ route, user }) => ({
        ...route,
        userName: user.name,
        userRating: user.rating,
      }));

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch routes" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const parsed = insertReviewSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const review = await storage.createReview(parsed.data);
      
      // Update user rating
      const allReviews = await storage.getUserReviews(parsed.data.targetId);
      const avgRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
      await storage.updateUser(parsed.data.targetId, { rating: avgRating });
      
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  app.get("/api/users/:userId/reviews", async (req, res) => {
    try {
      const userReviews = await storage.getUserReviews(req.params.userId);
      res.json(userReviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user reviews" });
    }
  });

  app.post("/api/push-tokens", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = insertPushTokenSchema.safeParse({
        ...req.body,
        userId: req.user!.uid,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const token = await storage.createPushToken(parsed.data);
      res.status(201).json(token);
    } catch (error) {
      res.status(500).json({ error: "Failed to save push token" });
    }
  });

  app.post("/api/payments/create-intent", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { parcelId, amount } = req.body;
      if (!parcelId || !amount) {
        return res.status(400).json({ error: "parcelId and amount are required" });
      }

      // For now, we simulate payment intent creation
      const payment = await storage.createPayment({
        parcelId,
        payerId: req.user!.uid,
        amount,
        currency: "USD",
        status: "Pending",
        stripePaymentIntentId: `pi_${crypto.randomBytes(12).toString('hex')}`,
      });

      res.json(payment);
    } catch (error) {
      console.error("Failed to create payment intent:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  app.get("/api/subscriptions/plans", (req, res) => {
    res.json(Object.values(SUBSCRIPTION_PLANS));
  });

  app.post("/api/subscriptions/subscribe", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { planId } = req.body;
      const plan = getSubscriptionPlan(planId);
      
      if (!plan) {
        return res.status(400).json({ error: "Invalid subscription plan" });
      }

      // In a real app, we would process payment here
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      const subscription = await storage.createSubscription({
        userId: req.user!.uid,
        planId,
        status: "Active",
        startDate,
        endDate,
      });

      // Update user subscription info
      await storage.updateUser(req.user!.uid, {
        subscriptionStatus: "Active",
        subscriptionPlan: planId,
        monthlyParcelLimit: plan.parcelLimit,
      });

      res.status(201).json(subscription);
    } catch (error) {
      console.error("Failed to create subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket
  wsManager.init(httpServer);

  return httpServer;
}
