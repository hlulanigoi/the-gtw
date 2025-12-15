import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage, db } from "./storage";
import { users, parcels, conversations, messages, connections, insertParcelSchema, insertMessageSchema, insertConnectionSchema } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, optionalAuth, type AuthenticatedRequest } from "./firebase-admin";

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

  app.post("/api/parcels", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = insertParcelSchema.safeParse({
        ...req.body,
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
      res.status(201).json(parcel);
    } catch (error) {
      console.error("Failed to create parcel:", error);
      res.status(500).json({ error: "Failed to create parcel" });
    }
  });

  app.patch("/api/parcels/:id", async (req, res) => {
    try {
      const parcel = await storage.updateParcel(req.params.id, req.body);
      if (!parcel) {
        return res.status(404).json({ error: "Parcel not found" });
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

  app.post("/api/users", async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      console.error("Failed to create user:", error);
      res.status(500).json({ error: "Failed to create user" });
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

  const httpServer = createServer(app);

  return httpServer;
}
