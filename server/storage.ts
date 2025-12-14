import { eq, or, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  type User, type InsertUser, users,
  type Parcel, type InsertParcel, parcels,
  type Conversation, type InsertConversation, conversations,
  type Message, type InsertMessage, messages,
} from "@shared/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
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
}

export const storage = new DatabaseStorage();
