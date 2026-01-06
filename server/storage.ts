import { eq, or, and, desc, avg, sql } from "drizzle-orm";
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
  type Wallet, type InsertWallet, wallets,
  type WalletTransaction, type InsertWalletTransaction, walletTransactions,
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
  getAllParcels(): Promise<Parcel[]>;
  getParcel(id: string): Promise<Parcel | undefined>;
  getParcelWithSender(id: string): Promise<(Parcel & { sender: User }) | undefined>;
  createParcel(parcel: InsertParcel): Promise<Parcel>;
  updateParcel(id: string, updates: Partial<Parcel>): Promise<Parcel | undefined>;
  getUserConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversationMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
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

  // Wallet Operations
  async getWallet(userId: string): Promise<Wallet | undefined> {
    const result = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return result[0];
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const result = await db.insert(wallets).values(insertWallet).returning();
    return result[0];
  }

  async getOrCreateWallet(userId: string): Promise<Wallet> {
    let wallet = await this.getWallet(userId);
    if (!wallet) {
      wallet = await this.createWallet({ userId, balance: 0, currency: 'NGN' });
    }
    return wallet;
  }

  async updateWalletBalance(walletId: string, newBalance: number): Promise<Wallet | undefined> {
    const result = await db
      .update(wallets)
      .set({ balance: newBalance, updatedAt: new Date() })
      .where(eq(wallets.id, walletId))
      .returning();
    return result[0];
  }

  async createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction> {
    const result = await db.insert(walletTransactions).values(transaction).returning();
    return result[0];
  }

  async getWalletTransactions(userId: string, limit: number = 50): Promise<WalletTransaction[]> {
    return await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit);
  }

  async debitWallet(userId: string, amount: number, description: string, parcelId?: string): Promise<{ success: boolean; wallet?: Wallet; transaction?: WalletTransaction; error?: string }> {
    try {
      const wallet = await this.getOrCreateWallet(userId);
      
      if (wallet.balance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      const newBalance = wallet.balance - amount;
      const updatedWallet = await this.updateWalletBalance(wallet.id, newBalance);

      if (!updatedWallet) {
        return { success: false, error: 'Failed to update wallet' };
      }

      const transaction = await this.createWalletTransaction({
        walletId: wallet.id,
        userId,
        type: 'debit',
        amount,
        balanceAfter: newBalance,
        status: 'completed',
        description,
        parcelId: parcelId || null,
      });

      return { success: true, wallet: updatedWallet, transaction };
    } catch (error) {
      console.error('Debit wallet error:', error);
      return { success: false, error: 'Transaction failed' };
    }
  }

  async creditWallet(userId: string, amount: number, description: string, paystackReference?: string): Promise<{ success: boolean; wallet?: Wallet; transaction?: WalletTransaction; error?: string }> {
    try {
      const wallet = await this.getOrCreateWallet(userId);
      const newBalance = wallet.balance + amount;
      const updatedWallet = await this.updateWalletBalance(wallet.id, newBalance);

      if (!updatedWallet) {
        return { success: false, error: 'Failed to update wallet' };
      }

      const transaction = await this.createWalletTransaction({
        walletId: wallet.id,
        userId,
        type: 'credit',
        amount,
        balanceAfter: newBalance,
        status: 'completed',
        description,
        paystackReference: paystackReference || null,
      });

      return { success: true, wallet: updatedWallet, transaction };
    } catch (error) {
      console.error('Credit wallet error:', error);
      return { success: false, error: 'Transaction failed' };
    }
  }

  async runWalletMigration(): Promise<void> {
    try {
      // Create transaction type enum
      await db.execute(sql`
        DO $$ BEGIN
          CREATE TYPE transaction_type AS ENUM ('credit', 'debit');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Create transaction status enum
      await db.execute(sql`
        DO $$ BEGIN
          CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Create wallets table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS wallets (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR NOT NULL REFERENCES users(id) UNIQUE,
          balance INTEGER DEFAULT 0 NOT NULL,
          currency TEXT DEFAULT 'NGN' NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Create wallet_transactions table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS wallet_transactions (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          wallet_id VARCHAR NOT NULL REFERENCES wallets(id),
          user_id VARCHAR NOT NULL REFERENCES users(id),
          type transaction_type NOT NULL,
          amount INTEGER NOT NULL,
          balance_after INTEGER NOT NULL,
          status transaction_status DEFAULT 'completed' NOT NULL,
          description TEXT NOT NULL,
          reference TEXT,
          parcel_id VARCHAR REFERENCES parcels(id),
          paystack_reference TEXT,
          metadata TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Create indexes
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_wallet_transactions_parcel_id ON wallet_transactions(parcel_id);`);

      // Create wallets for existing users
      await db.execute(sql`
        INSERT INTO wallets (user_id, balance, currency)
        SELECT id, 0, 'NGN'
        FROM users
        WHERE id NOT IN (SELECT user_id FROM wallets)
        ON CONFLICT (user_id) DO NOTHING;
      `);

      console.log('✅ Wallet migration completed successfully!');
    } catch (error: any) {
      if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate'))) {
        console.log('⊘ Wallet tables already exist, skipping migration');
      } else {
        console.error('❌ Wallet migration failed:', error);
        throw error;
      }
    }
  }
}

export const storage = new DatabaseStorage();
