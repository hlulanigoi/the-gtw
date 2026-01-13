import { eq, or, and, desc, avg, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  type User, type InsertUser, users,
  type Parcel, type InsertParcel, parcels,
  type Conversation, type InsertConversation, conversations,
  type Message, type InsertMessage, messages,
  type Connection, type InsertConnection, connections,
  type Route, type InsertRoute, routes,
  type Review, type InsertReview, reviews,
  type PushToken, type InsertPushToken, pushTokens,
  type Payment, type InsertPayment, payments,
  type Subscription, type InsertSubscription, subscriptions,
  type LocationHistory, type InsertLocationHistory, locationHistory,
  type WalletTransaction, type InsertWalletTransaction, walletTransactions,
  type Dispute, type InsertDispute, disputes,
  type DisputeMessage, type InsertDisputeMessage, disputeMessages,
  type ParcelPhoto, type InsertParcelPhoto, parcelPhotos,
} from "@shared/schema";

// Database connection pool with production-ready configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : undefined
});

export const db = drizzle(pool);

    const result = await db.insert(parcels).values(insertParcel).returning();
    return result[0];
  }

  async updateParcel(id: string, updates: Partial<Parcel>): Promise<Parcel | undefined> {
    const result = await db.update(parcels).set(updates).where(eq(parcels.id, id)).returning();
    return result[0];
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId)
        )
      )
      .orderBy(desc(conversations.createdAt));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const result = await db.select().from(conversations).where(eq(conversations.id, id));
    return result[0];
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const result = await db.insert(conversations).values(insertConversation).returning();
    return result[0];
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(insertMessage).returning();
    return result[0];
  }

  async deleteParcel(id: string): Promise<boolean> {
    const result = await db.delete(parcels).where(eq(parcels.id, id)).returning();
    return result.length > 0;
  }

  async deleteMessage(id: string): Promise<boolean> {
    const result = await db.delete(messages).where(eq(messages.id, id)).returning();
    return result.length > 0;
  }

  async getUserConnections(userId: string): Promise<(Connection & { connectedUser: User })[]> {
    const result = await db
      .select()
      .from(connections)
      .innerJoin(users, eq(connections.connectedUserId, users.id))
      .where(eq(connections.userId, userId))
      .orderBy(desc(connections.createdAt));
    return result.map(r => ({ ...r.connections, connectedUser: r.users }));
  }

  async getConnection(userId: string, connectedUserId: string): Promise<Connection | undefined> {
    const result = await db
      .select()
      .from(connections)
      .where(and(eq(connections.userId, userId), eq(connections.connectedUserId, connectedUserId)));
    return result[0];
  }

  async createConnection(insertConnection: InsertConnection): Promise<Connection> {
    const result = await db.insert(connections).values(insertConnection).returning();
    return result[0];
  }

  async deleteConnection(userId: string, connectedUserId: string): Promise<boolean> {
    const result = await db
      .delete(connections)
      .where(and(eq(connections.userId, userId), eq(connections.connectedUserId, connectedUserId)))
      .returning();
    return result.length > 0;
  }

  async getRoute(id: string): Promise<Route | undefined> {
    const result = await db.select().from(routes).where(eq(routes.id, id));
    return result[0];
  }

  async getRouteWithCarrier(id: string): Promise<(Route & { carrier: User }) | undefined> {
    const result = await db
      .select()
      .from(routes)
      .innerJoin(users, eq(routes.carrierId, users.id))
      .where(eq(routes.id, id));
    if (result[0]) {
      return { ...result[0].routes, carrier: result[0].users };
    }
    return undefined;
  }

  async getUserRoutes(userId: string): Promise<Route[]> {
    return await db
      .select()
      .from(routes)
      .where(eq(routes.carrierId, userId))
      .orderBy(desc(routes.departureDate));
  }

  async getAllActiveRoutes(): Promise<Route[]> {
    return await db
      .select()
      .from(routes)
      .where(eq(routes.status, "Active"))
      .orderBy(desc(routes.departureDate));
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const result = await db.insert(routes).values(insertRoute).returning();
    return result[0];
  }

  async updateRoute(id: string, updates: Partial<Route>): Promise<Route | undefined> {
    const result = await db
      .update(routes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(routes.id, id))
      .returning();
    return result[0];
  }

  async deleteRoute(id: string): Promise<boolean> {
    const result = await db.delete(routes).where(eq(routes.id, id)).returning();
    return result.length > 0;
  }

  async getUserReviews(userId: string): Promise<(Review & { reviewer: User })[]> {
    const result = await db
      .select()
      .from(reviews)
      .innerJoin(users, eq(reviews.reviewerId, users.id))
      .where(eq(reviews.revieweeId, userId))
      .orderBy(desc(reviews.createdAt));
    return result.map(r => ({ ...r.reviews, reviewer: r.users }));
  }

  async getReviewByParcelAndReviewer(parcelId: string, reviewerId: string): Promise<Review | undefined> {
    const result = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.parcelId, parcelId), eq(reviews.reviewerId, reviewerId)));
    return result[0];
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const result = await db.insert(reviews).values(insertReview).returning();
    
    const avgResult = await db
      .select({ avgRating: avg(reviews.rating) })
      .from(reviews)
      .where(eq(reviews.revieweeId, insertReview.revieweeId));
    
    if (avgResult[0]?.avgRating) {
      await db
        .update(users)
        .set({ rating: parseFloat(avgResult[0].avgRating) })
        .where(eq(users.id, insertReview.revieweeId));
    }
    
    return result[0];
  }

  async getUserPushTokens(userId: string): Promise<PushToken[]> {
    return await db
      .select()
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId));
  }

  async getPushTokenByToken(token: string): Promise<PushToken | undefined> {
    const result = await db
      .select()
      .from(pushTokens)
      .where(eq(pushTokens.token, token));
    return result[0];
  }

  async createOrUpdatePushToken(insertPushToken: InsertPushToken): Promise<PushToken> {
    const existing = await this.getPushTokenByToken(insertPushToken.token);
    if (existing) {
      const result = await db
        .update(pushTokens)
        .set({ userId: insertPushToken.userId, updatedAt: new Date() })
        .where(eq(pushTokens.token, insertPushToken.token))
        .returning();
      return result[0];
    }
    const result = await db.insert(pushTokens).values(insertPushToken).returning();
    return result[0];
  }

  async deletePushToken(token: string): Promise<boolean> {
    const result = await db.delete(pushTokens).where(eq(pushTokens.token, token)).returning();
    return result.length > 0;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const result = await db.select().from(payments).where(eq(payments.id, id));
    return result[0];
  }

  async getPaymentByReference(reference: string): Promise<Payment | undefined> {
    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.paystackReference, reference));
    return result[0];
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(or(eq(payments.senderId, userId), eq(payments.carrierId, userId)))
      .orderBy(desc(payments.createdAt));
  }

  async getParcelPayment(parcelId: string): Promise<Payment | undefined> {
    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.parcelId, parcelId))
      .orderBy(desc(payments.createdAt));
    return result[0];
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(insertPayment).returning();
    return result[0];
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const result = await db
      .update(payments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return result[0];
  }

  async updatePaymentByReference(
    reference: string,
    updates: Partial<Payment>
  ): Promise<Payment | undefined> {
    const result = await db
      .update(payments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payments.paystackReference, reference))
      .returning();
    return result[0];
  }

  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const result = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
      .orderBy(desc(subscriptions.createdAt));
    return result[0];
  }

  async getSubscription(id: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return result[0];
  }

  async getSubscriptionByPaystackCode(code: string): Promise<Subscription | undefined> {
    const result = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.paystackSubscriptionCode, code));
    return result[0];
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const result = await db.insert(subscriptions).values(insertSubscription).returning();
    return result[0];
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const result = await db
      .update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async resetMonthlyParcelCount(userId: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ monthlyParcelCount: 0, lastParcelResetDate: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async incrementParcelCount(userId: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const result = await db
      .update(users)
      .set({ monthlyParcelCount: (user.monthlyParcelCount || 0) + 1 })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // Location History Methods
  async createLocationHistory(insertLocationHistory: InsertLocationHistory): Promise<LocationHistory> {
    const result = await db.insert(locationHistory).values(insertLocationHistory).returning();
    return result[0];
  }

  async getParcelLocationHistory(parcelId: string, limit: number = 50): Promise<LocationHistory[]> {
    return await db
      .select()
      .from(locationHistory)
      .where(eq(locationHistory.parcelId, parcelId))
      .orderBy(desc(locationHistory.createdAt))
      .limit(limit);
  }

  async getLatestLocation(parcelId: string): Promise<LocationHistory | undefined> {
    const result = await db
      .select()
      .from(locationHistory)
      .where(eq(locationHistory.parcelId, parcelId))
      .orderBy(desc(locationHistory.createdAt))
      .limit(1);
    return result[0];
  }

  async deleteOldLocationHistory(daysOld: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await db
      .delete(locationHistory)
      .where(gte(locationHistory.createdAt, cutoffDate))
      .returning();
    return result.length;
  }

  // Wallet Transaction Methods
  async createWalletTransaction(insertTransaction: InsertWalletTransaction): Promise<WalletTransaction> {
    const result = await db.insert(walletTransactions).values(insertTransaction).returning();
    
    // Update user's wallet balance
    await db
      .update(users)
      .set({ walletBalance: insertTransaction.balanceAfter })
      .where(eq(users.id, insertTransaction.userId));
    
    return result[0];
  }

  async getUserWalletTransactions(userId: string, limit: number = 50): Promise<WalletTransaction[]> {
    return await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit);
  }

  async getWalletTransactionByReference(reference: string): Promise<WalletTransaction | undefined> {
    const result = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.reference, reference));
    return result[0];
  }

  async getWalletTransactionByPaystackReference(paystackReference: string): Promise<WalletTransaction | undefined> {
    const result = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.paystackReference, paystackReference));
    return result[0];
  }

  // Dispute Methods
  async createDispute(insertDispute: InsertDispute): Promise<Dispute> {
    // Set auto-close date (7 days from now)
    const autoCloseAt = new Date();
    autoCloseAt.setDate(autoCloseAt.getDate() + 7);
    
    const result = await db.insert(disputes).values({
      ...insertDispute,
      autoCloseAt,
    }).returning();
    return result[0];
  }

  async getDispute(id: string): Promise<Dispute | undefined> {
    const result = await db.select().from(disputes).where(eq(disputes.id, id));
    return result[0];
  }

  async getUserDisputes(userId: string): Promise<Dispute[]> {
    return await db
      .select()
      .from(disputes)
      .where(or(eq(disputes.complainantId, userId), eq(disputes.respondentId, userId)))
      .orderBy(desc(disputes.createdAt));
  }

  async getParcelDisputes(parcelId: string): Promise<Dispute[]> {
    return await db
      .select()
      .from(disputes)
      .where(eq(disputes.parcelId, parcelId))
      .orderBy(desc(disputes.createdAt));
  }

  async getOpenDisputes(): Promise<Dispute[]> {
    return await db
      .select()
      .from(disputes)
      .where(or(eq(disputes.status, "open"), eq(disputes.status, "in_review")))
      .orderBy(desc(disputes.createdAt));
  }

  async updateDispute(id: string, updates: Partial<Dispute>): Promise<Dispute | undefined> {
    const result = await db
      .update(disputes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(disputes.id, id))
      .returning();
    return result[0];
  }

  async createDisputeMessage(insertMessage: InsertDisputeMessage): Promise<DisputeMessage> {
    const result = await db.insert(disputeMessages).values(insertMessage).returning();
    
    // Update dispute timestamp
    await db
      .update(disputes)
      .set({ updatedAt: new Date() })
      .where(eq(disputes.id, insertMessage.disputeId));
    
    return result[0];
  }

  async getDisputeMessages(disputeId: string): Promise<DisputeMessage[]> {
    return await db
      .select()
      .from(disputeMessages)
      .where(eq(disputeMessages.disputeId, disputeId))
      .orderBy(disputeMessages.createdAt);
  }

  // Parcel Photo Methods
  async createParcelPhoto(insertPhoto: InsertParcelPhoto): Promise<ParcelPhoto> {
    const result = await db.insert(parcelPhotos).values(insertPhoto).returning();
    return result[0];
  }

  async getParcelPhotos(parcelId: string): Promise<ParcelPhoto[]> {
    return await db
      .select()
      .from(parcelPhotos)
      .where(eq(parcelPhotos.parcelId, parcelId))
      .orderBy(desc(parcelPhotos.createdAt));
  }

  async getParcelPhotosByType(parcelId: string, photoType: string): Promise<ParcelPhoto[]> {
    return await db
      .select()
      .from(parcelPhotos)
      .where(and(eq(parcelPhotos.parcelId, parcelId), eq(parcelPhotos.photoType, photoType)))
      .orderBy(desc(parcelPhotos.createdAt));
  }

  async deleteParcelPhoto(id: string): Promise<boolean> {
    const result = await db.delete(parcelPhotos).where(eq(parcelPhotos.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
