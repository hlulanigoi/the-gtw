import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage, db } from "./storage";
import { users, parcels, conversations, messages, connections, routes, reviews, pushTokens, parcelMessages, carrierLocations, receiverLocations, payments, insertParcelSchema, insertMessageSchema, insertConnectionSchema, insertRouteSchema, insertReviewSchema, insertPushTokenSchema, insertParcelMessageSchema, insertCarrierLocationSchema, insertReceiverLocationSchema, insertPaymentSchema } from "@shared/schema";
import { walletTransactions, insertWalletTransactionSchema } from "@shared/wallet-schema";
import { createHmac } from "crypto";
import { eq, desc, and, gte, lte, ne, sql } from "drizzle-orm";
import { requireAuth, optionalAuth, type AuthenticatedRequest } from "./firebase-admin";
import { registerReceiverEnhancements } from "./receiver-enhancements";
import { NotificationService } from "./notification-service";

export async function registerRoutes(app: Express): Promise<Server> {
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

  app.get("/api/auth/me", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.json(null);
      }
      const user = await storage.getUser(req.user.uid);
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

  app.post("/api/parcels", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const data = { ...req.body };
      if (typeof data.pickupDate === "string") data.pickupDate = new Date(data.pickupDate);
      if (typeof data.pickupWindowEnd === "string" && data.pickupWindowEnd) data.pickupWindowEnd = new Date(data.pickupWindowEnd);
      if (typeof data.deliveryWindowStart === "string" && data.deliveryWindowStart) data.deliveryWindowStart = new Date(data.deliveryWindowStart);
      if (typeof data.deliveryWindowEnd === "string" && data.deliveryWindowEnd) data.deliveryWindowEnd = new Date(data.deliveryWindowEnd);
      if (typeof data.expiresAt === "string" && data.expiresAt) data.expiresAt = new Date(data.expiresAt);

      const parsed = insertParcelSchema.safeParse({
        ...data,
        senderId: req.user!.uid,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      
      const parcelData = { ...parsed.data };
      
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
      
      // Send notification to receiver if receiverId is set
      if (parcel.receiverId) {
        const sender = await storage.getUser(req.user!.uid);
        await NotificationService.notifyNewIncomingParcel(
          parcel.receiverId,
          parcel.id,
          sender?.name || "Someone"
        );
      }
      
      res.status(201).json(parcel);
    } catch (error) {
      console.error("Failed to create parcel:", error);
      res.status(500).json({ error: "Failed to create parcel" });
    }
  });

  app.patch("/api/parcels/:id", async (req, res) => {
    try {
      const oldParcel = await storage.getParcel(req.params.id);
      const parcel = await storage.updateParcel(req.params.id, req.body);
      if (!parcel) {
        return res.status(404).json({ error: "Parcel not found" });
      }
      
      // Send notification on status change
      if (oldParcel && parcel.status !== oldParcel.status) {
        // Notify receiver
        if (parcel.receiverId) {
          await NotificationService.notifyStatusChange(
            parcel.receiverId,
            parcel.id,
            oldParcel.status,
            parcel.status
          );
        }
        // Notify sender
        if (parcel.senderId) {
          await NotificationService.notifyStatusChange(
            parcel.senderId,
            parcel.id,
            oldParcel.status,
            parcel.status
          );
        }
      }
      
      res.json(parcel);
    } catch (error) {
      res.status(500).json({ error: "Failed to update parcel" });
    }
  });

  app.patch("/api/parcels/:id/accept", async (req, res) => {
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
      res.json(parcel);
    } catch (error) {
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

  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const parsed = insertMessageSchema.safeParse({
        ...req.body,
        conversationId: req.params.id,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const message = await storage.createMessage(parsed.data);
      res.status(201).json(message);
    } catch (error) {
      console.error("Failed to create message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const conversation = await storage.createConversation(req.body);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.get("/api/users/search", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const searchTerm = req.query.q as string;
      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.json([]);
      }

      const searchLower = searchTerm.toLowerCase().trim();
      const currentUserId = req.user?.uid;

      const allUsers = await db.select().from(users);
      const results = allUsers
        .filter((user) => {
          const userName = (user.name || "").toLowerCase();
          const userEmail = (user.email || "").toLowerCase();
          return (
            (currentUserId ? user.id !== currentUserId : true) &&
            (userName.includes(searchLower) || userEmail.includes(searchLower))
          );
        })
        .sort((a, b) => {
          const aNameMatch = (a.name || "").toLowerCase().startsWith(searchLower);
          const bNameMatch = (b.name || "").toLowerCase().startsWith(searchLower);
          if (aNameMatch && !bNameMatch) return -1;
          if (!aNameMatch && bNameMatch) return 1;
          return (a.name || "").localeCompare(b.name || "");
        })
        .slice(0, 10);

      res.json(results);
    } catch (error) {
      console.error("Failed to search users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      if (!req.body.id) {
        return res.status(400).json({ error: "User ID is required" });
      }
      // Check if user already exists
      const existing = await storage.getUser(req.body.id);
      if (existing) {
        return res.json(existing);
      }
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      console.error("Failed to create user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Update user in database
      const updated = await db
        .update(users)
        .set(req.body)
        .where(eq(users.id, req.params.id))
        .returning();
      res.json(updated[0] || user);
    } catch (error) {
      console.error("Failed to update user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/parcels/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteParcel(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Parcel not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete parcel:", error);
      res.status(500).json({ error: "Failed to delete parcel" });
    }
  });

  app.delete("/api/messages/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteMessage(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  app.get("/api/users/:userId/connections", async (req, res) => {
    try {
      const userConnections = await storage.getUserConnections(req.params.userId);
      res.json(userConnections);
    } catch (error) {
      console.error("Failed to fetch connections:", error);
      res.status(500).json({ error: "Failed to fetch connections" });
    }
  });

  app.post("/api/users/:userId/connections", async (req, res) => {
    try {
      const parsed = insertConnectionSchema.safeParse({
        ...req.body,
        userId: req.params.userId,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const connectedUser = await storage.getUser(parsed.data.connectedUserId);
      if (!connectedUser) {
        return res.status(404).json({ error: "Connected user not found" });
      }
      const existing = await storage.getConnection(req.params.userId, parsed.data.connectedUserId);
      if (existing) {
        return res.status(409).json({ error: "Connection already exists" });
      }
      const connection = await storage.createConnection(parsed.data);
      res.status(201).json({ ...connection, connectedUser });
    } catch (error) {
      console.error("Failed to create connection:", error);
      res.status(500).json({ error: "Failed to create connection" });
    }
  });

  app.delete("/api/users/:userId/connections/:connectedUserId", async (req, res) => {
    try {
      const deleted = await storage.deleteConnection(req.params.userId, req.params.connectedUserId);
      if (!deleted) {
        return res.status(404).json({ error: "Connection not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete connection:", error);
      res.status(500).json({ error: "Failed to delete connection" });
    }
  });

  app.get("/api/geocode", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`,
        {
          headers: {
            "User-Agent": "ParcelPeer/1.0",
          },
        }
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Geocoding failed:", error);
      res.status(500).json({ error: "Geocoding failed" });
    }
  });

  app.get("/api/routes", async (req, res) => {
    try {
      const allRoutes = await db
        .select({
          route: routes,
          carrier: users,
        })
        .from(routes)
        .innerJoin(users, eq(routes.carrierId, users.id))
        .where(eq(routes.status, "Active"))
        .orderBy(desc(routes.departureDate));

      const result = allRoutes.map(({ route, carrier }) => ({
        ...route,
        carrierName: carrier.name,
        carrierRating: carrier.rating,
      }));

      res.json(result);
    } catch (error) {
      console.error("Failed to fetch routes:", error);
      res.status(500).json({ error: "Failed to fetch routes" });
    }
  });

  app.get("/api/routes/:id", async (req, res) => {
    try {
      const routeWithCarrier = await storage.getRouteWithCarrier(req.params.id);
      if (!routeWithCarrier) {
        return res.status(404).json({ error: "Route not found" });
      }
      res.json({
        ...routeWithCarrier,
        carrierName: routeWithCarrier.carrier.name,
        carrierRating: routeWithCarrier.carrier.rating,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch route" });
    }
  });

  app.get("/api/users/:userId/routes", async (req, res) => {
    try {
      const userRoutes = await storage.getUserRoutes(req.params.userId);
      res.json(userRoutes);
    } catch (error) {
      console.error("Failed to fetch user routes:", error);
      res.status(500).json({ error: "Failed to fetch user routes" });
    }
  });

  // Paystack Integration
  app.post("/api/payments/initialize", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { amount, email, metadata } = req.body;
      
      if (!amount || !email) {
        return res.status(400).json({ error: "Amount and email are required" });
      }

      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackSecretKey) {
        return res.status(500).json({ error: "Paystack configuration missing" });
      }

      // Get the base URL from request or environment
      const protocol = req.get("x-forwarded-proto") || req.protocol || "https";
      const host = req.get("x-forwarded-host") || req.get("host");
      const baseUrl = `${protocol}://${host}`;

      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to kobo/cents
          email,
          metadata,
          callback_url: `${baseUrl}/api/payments/verify-web`,
        }),
      });

      const data = await response.json();
      if (!data.status) {
        throw new Error(data.message || "Failed to initialize Paystack transaction");
      }

      // Store payment record
      const platformFee = Math.round(amount * 0.03);
      const totalAmount = amount + platformFee;
      
      await storage.createPayment({
        parcelId: metadata.parcelId,
        userId: req.user!.uid,
        reference: data.data.reference,
        amount: Math.round(amount),
        platformFee,
        totalAmount,
        status: "pending",
        paymentMethod: "paystack",
        paystackData: JSON.stringify(data.data),
      });

      res.json(data.data);
    } catch (error: any) {
      console.error("Paystack initialization error:", error);
      res.status(500).json({ error: error.message || "Failed to initialize payment" });
    }
  });

  app.get("/api/payments/verify/:reference", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { reference } = req.params;
      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
      
      if (!paystackSecretKey) {
        return res.status(500).json({ error: "Payment configuration missing" });
      }

      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      });

      const data = await response.json();
      if (data.status && data.data.status === "success") {
        const { parcelId } = data.data.metadata;
        if (parcelId) {
          await storage.updateParcel(parcelId, { status: "Paid" });
        }
      }

      res.json(data);
    } catch (error: any) {
      console.error("Paystack verification error:", error);
      res.status(500).json({ error: error.message || "Failed to verify payment" });
    }
  });

  // Paystack webhook endpoint
  app.post("/api/payments/webhook", async (req, res) => {
    try {
      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackSecretKey) {
        console.error("PAYSTACK_SECRET_KEY not configured");
        return res.status(500).json({ error: "Payment configuration missing" });
      }

      const hash = createHmac("sha512", paystackSecretKey).update(JSON.stringify(req.body)).digest("hex");
      
      if (hash !== req.headers["x-paystack-signature"]) {
        console.warn("Invalid Paystack webhook signature");
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { event, data } = req.body;
      
      if (event === "charge.success") {
        const { reference, status, metadata } = data;
        
        // Update payment record
        const payment = await storage.getPaymentByReference(reference);
        if (payment) {
          await storage.updatePayment(payment.id, { status: "success" });
          
          // Update parcel status
          if (metadata?.parcelId) {
            await storage.updateParcel(metadata.parcelId, { status: "Paid" });
          }
        }
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get payment history for authenticated user
  app.get("/api/payments/history", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const payments = await storage.getPaymentsByUserId(req.user!.uid);
      res.json(payments);
    } catch (error: any) {
      console.error("Failed to fetch payment history:", error);
      res.status(500).json({ error: error.message || "Failed to fetch payment history" });
    }
  });

  // Generate receipt for payment
  app.get("/api/payments/:paymentId/receipt", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const payment = await db.select().from(payments).where(eq(payments.id, req.params.paymentId));
      if (!payment.length) {
        return res.status(404).json({ error: "Payment not found" });
      }

      const paymentRecord = payment[0];
      if (paymentRecord.userId !== req.user!.uid) {
        return res.status(403).json({ error: "Not authorized to view this receipt" });
      }

      const parcelData = await storage.getParcel(paymentRecord.parcelId);
      const userData = await storage.getUser(req.user!.uid);

      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Receipt</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .receipt { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007AFF; padding-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; color: #333; }
            .header p { margin: 5px 0 0 0; color: #666; font-size: 14px; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: 600; color: #333; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; color: #666; }
            .row { display: flex; justify-content: space-between; margin: 8px 0; }
            .label { color: #666; font-size: 14px; }
            .value { color: #333; font-weight: 500; font-size: 14px; font-family: monospace; }
            .divider { height: 1px; background: #eee; margin: 15px 0; }
            .total-section { background: #f9f9f9; padding: 15px; border-radius: 6px; margin-top: 20px; }
            .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; color: #007AFF; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
            .footer p { margin: 5px 0; color: #999; font-size: 12px; }
            .status-success { color: #34C759; }
            .status-pending { color: #FF9500; }
            .status-failed { color: #FF3B30; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>Payment Receipt</h1>
              <p>ParcelPeer</p>
            </div>

            <div class="section">
              <div class="section-title">Transaction Details</div>
              <div class="row">
                <span class="label">Reference:</span>
                <span class="value">${paymentRecord.reference}</span>
              </div>
              <div class="row">
                <span class="label">Status:</span>
                <span class="value status-${paymentRecord.status || 'pending'}">${(paymentRecord.status || 'pending').toUpperCase()}</span>
              </div>
              <div class="row">
                <span class="label">Date:</span>
                <span class="value">${new Date(paymentRecord.createdAt || new Date()).toLocaleDateString()}</span>
              </div>
            </div>

            <div class="divider"></div>

            <div class="section">
              <div class="section-title">Parcel Information</div>
              <div class="row">
                <span class="label">Parcel ID:</span>
                <span class="value">${paymentRecord.parcelId}</span>
              </div>
              <div class="row">
                <span class="label">From:</span>
                <span class="value">${parcelData?.origin || 'N/A'}</span>
              </div>
              <div class="row">
                <span class="label">To:</span>
                <span class="value">${parcelData?.destination || 'N/A'}</span>
              </div>
            </div>

            <div class="divider"></div>

            <div class="section">
              <div class="section-title">Amount Breakdown</div>
              <div class="row">
                <span class="label">Base Amount:</span>
                <span class="value">₦${paymentRecord.amount.toLocaleString()}</span>
              </div>
              <div class="row">
                <span class="label">Platform Fee (3%):</span>
                <span class="value">₦${paymentRecord.platformFee.toLocaleString()}</span>
              </div>
            </div>

            <div class="total-section">
              <div class="total-row">
                <span>Total Paid:</span>
                <span>₦${paymentRecord.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Payment Method</div>
              <div class="row">
                <span class="label">Method:</span>
                <span class="value">${paymentRecord.paymentMethod === "paystack" ? "Paystack Card" : "Cash"}</span>
              </div>
            </div>

            <div class="footer">
              <p>Payer: ${userData?.name || 'Unknown'}</p>
              <p>Email: ${userData?.email || 'N/A'}</p>
              <p style="margin-top: 15px; font-size: 11px;">Generated on ${new Date().toLocaleString()}</p>
              <p style="margin-top: 10px;">Thank you for using ParcelPeer</p>
            </div>
          </div>
        </body>
        </html>
      `;

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(receiptHTML);
    } catch (error: any) {
      console.error("Failed to generate receipt:", error);
      res.status(500).json({ error: error.message || "Failed to generate receipt" });
    }
  });

  // Web fallback for browser payment completion
  app.get("/api/payments/verify-web", async (req, res) => {
    const { reference } = req.query;
    res.send(`
      <html>
        <body>
          <h1>Payment Processing</h1>
          <p>Your payment is being verified. You can close this window.</p>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `);
  });

  app.post("/api/routes", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Normalize date strings to Date objects (allow clients to send ISO strings)
      const body: any = { ...req.body };
      if (typeof body.departureDate === 'string') body.departureDate = new Date(body.departureDate);
      if (typeof body.recurrenceEndDate === 'string' && body.recurrenceEndDate) body.recurrenceEndDate = new Date(body.recurrenceEndDate);

      const parsed = insertRouteSchema.safeParse({
        ...body,
        carrierId: req.user!.uid,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const routeData = { ...parsed.data };

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
          routeData.originLat = parseFloat(originGeo[0].lat);
          routeData.originLng = parseFloat(originGeo[0].lon);
        }
        if (destGeo[0]) {
          routeData.destinationLat = parseFloat(destGeo[0].lat);
          routeData.destinationLng = parseFloat(destGeo[0].lon);
        }
      } catch (geoError) {
        console.warn("Geocoding failed, continuing without coordinates:", geoError);
      }

      const route = await storage.createRoute(routeData);
      res.status(201).json(route);
    } catch (error) {
      console.error("Failed to create route:", error);
      res.status(500).json({ error: "Failed to create route" });
    }
  });

  app.patch("/api/routes/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const existingRoute = await storage.getRoute(req.params.id);
      if (!existingRoute) {
        return res.status(404).json({ error: "Route not found" });
      }
      if (existingRoute.carrierId !== req.user!.uid) {
        return res.status(403).json({ error: "Not authorized to update this route" });
      }

      const route = await storage.updateRoute(req.params.id, req.body);
      res.json(route);
    } catch (error) {
      console.error("Failed to update route:", error);
      res.status(500).json({ error: "Failed to update route" });
    }
  });

  app.delete("/api/routes/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const existingRoute = await storage.getRoute(req.params.id);
      if (!existingRoute) {
        return res.status(404).json({ error: "Route not found" });
      }
      if (existingRoute.carrierId !== req.user!.uid) {
        return res.status(403).json({ error: "Not authorized to delete this route" });
      }

      const deleted = await storage.deleteRoute(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Route not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete route:", error);
      res.status(500).json({ error: "Failed to delete route" });
    }
  });

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const SIZE_ORDER = { small: 1, medium: 2, large: 3 };

  app.get("/api/routes/:routeId/matching-parcels", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const route = await storage.getRoute(req.params.routeId);
      if (!route) {
        return res.status(404).json({ error: "Route not found" });
      }

      const pendingParcels = await db
        .select({ parcel: parcels, sender: users })
        .from(parcels)
        .innerJoin(users, eq(parcels.senderId, users.id))
        .where(and(
          eq(parcels.status, "Pending"),
          ne(parcels.senderId, req.user!.uid)
        ));

      const maxDistanceKm = 50;
      const matchingParcels = pendingParcels
        .filter(({ parcel }) => {
          if (!route.originLat || !route.originLng || !route.destinationLat || !route.destinationLng) {
            return parcel.origin.toLowerCase().includes(route.origin.toLowerCase()) ||
              route.origin.toLowerCase().includes(parcel.origin.toLowerCase());
          }
          if (!parcel.originLat || !parcel.originLng || !parcel.destinationLat || !parcel.destinationLng) {
            return parcel.origin.toLowerCase().includes(route.origin.toLowerCase()) ||
              route.origin.toLowerCase().includes(parcel.origin.toLowerCase());
          }

          const originDistance = calculateDistance(
            route.originLat, route.originLng,
            parcel.originLat, parcel.originLng
          );
          const destDistance = calculateDistance(
            route.destinationLat, route.destinationLng,
            parcel.destinationLat, parcel.destinationLng
          );

          return originDistance <= maxDistanceKm && destDistance <= maxDistanceKm;
        })
        .filter(({ parcel }) => {
          const routeDate = new Date(route.departureDate);
          const parcelDate = new Date(parcel.pickupDate);
          const daysDiff = Math.abs((routeDate.getTime() - parcelDate.getTime()) / (1000 * 60 * 60 * 24));

          if (route.frequency === "one_time") {
            return daysDiff <= 2;
          } else if (route.frequency === "daily") {
            return true;
          } else if (route.frequency === "weekly") {
            return daysDiff <= 7;
          } else {
            return daysDiff <= 30;
          }
        })
        .filter(({ parcel }) => {
          if (!route.maxParcelSize) return true;
          return SIZE_ORDER[parcel.size] <= SIZE_ORDER[route.maxParcelSize];
        })
        .filter(({ parcel }) => {
          if (!route.maxWeight || !parcel.weight) return true;
          return parcel.weight <= route.maxWeight;
        })
        .map(({ parcel, sender }) => {
          let score = 100;

          if (route.originLat && route.originLng && parcel.originLat && parcel.originLng) {
            const originDistance = calculateDistance(
              route.originLat, route.originLng,
              parcel.originLat, parcel.originLng
            );
            score -= originDistance;
          }

          return {
            ...parcel,
            senderName: sender.name,
            senderRating: sender.rating,
            matchScore: Math.max(0, Math.round(score)),
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore);

      res.json(matchingParcels);
    } catch (error) {
      console.error("Failed to find matching parcels:", error);
      res.status(500).json({ error: "Failed to find matching parcels" });
    }
  });

  app.get("/api/parcels/:parcelId/matching-routes", async (req, res) => {
    try {
      const parcel = await storage.getParcel(req.params.parcelId);
      if (!parcel) {
        return res.status(404).json({ error: "Parcel not found" });
      }

      const activeRoutes = await db
        .select({ route: routes, carrier: users })
        .from(routes)
        .innerJoin(users, eq(routes.carrierId, users.id))
        .where(and(
          eq(routes.status, "Active"),
          ne(routes.carrierId, parcel.senderId)
        ));

      const maxDistanceKm = 50;
      const matchingRoutes = activeRoutes
        .filter(({ route }) => {
          if (!route.originLat || !route.originLng || !route.destinationLat || !route.destinationLng) {
            return parcel.origin.toLowerCase().includes(route.origin.toLowerCase()) ||
              route.origin.toLowerCase().includes(parcel.origin.toLowerCase());
          }
          if (!parcel.originLat || !parcel.originLng || !parcel.destinationLat || !parcel.destinationLng) {
            return parcel.origin.toLowerCase().includes(route.origin.toLowerCase()) ||
              route.origin.toLowerCase().includes(parcel.origin.toLowerCase());
          }

          const originDistance = calculateDistance(
            route.originLat, route.originLng,
            parcel.originLat, parcel.originLng
          );
          const destDistance = calculateDistance(
            route.destinationLat, route.destinationLng,
            parcel.destinationLat, parcel.destinationLng
          );

          return originDistance <= maxDistanceKm && destDistance <= maxDistanceKm;
        })
        .filter(({ route }) => {
          const routeDate = new Date(route.departureDate);
          const parcelDate = new Date(parcel.pickupDate);
          const daysDiff = Math.abs((routeDate.getTime() - parcelDate.getTime()) / (1000 * 60 * 60 * 24));

          if (route.frequency === "one_time") {
            return daysDiff <= 2;
          } else if (route.frequency === "daily") {
            return true;
          } else if (route.frequency === "weekly") {
            return daysDiff <= 7;
          } else {
            return daysDiff <= 30;
          }
        })
        .filter(({ route }) => {
          if (!route.maxParcelSize) return true;
          return SIZE_ORDER[parcel.size] <= SIZE_ORDER[route.maxParcelSize];
        })
        .filter(({ route }) => {
          if (!route.maxWeight || !parcel.weight) return true;
          return parcel.weight <= route.maxWeight;
        })
        .map(({ route, carrier }) => {
          let score = 100;

          if (route.originLat && route.originLng && parcel.originLat && parcel.originLng) {
            const originDistance = calculateDistance(
              route.originLat, route.originLng,
              parcel.originLat, parcel.originLng
            );
            score -= originDistance;
          }

          return {
            ...route,
            carrierName: carrier.name,
            carrierRating: carrier.rating,
            matchScore: Math.max(0, Math.round(score)),
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore);

      res.json(matchingRoutes);
    } catch (error) {
      console.error("Failed to find matching routes:", error);
      res.status(500).json({ error: "Failed to find matching routes" });
    }
  });

  app.get("/api/users/:userId/reviews", async (req, res) => {
    try {
      const userReviews = await storage.getUserReviews(req.params.userId);
      res.json(userReviews);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = insertReviewSchema.safeParse({
        ...req.body,
        reviewerId: req.user!.uid,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }

      const existing = await storage.getReviewByParcelAndReviewer(
        parsed.data.parcelId,
        req.user!.uid
      );
      if (existing) {
        return res.status(409).json({ error: "You have already reviewed this delivery" });
      }

      const parcel = await storage.getParcel(parsed.data.parcelId);
      if (!parcel) {
        return res.status(404).json({ error: "Parcel not found" });
      }
      if (parcel.status !== "Delivered") {
        return res.status(400).json({ error: "Can only review delivered parcels" });
      }

      const review = await storage.createReview(parsed.data);

      const revieweeTokens = await storage.getUserPushTokens(parsed.data.revieweeId);
      if (revieweeTokens.length > 0) {
        console.log(`Would send notification to ${revieweeTokens.length} devices for new review`);
      }

      res.status(201).json(review);
    } catch (error) {
      console.error("Failed to create review:", error);
      res.status(500).json({ error: "Failed to create review" });
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

      const pushToken = await storage.createOrUpdatePushToken(parsed.data);
      res.status(201).json(pushToken);
    } catch (error) {
      console.error("Failed to save push token:", error);
      res.status(500).json({ error: "Failed to save push token" });
    }
  });

  app.delete("/api/push-tokens/:token", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const deleted = await storage.deletePushToken(req.params.token);
      if (!deleted) {
        return res.status(404).json({ error: "Push token not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete push token:", error);
      res.status(500).json({ error: "Failed to delete push token" });
    }
  });

  async function checkAndExpireItems() {
    const now = new Date();
    
    try {
      const capacityFullRoutes = await db
        .update(routes)
        .set({ status: "Expired", updatedAt: now })
        .where(and(
          eq(routes.status, "Active"),
          sql`${routes.availableCapacity} IS NOT NULL AND ${routes.capacityUsed} >= ${routes.availableCapacity}`
        ))
        .returning();
      
      if (capacityFullRoutes.length > 0) {
        console.log(`Expired ${capacityFullRoutes.length} routes due to full capacity`);
      }
      
      const routesToExpire = await db
        .select()
        .from(routes)
        .where(and(
          eq(routes.status, "Active"),
          lte(routes.departureDate, now)
        ));
      
      const expiredRoutes = await db
        .update(routes)
        .set({ status: "Expired", updatedAt: now })
        .where(and(
          eq(routes.status, "Active"),
          lte(routes.departureDate, now)
        ))
        .returning();
      
      for (const expiredRoute of expiredRoutes) {
        if (expiredRoute.frequency && expiredRoute.frequency !== "one_time") {
          const shouldCreateNext = !expiredRoute.recurrenceEndDate || 
            new Date(expiredRoute.recurrenceEndDate) > now;
          
          if (shouldCreateNext) {
            const nextDate = new Date(expiredRoute.departureDate);
            switch (expiredRoute.frequency) {
              case "daily":
                nextDate.setDate(nextDate.getDate() + 1);
                break;
              case "weekly":
                nextDate.setDate(nextDate.getDate() + 7);
                break;
              case "monthly":
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            }
            
            if (!expiredRoute.recurrenceEndDate || nextDate <= new Date(expiredRoute.recurrenceEndDate)) {
              await db.insert(routes).values({
                carrierId: expiredRoute.carrierId,
                origin: expiredRoute.origin,
                destination: expiredRoute.destination,
                originLat: expiredRoute.originLat,
                originLng: expiredRoute.originLng,
                destinationLat: expiredRoute.destinationLat,
                destinationLng: expiredRoute.destinationLng,
                intermediateStops: expiredRoute.intermediateStops,
                departureDate: nextDate,
                departureTime: expiredRoute.departureTime,
                frequency: expiredRoute.frequency,
                recurrenceEndDate: expiredRoute.recurrenceEndDate,
                maxParcelSize: expiredRoute.maxParcelSize,
                maxWeight: expiredRoute.maxWeight,
                availableCapacity: expiredRoute.availableCapacity,
                capacityUsed: 0,
                pricePerKg: expiredRoute.pricePerKg,
                notes: expiredRoute.notes,
                parentRouteId: expiredRoute.parentRouteId || expiredRoute.id,
              });
              console.log(`Created next occurrence for recurring route ${expiredRoute.id}`);
            }
          }
        }
      }
      
      const expiredParcels = await db
        .update(parcels)
        .set({ status: "Expired" })
        .where(and(
          eq(parcels.status, "Pending"),
          lte(parcels.expiresAt, now)
        ))
        .returning();
      
      if (expiredRoutes.length > 0 || expiredParcels.length > 0) {
        console.log(`Expiry check: ${expiredRoutes.length} routes, ${expiredParcels.length} parcels expired`);
      }
    } catch (error) {
      console.error("Expiry check failed:", error);
    }
  }

  app.post("/api/admin/check-expiry", async (req, res) => {
    try {
      await checkAndExpireItems();
      res.json({ success: true, message: "Expiry check completed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to run expiry check" });
    }
  });

  app.get("/api/parcels/:parcelId/messages", async (req, res) => {
    try {
      const msgs = await db
        .select({ id: parcelMessages.id, parcelId: parcelMessages.parcelId, senderId: parcelMessages.senderId, senderName: users.name, senderRole: parcelMessages.senderRole, content: parcelMessages.content, createdAt: parcelMessages.createdAt })
        .from(parcelMessages)
        .innerJoin(users, eq(parcelMessages.senderId, users.id))
        .where(eq(parcelMessages.parcelId, req.params.parcelId))
        .orderBy(parcelMessages.createdAt);
      res.json(msgs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/parcels/:parcelId/messages", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const parcel = await storage.getParcel(req.params.parcelId);
      if (!parcel) {
        return res.status(404).json({ error: "Parcel not found" });
      }

      // Verify user has permission to send messages (must be sender, carrier, or receiver)
      const userId = req.user!.uid;
      const userEmail = req.user!.email;
      const isParticipant = 
        userId === parcel.senderId || 
        userId === parcel.transporterId || 
        userId === parcel.receiverId ||
        (userEmail && parcel.receiverEmail && userEmail.toLowerCase() === parcel.receiverEmail.toLowerCase());

      if (!isParticipant) {
        return res.status(403).json({ error: "You don't have permission to send messages for this parcel" });
      }

      const parsed = insertParcelMessageSchema.safeParse({
        parcelId: req.params.parcelId,
        senderId: req.user!.uid,
        content: req.body.content,
        senderRole: req.body.senderRole,
      });
      if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });
      const msg = await db.insert(parcelMessages).values(parsed.data).returning();
      
      // Get sender info to return complete message
      const sender = await storage.getUser(req.user!.uid);
      const completeMsg = {
        ...msg[0],
        senderName: sender?.name || "Unknown",
      };
      
      res.json(completeMsg);
    } catch (error) {
      console.error("Failed to send message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.get("/api/parcels/:parcelId/carrier-location", async (req, res) => {
    try {
      const loc = await db.select().from(carrierLocations).where(eq(carrierLocations.parcelId, req.params.parcelId)).orderBy(desc(carrierLocations.timestamp)).limit(1);
      res.json(loc[0] || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch carrier location" });
    }
  });

  app.post("/api/parcels/:parcelId/carrier-location", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = insertCarrierLocationSchema.safeParse({
        parcelId: req.params.parcelId,
        carrierId: req.user!.uid,
        lat: req.body.lat,
        lng: req.body.lng,
        heading: req.body.heading,
        speed: req.body.speed,
        accuracy: req.body.accuracy,
      });
      if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });
      const loc = await db.insert(carrierLocations).values(parsed.data).returning();
      res.json(loc[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to save carrier location" });
    }
  });

  app.get("/api/parcels/:parcelId/receiver-location", async (req, res) => {
    try {
      const loc = await db.select().from(receiverLocations).where(eq(receiverLocations.parcelId, req.params.parcelId)).orderBy(desc(receiverLocations.timestamp)).limit(1);
      res.json(loc[0] || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch receiver location" });
    }
  });

  app.post("/api/parcels/:parcelId/receiver-location", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = insertReceiverLocationSchema.safeParse({
        parcelId: req.params.parcelId,
        receiverId: req.user!.uid,
        lat: req.body.lat,
        lng: req.body.lng,
        accuracy: req.body.accuracy,
      });
      if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });
      const loc = await db.insert(receiverLocations).values(parsed.data).returning();
      res.json(loc[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to save receiver location" });
    }
  });

  checkAndExpireItems();
  setInterval(checkAndExpireItems, 60 * 60 * 1000);

  // Register receiver enhancements
  registerReceiverEnhancements(app);

  const httpServer = createServer(app);

  return httpServer;
}
