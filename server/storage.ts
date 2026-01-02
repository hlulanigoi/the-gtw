import { eq, or, and, desc, avg } from "drizzle-orm";
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

// Graceful shutdown
const gracefulShutdown = () => {
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { id?: string }): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllParcels(): Promise<Parcel[]>;
  getParcel(id: string): Promise<Parcel | undefined>;
  getParcelWithSender(id: string): Promise<(Parcel & { sender: User }) | undefined>;
  getUserParcels(userId: string): Promise<Parcel[]>;
  createParcel(parcel: InsertParcel): Promise<Parcel>;
  updateParcel(id: string, updates: Partial<Parcel>): Promise<Parcel | undefined>;
  getUserConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversationMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  createPushToken(token: InsertPushToken): Promise<PushToken>;
  incrementParcelCount(userId: string): Promise<User | undefined>;
  resetMonthlyParcelCount(userId: string): Promise<User | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;
  createReview(review: InsertReview): Promise<Review>;
  getUserReviews(userId: string): Promise<(Review & { reviewer: User })[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser & { id?: string }): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
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

  async getAllParcels(): Promise<Parcel[]> {
    return await db.select().from(parcels).orderBy(desc(parcels.createdAt));
  }

  async getParcel(id: string): Promise<Parcel | undefined> {
    const result = await db.select().from(parcels).where(eq(parcels.id, id));
    return result[0];
  }

  async getParcelWithSender(id: string): Promise<(Parcel & { sender: User }) | undefined> {
    const result = await db
      .select()
      .from(parcels)
      .innerJoin(users, eq(parcels.senderId, users.id))
      .where(eq(parcels.id, id));
    if (result[0]) {
      return { ...result[0].parcels, sender: result[0].users };
    }
    return undefined;
  }

  async getUserParcels(userId: string): Promise<Parcel[]> {
    return await db
      .select()
      .from(parcels)
      .where(
        or(
          eq(parcels.senderId, userId),
          eq(parcels.transporterId, userId),
          eq(parcels.receiverId, userId)
        )
      )
      .orderBy(desc(parcels.createdAt));
  }

  async createParcel(insertParcel: InsertParcel): Promise<Parcel> {
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

  async createPushToken(insertPushToken: InsertPushToken): Promise<PushToken> {
    const result = await db.insert(pushTokens).values(insertPushToken).returning();
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

  async resetMonthlyParcelCount(userId: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ monthlyParcelCount: 0, lastParcelResetDate: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const result = await db.insert(routes).values(insertRoute).returning();
    return result[0];
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const result = await db.insert(reviews).values(insertReview).returning();
    return result[0];
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

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(insertPayment).returning();
    return result[0];
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const result = await db.insert(subscriptions).values(insertSubscription).returning();
    return result[0];
  }

  async createConnection(insertConnection: InsertConnection): Promise<Connection> {
    const result = await db.insert(connections).values(insertConnection).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
