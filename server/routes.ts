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
      const allParcels = await storage.getAllParcels();
      const result = await Promise.all(allParcels.map(async (parcel) => {
        const sender = await storage.getUser(parcel.senderId);
        return {
          ...parcel,
          senderName: sender?.name || "Unknown",
          senderRating: sender?.rating || 5,
        };
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
      res.json(parcelWithSender);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch parcel" });
    }
  });

  app.get("/api/parcels/tracking/:trackingCode", async (req, res) => {
    try {
      const result = await db
        .select()
        .from(parcels)
        .where(eq(parcels.trackingCode, req.params.trackingCode))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json({ error: "Parcel not found" });
      }

      const parcel = result[0];
      const sender = await storage.getUser(parcel.senderId);
      res.json({
        ...parcel,
        senderName: sender?.name || "Unknown",
        senderRating: sender?.rating || 5,
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

      if (shouldResetParcelCount(user)) {
        await storage.resetMonthlyParcelCount(user.id);
        user.monthlyParcelCount = 0;
      }

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
      let trackingCode = generateTrackingCode();
      parcelData.trackingCode = trackingCode;
      
      const parcel = await storage.createParcel(parcelData);
      await storage.incrementParcelCount(user.id);

      if (parcel.receiverId && parcel.receiverId !== parcel.senderId) {
        await storage.createConversation({
          participant1Id: parcel.senderId,
          participant2Id: parcel.receiverId,
          parcelId: parcel.id,
        });
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
      
      if (req.body.status && req.body.status !== existingParcel.status) {
        await notificationService.notifyParcelStatusChange(
          req.params.id,
          req.body.status,
          parcel.senderId
        );
      }
      
      res.json(parcel);
    } catch (error) {
      res.status(500).json({ error: "Failed to update parcel" });
    }
  });

  app.patch("/api/parcels/:id/accept", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { transporterId } = req.body;
      const parcel = await storage.updateParcel(req.params.id, {
        transporterId,
        status: "In Transit",
      });
      if (!parcel) {
        return res.status(404).json({ error: "Parcel not found" });
      }

      await storage.createConversation({
        participant1Id: parcel.senderId,
        participant2Id: transporterId!,
        parcelId: parcel.id,
      });

      await notificationService.notifyParcelStatusChange(
        req.params.id,
        "In Transit",
        parcel.senderId
      );
      
      res.json(parcel);
    } catch (error) {
      res.status(500).json({ error: "Failed to accept parcel" });
    }
  });

  app.get("/api/users/:userId/conversations", async (req, res) => {
    try {
      const allConvos = await storage.getUserConversations(req.params.userId);
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
      const conversation = await storage.getConversation(req.params.id);
      if (conversation) {
        const recipientId = conversation.participant1Id === req.user!.uid 
          ? conversation.participant2Id 
          : conversation.participant1Id;
        
        wsManager.sendToUser(recipientId, {
          type: 'new_message',
          payload: message,
        });
      }
      
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const conversation = await storage.createConversation(req.body);
      res.status(201).json(conversation);
    } catch (error) {
      res.status(500).json({ error: "Failed to create conversation" });
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
        .select()
        .from(routes)
        .orderBy(desc(routes.createdAt));

      const result = await Promise.all(allRoutes.map(async (route) => {
        const user = await storage.getUser(route.carrierId);
        return {
          ...route,
          userName: user?.name || "Unknown",
          userRating: user?.rating || 5,
        };
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
      const { parcelId, amount, carrierId } = req.body;
      const payment = await storage.createPayment({
        parcelId,
        senderId: req.user!.uid,
        carrierId,
        amount,
        carrierAmount: Math.floor(amount * 0.9),
        platformFee: Math.floor(amount * 0.1),
        platformFeePercentage: 10,
        currency: "USD",
        status: "pending",
      });

      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  app.post("/api/subscriptions/subscribe", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { tier } = req.body;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      const subscription = await storage.createSubscription({
        userId: req.user!.uid,
        tier,
        status: "active",
        amount: 1000,
        currency: "USD",
        startDate,
        endDate,
      });

      await storage.updateUser(req.user!.uid, {
        subscriptionStatus: "active",
        subscriptionTier: tier,
      });

      res.status(201).json(subscription);
    } catch (error) {
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  const httpServer = createServer(app);
  wsManager.init(httpServer);
  return httpServer;
}
