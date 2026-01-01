import type { Express } from "express";
import { db, storage } from "./storage";
import { users, parcels, routes, payments, reviews, conversations, messages } from "@shared/schema";
import { eq, desc, count, sql, and, gte, lte, ilike, or } from "drizzle-orm";
import { requireAdmin, type AuthenticatedRequest } from "./firebase-admin";

export function registerAdminRoutes(app: Express) {
  // Dashboard Statistics
  app.get("/api/admin/stats", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const [
        totalUsers,
        totalParcels,
        totalRoutes,
        totalPayments,
        pendingParcels,
        activeRoutes,
        successfulPayments,
        recentUsers,
      ] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(parcels),
        db.select({ count: count() }).from(routes),
        db.select({ count: count() }).from(payments),
        db.select({ count: count() }).from(parcels).where(eq(parcels.status, "Pending")),
        db.select({ count: count() }).from(routes).where(eq(routes.status, "Active")),
        db
          .select({ sum: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
          .from(payments)
          .where(eq(payments.status, "success")),
        db.select({ count: count() }).from(users).where(gte(users.createdAt, sql`NOW() - INTERVAL '30 days'`)),
      ]);

      const revenue = successfulPayments[0]?.sum || 0;

      // Get parcel status breakdown
      const parcelStatusCounts = await db
        .select({
          status: parcels.status,
          count: count(),
        })
        .from(parcels)
        .groupBy(parcels.status);

      // Get payment status breakdown
      const paymentStatusCounts = await db
        .select({
          status: payments.status,
          count: count(),
        })
        .from(payments)
        .groupBy(payments.status);

      res.json({
        users: {
          total: totalUsers[0]?.count || 0,
          recent: recentUsers[0]?.count || 0,
        },
        parcels: {
          total: totalParcels[0]?.count || 0,
          pending: pendingParcels[0]?.count || 0,
          statusBreakdown: parcelStatusCounts,
        },
        routes: {
          total: totalRoutes[0]?.count || 0,
          active: activeRoutes[0]?.count || 0,
        },
        payments: {
          total: totalPayments[0]?.count || 0,
          revenue: revenue,
          statusBreakdown: paymentStatusCounts,
        },
      });
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // User Management
  app.get("/api/admin/users", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { search, role, verified, suspended, page = "1", limit = "20" } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      let query = db.select().from(users);
      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(users.name, `%${search}%`),
            ilike(users.email, `%${search}%`),
            ilike(users.phone, `%${search}%`)
          )
        );
      }

      if (role) {
        conditions.push(eq(users.role, role as any));
      }

      if (verified !== undefined) {
        conditions.push(eq(users.verified, verified === "true"));
      }

      if (suspended !== undefined) {
        conditions.push(eq(users.suspended, suspended === "true"));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const allUsers = await query
        .orderBy(desc(users.createdAt))
        .limit(limitNum)
        .offset(offset);

      const totalCount = await db.select({ count: count() }).from(users);

      res.json({
        users: allUsers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount[0]?.count || 0,
          totalPages: Math.ceil((totalCount[0]?.count || 0) / limitNum),
        },
      });
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/:id", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user statistics
      const [sentParcels, transportedParcels, userRoutes, userReviews] = await Promise.all([
        db.select({ count: count() }).from(parcels).where(eq(parcels.senderId, req.params.id)),
        db.select({ count: count() }).from(parcels).where(eq(parcels.transporterId, req.params.id)),
        db.select({ count: count() }).from(routes).where(eq(routes.carrierId, req.params.id)),
        db.select({ count: count() }).from(reviews).where(eq(reviews.revieweeId, req.params.id)),
      ]);

      res.json({
        ...user,
        stats: {
          sentParcels: sentParcels[0]?.count || 0,
          transportedParcels: transportedParcels[0]?.count || 0,
          routes: userRoutes[0]?.count || 0,
          reviews: userReviews[0]?.count || 0,
        },
      });
    } catch (error) {
      console.error("Failed to fetch user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { verified, suspended, role } = req.body;
      const updates: any = {};

      if (verified !== undefined) updates.verified = verified;
      if (suspended !== undefined) updates.suspended = suspended;
      if (role !== undefined) updates.role = role;

      const result = await db.update(users).set(updates).where(eq(users.id, req.params.id)).returning();

      if (!result[0]) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(result[0]);
    } catch (error) {
      console.error("Failed to update user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Parcel Management
  app.get("/api/admin/parcels", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { status, search, page = "1", limit = "20" } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const conditions = [];

      if (status) {
        conditions.push(eq(parcels.status, status as any));
      }

      if (search) {
        conditions.push(
          or(
            ilike(parcels.origin, `%${search}%`),
            ilike(parcels.destination, `%${search}%`),
            ilike(parcels.description, `%${search}%`)
          )
        );
      }

      let query = db
        .select({
          parcel: parcels,
          sender: users,
        })
        .from(parcels)
        .innerJoin(users, eq(parcels.senderId, users.id));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const allParcels = await query
        .orderBy(desc(parcels.createdAt))
        .limit(limitNum)
        .offset(offset);

      const totalCount = await db.select({ count: count() }).from(parcels);

      const result = allParcels.map(({ parcel, sender }) => ({
        ...parcel,
        senderName: sender.name,
        senderEmail: sender.email,
      }));

      res.json({
        parcels: result,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount[0]?.count || 0,
          totalPages: Math.ceil((totalCount[0]?.count || 0) / limitNum),
        },
      });
    } catch (error) {
      console.error("Failed to fetch parcels:", error);
      res.status(500).json({ error: "Failed to fetch parcels" });
    }
  });

  app.patch("/api/admin/parcels/:id", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const parcel = await storage.updateParcel(req.params.id, req.body);
      if (!parcel) {
        return res.status(404).json({ error: "Parcel not found" });
      }
      res.json(parcel);
    } catch (error) {
      console.error("Failed to update parcel:", error);
      res.status(500).json({ error: "Failed to update parcel" });
    }
  });

  app.delete("/api/admin/parcels/:id", requireAdmin, async (req: AuthenticatedRequest, res) => {
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

  // Route Management
  app.get("/api/admin/routes", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { status, search, page = "1", limit = "20" } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const conditions = [];

      if (status) {
        conditions.push(eq(routes.status, status as any));
      }

      if (search) {
        conditions.push(
          or(
            ilike(routes.origin, `%${search}%`),
            ilike(routes.destination, `%${search}%`)
          )
        );
      }

      let query = db
        .select({
          route: routes,
          carrier: users,
        })
        .from(routes)
        .innerJoin(users, eq(routes.carrierId, users.id));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const allRoutes = await query
        .orderBy(desc(routes.createdAt))
        .limit(limitNum)
        .offset(offset);

      const totalCount = await db.select({ count: count() }).from(routes);

      const result = allRoutes.map(({ route, carrier }) => ({
        ...route,
        carrierName: carrier.name,
        carrierEmail: carrier.email,
      }));

      res.json({
        routes: result,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount[0]?.count || 0,
          totalPages: Math.ceil((totalCount[0]?.count || 0) / limitNum),
        },
      });
    } catch (error) {
      console.error("Failed to fetch routes:", error);
      res.status(500).json({ error: "Failed to fetch routes" });
    }
  });

  app.patch("/api/admin/routes/:id", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const route = await storage.updateRoute(req.params.id, req.body);
      if (!route) {
        return res.status(404).json({ error: "Route not found" });
      }
      res.json(route);
    } catch (error) {
      console.error("Failed to update route:", error);
      res.status(500).json({ error: "Failed to update route" });
    }
  });

  app.delete("/api/admin/routes/:id", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
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

  // Payment Management
  app.get("/api/admin/payments", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { status, page = "1", limit = "20" } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      let query = db
        .select({
          payment: payments,
          sender: users,
        })
        .from(payments)
        .innerJoin(users, eq(payments.senderId, users.id));

      if (status) {
        query = query.where(eq(payments.status, status as any));
      }

      const allPayments = await query
        .orderBy(desc(payments.createdAt))
        .limit(limitNum)
        .offset(offset);

      const totalCount = await db.select({ count: count() }).from(payments);

      const result = allPayments.map(({ payment, sender }) => ({
        ...payment,
        senderName: sender.name,
        senderEmail: sender.email,
      }));

      res.json({
        payments: result,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount[0]?.count || 0,
          totalPages: Math.ceil((totalCount[0]?.count || 0) / limitNum),
        },
      });
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // Review Management
  app.get("/api/admin/reviews", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { page = "1", limit = "20" } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const allReviews = await db
        .select({
          review: reviews,
          reviewer: users,
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.reviewerId, users.id))
        .orderBy(desc(reviews.createdAt))
        .limit(limitNum)
        .offset(offset);

      const totalCount = await db.select({ count: count() }).from(reviews);

      const result = allReviews.map(({ review, reviewer }) => ({
        ...review,
        reviewerName: reviewer.name,
        reviewerEmail: reviewer.email,
      }));

      res.json({
        reviews: result,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount[0]?.count || 0,
          totalPages: Math.ceil((totalCount[0]?.count || 0) / limitNum),
        },
      });
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.delete("/api/admin/reviews/:id", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await db.delete(reviews).where(eq(reviews.id, req.params.id)).returning();
      if (!result[0]) {
        return res.status(404).json({ error: "Review not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete review:", error);
      res.status(500).json({ error: "Failed to delete review" });
    }
  });

  // Activity Logs - Recent activities across the platform
  app.get("/api/admin/activity", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { limit = "50" } = req.query;
      const limitNum = parseInt(limit as string);

      // Get recent parcels, routes, and payments
      const [recentParcels, recentRoutes, recentPayments] = await Promise.all([
        db
          .select({
            id: parcels.id,
            type: sql<string>`'parcel'`,
            description: sql<string>`CONCAT('Parcel from ', ${parcels.origin}, ' to ', ${parcels.destination})`,
            status: parcels.status,
            createdAt: parcels.createdAt,
            userId: parcels.senderId,
            userName: users.name,
          })
          .from(parcels)
          .innerJoin(users, eq(parcels.senderId, users.id))
          .orderBy(desc(parcels.createdAt))
          .limit(limitNum / 3),
        
        db
          .select({
            id: routes.id,
            type: sql<string>`'route'`,
            description: sql<string>`CONCAT('Route from ', ${routes.origin}, ' to ', ${routes.destination})`,
            status: routes.status,
            createdAt: routes.createdAt,
            userId: routes.carrierId,
            userName: users.name,
          })
          .from(routes)
          .innerJoin(users, eq(routes.carrierId, users.id))
          .orderBy(desc(routes.createdAt))
          .limit(limitNum / 3),
        
        db
          .select({
            id: payments.id,
            type: sql<string>`'payment'`,
            description: sql<string>`CONCAT('Payment of ', ${payments.amount}, ' ', ${payments.currency})`,
            status: payments.status,
            createdAt: payments.createdAt,
            userId: payments.senderId,
            userName: users.name,
          })
          .from(payments)
          .innerJoin(users, eq(payments.senderId, users.id))
          .orderBy(desc(payments.createdAt))
          .limit(limitNum / 3),
      ]);

      const activities = [...recentParcels, ...recentRoutes, ...recentPayments]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limitNum);

      res.json({ activities });
    } catch (error) {
      console.error("Failed to fetch activity:", error);
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });
}
