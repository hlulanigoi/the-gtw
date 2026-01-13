import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage, db } from "./storage";
import { users, parcels, conversations, messages, connections, routes, reviews, pushTokens, payments, subscriptions, insertParcelSchema, insertMessageSchema, insertConnectionSchema, insertRouteSchema, insertReviewSchema, insertPushTokenSchema } from "@shared/schema";
import { eq, desc, and, gte, lte, ne, sql } from "drizzle-orm";
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
import crypto from "crypto";
import logger from "./logger";

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

  // Paystack Payment Integration
  app.post("/api/payments/initialize", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { parcelId, carrierId } = req.body;
      
      if (!parcelId || !carrierId) {
        return res.status(400).json({ error: "Parcel ID and carrier ID are required" });
      }

      const parcel = await storage.getParcel(parcelId);
      if (!parcel) {
        return res.status(404).json({ error: "Parcel not found" });
      }

      if (parcel.senderId !== req.user!.uid) {
        return res.status(403).json({ error: "Only the sender can initiate payment" });
      }

      const user = await storage.getUser(req.user!.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const amount = parcel.compensation;
      
      // Calculate platform fee based on user's subscription tier
      const { platformFee, carrierAmount, platformFeePercentage } = calculatePlatformFee(
        amount,
        user.subscriptionTier || "free"
      );

      const metadata = {
        parcelId,
        senderId: req.user!.uid,
        carrierId,
        parcelOrigin: parcel.origin,
        parcelDestination: parcel.destination,
        platformFee,
        carrierAmount,
        platformFeePercentage,
      };

      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to kobo/cents
          email: user.email,
          metadata,
        }),
      });

      const data = await response.json();
      if (!data.status) {
        throw new Error(data.message || "Failed to initialize Paystack transaction");
      }

      const payment = await storage.createPayment({
        parcelId,
        senderId: req.user!.uid,
        carrierId,
        amount,
        carrierAmount,
        platformFee,
        platformFeePercentage,
        currency: "NGN",
        status: "pending",
        paystackReference: data.data.reference,
        paystackAccessCode: data.data.access_code,
        paystackAuthorizationUrl: data.data.authorization_url,
        metadata: JSON.stringify(metadata),
      });

      res.json({
        ...data.data,
        paymentId: payment.id,
        platformFee,
        carrierAmount,
      });
    } catch (error: any) {
      console.error("Paystack initialization error:", error);
      res.status(500).json({ error: error.message || "Failed to initialize payment" });
    }
  });

  app.get("/api/payments/verify/:reference", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { reference } = req.params;
      
      if (data.status && data.data.status === "success") {
        await storage.updatePayment(payment.id, {
          status: "success",
          paidAt: new Date(),
        });

        await storage.updateParcel(payment.parcelId, {
          transporterId: payment.carrierId,
          status: "In Transit",
        });

        res.json({
          success: true,
          payment: await storage.getPayment(payment.id),
          message: "Payment successful",
        });
      } else {
        await storage.updatePayment(payment.id, {
          status: data.data.status === "failed" ? "failed" : "pending",
        });

        res.json({
          success: false,
          payment: await storage.getPayment(payment.id),
          message: data.message || "Payment not successful",
        });
      }
    } catch (error: any) {
      console.error("Paystack verification error:", error);
      res.status(500).json({ error: error.message || "Failed to verify payment" });
    }
  });

  app.get("/api/payments/user/:userId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.params.userId !== req.user!.uid) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const payments = await storage.getUserPayments(req.params.userId);
      res.json(payments);
    } catch (error) {
      console.error("Failed to fetch user payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/parcel/:parcelId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const parcel = await storage.getParcel(req.params.parcelId);
      if (!parcel) {
        return res.status(404).json({ error: "Parcel not found" });
      }

      const isAuthorized = parcel.senderId === req.user!.uid || parcel.transporterId === req.user!.uid;
      if (!isAuthorized) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const payment = await storage.getParcelPayment(req.params.parcelId);
      res.json(payment || null);
    } catch (error) {
      console.error("Failed to fetch parcel payment:", error);
      res.status(500).json({ error: "Failed to fetch payment" });
    }
  });

  // Web fallback for callback_url
  app.get("/api/payments/verify-web", async (req, res) => {
    const { trxref, reference } = req.query;
    res.send(`
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
              padding: 20px;
            }
            .container {
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            h1 { margin-top: 0; font-size: 28px; }
            p { font-size: 16px; opacity: 0.9; }
            .spinner {
              border: 3px solid rgba(255, 255, 255, 0.3);
              border-top: 3px solid white;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 20px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Payment Processing</h1>
            <div class="spinner"></div>
            <p>Verifying your payment...</p>
            <p style="font-size: 14px; margin-top: 30px;">You can close this window and return to the app.</p>
          </div>
          <script>
            setTimeout(() => {
              if (window.opener) {
                window.close();
              } else {
                window.location.href = 'about:blank';
              }
            }, 3000);
          </script>
        </body>
      </html>
    `);
  });

  app.post("/api/routes", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = insertRouteSchema.safeParse({
        ...req.body,
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

  // ============ PHOTO VERIFICATION ROUTES ============
  app.post("/api/parcels/:id/photos/upload", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { photoData, photoType, caption, latitude, longitude } = req.body;

      if (!photoData || !photoType) {
        return res.status(400).json({ error: "Photo data and type are required" });
      }

      const parcel = await storage.getParcel(id);
      if (!parcel) {
        return res.status(404).json({ error: "Parcel not found" });
      }

      // Verify user is authorized
      if (
        parcel.senderId !== req.user!.uid &&
        parcel.transporterId !== req.user!.uid
      ) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Upload photo to Firebase Storage
      const { uploadPhoto } = await import("./firebase-storage");
      const uploadResult = await uploadPhoto(photoData, `parcels/${id}/${photoType}`);

      // Save photo record
      const photo = await storage.createParcelPhoto({
        parcelId: id,
        uploadedBy: req.user!.uid,
        photoUrl: uploadResult.url,
        photoType,
        caption: caption || null,
        latitude: latitude || null,
        longitude: longitude || null,
      });

      // Update parcel with photo URL if it's pickup or delivery photo
      if (photoType === "pickup") {
        await storage.updateParcel(id, {
          pickupPhotoUrl: uploadResult.url,
          pickupPhotoTimestamp: new Date(),
        });
      } else if (photoType === "delivery") {
        await storage.updateParcel(id, {
          deliveryPhotoUrl: uploadResult.url,
          deliveryPhotoTimestamp: new Date(),
          status: "Delivered",
        });
      }

      res.json(photo);
    } catch (error) {
      console.error("Photo upload error:", error);
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });

  app.get("/api/parcels/:id/photos", async (req, res) => {
    try {
      const { id } = req.params;
      const { type } = req.query;

      let photos;
      if (type) {
        photos = await storage.getParcelPhotosByType(id, type as string);
      } else {
        photos = await storage.getParcelPhotos(id);
      }

      res.json(photos);
    } catch (error) {
      console.error("Failed to fetch photos:", error);
      res.status(500).json({ error: "Failed to fetch photos" });
    }
  });

  // ============ REAL-TIME TRACKING ROUTES ============
  app.post("/api/parcels/:id/location", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { latitude, longitude, accuracy, speed, heading } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }

      const parcel = await storage.getParcel(id);
      if (!parcel) {
        return res.status(404).json({ error: "Parcel not found" });
      }

      // Only transporter can update location
      if (parcel.transporterId !== req.user!.uid) {
        return res.status(403).json({ error: "Only the transporter can update location" });
      }

      // Verify parcel is in transit
      if (parcel.status !== "In Transit") {
        return res.status(400).json({ error: "Parcel must be in transit to update location" });
      }

      // Save location history
      const locationRecord = await storage.createLocationHistory({
        parcelId: id,
        transporterId: req.user!.uid,
        latitude,
        longitude,
        accuracy: accuracy || null,
        speed: speed || null,
        heading: heading || null,
      });

      // Update parcel's current location
      await storage.updateParcel(id, {
        currentLat: latitude,
        currentLng: longitude,
        lastLocationUpdate: new Date(),
      });

      res.json(locationRecord);
    } catch (error) {
      console.error("Location update error:", error);
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  app.get("/api/parcels/:id/location/history", async (req, res) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const history = await storage.getParcelLocationHistory(id, limit);
      res.json(history);
    } catch (error) {
      console.error("Failed to fetch location history:", error);
      res.status(500).json({ error: "Failed to fetch location history" });
    }
  });

  app.get("/api/parcels/:id/location/current", async (req, res) => {
    try {
      const { id } = req.params;
      const location = await storage.getLatestLocation(id);
      
      if (!location) {
        return res.status(404).json({ error: "No location data available" });
      }

      res.json(location);
    } catch (error) {
      console.error("Failed to fetch current location:", error);
      res.status(500).json({ error: "Failed to fetch current location" });
    }
  });

  // ============ WALLET ROUTES ============
  app.get("/api/wallet/balance", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ balance: user.walletBalance || 0 });
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
      res.status(500).json({ error: "Failed to fetch wallet balance" });
    }
  });

  app.get("/api/wallet/transactions", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getUserWalletTransactions(req.user!.uid, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/wallet/topup", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { amount } = req.body;

      if (!amount || amount < 50000) { // Minimum ₦500
        return res.status(400).json({ error: "Minimum top-up amount is ₦500" });
      }

      const user = await storage.getUser(req.user!.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Initialize Paystack payment
      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackSecretKey) {
        return res.status(500).json({ error: "Payment service not configured" });
      }

      const reference = `wallet_topup_${Date.now()}_${req.user!.uid}`;

      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: amount,
          reference: reference,
          metadata: {
            userId: user.id,
            type: "wallet_topup",
          },
        }),
      });

      const data = await response.json();

      if (!data.status) {
        return res.status(400).json({ error: data.message || "Payment initialization failed" });
      }

      res.json({
        authorizationUrl: data.data.authorization_url,
        accessCode: data.data.access_code,
        reference: data.data.reference,
      });
    } catch (error) {
      console.error("Wallet top-up error:", error);
      res.status(500).json({ error: "Failed to initialize top-up" });
    }
  });

  app.post("/api/wallet/topup/verify/:reference", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { reference } = req.params;

      // Check if already processed
      const existing = await storage.getWalletTransactionByPaystackReference(reference);
      if (existing) {
        return res.json({ message: "Top-up already processed", transaction: existing });
      }

      // Verify with Paystack
      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      });

      const data = await response.json();

      if (!data.status || data.data.status !== "success") {
        return res.status(400).json({ error: "Payment verification failed" });
      }

      const user = await storage.getUser(req.user!.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const amount = data.data.amount;
      const currentBalance = user.walletBalance || 0;
      const newBalance = currentBalance + amount;

      // Create wallet transaction
      const transaction = await storage.createWalletTransaction({
        userId: user.id,
        amount: amount,
        type: "topup",
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: "Wallet top-up",
        reference: reference,
        paystackReference: reference,
      });

      res.json({ message: "Top-up successful", transaction, balance: newBalance });
    } catch (error) {
      console.error("Top-up verification error:", error);
      res.status(500).json({ error: "Failed to verify top-up" });
    }
  });

  // ============ INSURANCE ROUTES ============
  app.get("/api/insurance/tiers", async (req, res) => {
    try {
      const { INSURANCE_TIERS } = await import("./insurance-utils");
      res.json(INSURANCE_TIERS);
    } catch (error) {
      console.error("Failed to fetch insurance tiers:", error);
      res.status(500).json({ error: "Failed to fetch insurance tiers" });
    }
  });

  app.post("/api/insurance/calculate", async (req, res) => {
    try {
      const { declaredValue } = req.body;

      if (!declaredValue || declaredValue <= 0) {
        return res.status(400).json({ error: "Valid declared value is required" });
      }

      const { calculateInsurance } = await import("./insurance-utils");
      const result = calculateInsurance(declaredValue);

      res.json(result);
    } catch (error) {
      console.error("Insurance calculation error:", error);
      res.status(500).json({ error: "Failed to calculate insurance" });
    }
  });

  // ============ DISPUTE ROUTES ============
  app.post("/api/disputes", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { parcelId, respondentId, subject, description } = req.body;

      if (!parcelId || !respondentId || !subject || !description) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const parcel = await storage.getParcel(parcelId);
      if (!parcel) {
        return res.status(404).json({ error: "Parcel not found" });
      }

      // Verify user is involved in the parcel
      if (
        parcel.senderId !== req.user!.uid &&
        parcel.transporterId !== req.user!.uid
      ) {
        return res.status(403).json({ error: "You must be involved in this parcel to create a dispute" });
      }

      const dispute = await storage.createDispute({
        parcelId,
        complainantId: req.user!.uid,
        respondentId,
        subject,
        description,
      });

      res.json(dispute);
    } catch (error) {
      console.error("Dispute creation error:", error);
      res.status(500).json({ error: "Failed to create dispute" });
    }
  });

  app.get("/api/disputes/me", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const disputes = await storage.getUserDisputes(req.user!.uid);
      res.json(disputes);
    } catch (error) {
      console.error("Failed to fetch disputes:", error);
      res.status(500).json({ error: "Failed to fetch disputes" });
    }
  });

  app.get("/api/disputes/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const dispute = await storage.getDispute(id);

      if (!dispute) {
        return res.status(404).json({ error: "Dispute not found" });
      }

      // Verify user is involved
      if (
        dispute.complainantId !== req.user!.uid &&
        dispute.respondentId !== req.user!.uid
      ) {
        const user = await storage.getUser(req.user!.uid);
        if (user?.role !== "admin") {
          return res.status(403).json({ error: "Not authorized" });
        }
      }

      res.json(dispute);
    } catch (error) {
      console.error("Failed to fetch dispute:", error);
      res.status(500).json({ error: "Failed to fetch dispute" });
    }
  });

  app.get("/api/disputes/:id/messages", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const dispute = await storage.getDispute(id);

      if (!dispute) {
        return res.status(404).json({ error: "Dispute not found" });
      }

      // Verify user is involved
      if (
        dispute.complainantId !== req.user!.uid &&
        dispute.respondentId !== req.user!.uid
      ) {
        const user = await storage.getUser(req.user!.uid);
        if (user?.role !== "admin") {
          return res.status(403).json({ error: "Not authorized" });
        }
      }

      const messages = await storage.getDisputeMessages(id);
      res.json(messages);
    } catch (error) {
      console.error("Failed to fetch dispute messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/disputes/:id/messages", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { message, attachmentUrl } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const dispute = await storage.getDispute(id);
      if (!dispute) {
        return res.status(404).json({ error: "Dispute not found" });
      }

      // Verify user is involved
      const user = await storage.getUser(req.user!.uid);
      const isAdmin = user?.role === "admin";
      
      if (
        !isAdmin &&
        dispute.complainantId !== req.user!.uid &&
        dispute.respondentId !== req.user!.uid
      ) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const disputeMessage = await storage.createDisputeMessage({
        disputeId: id,
        senderId: req.user!.uid,
        message,
        attachmentUrl: attachmentUrl || null,
        isAdminMessage: isAdmin,
      });

      res.json(disputeMessage);
    } catch (error) {
      console.error("Failed to send dispute message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.post("/api/admin/check-expiry", async (req, res) => {
    try {
      await checkAndExpireItems();
      res.json({ success: true, message: "Expiry check completed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to run expiry check" });
    }
  });

  checkAndExpireItems();
  setInterval(checkAndExpireItems, 60 * 60 * 1000);

  const httpServer = createServer(app);

  return httpServer;
}
