import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const parcelSizeEnum = pgEnum("parcel_size", ["small", "medium", "large"]);
export const parcelStatusEnum = pgEnum("parcel_status", ["Pending", "In Transit", "Delivered", "Expired"]);
export const connectionTypeEnum = pgEnum("connection_type", ["trusted_carrier", "saved_contact"]);
export const routeStatusEnum = pgEnum("route_status", ["Active", "Completed", "Expired", "Cancelled"]);
export const routeFrequencyEnum = pgEnum("route_frequency", ["one_time", "daily", "weekly", "monthly"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "success", "failed", "cancelled"]);
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const subscriptionTierEnum = pgEnum("subscription_tier", ["free", "premium", "business"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "cancelled", "expired", "past_due"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["credit", "debit"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed"]);

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  rating: real("rating").default(5.0),
  verified: boolean("verified").default(false),
  role: userRoleEnum("role").default("user"),
  suspended: boolean("suspended").default(false),
  subscriptionTier: subscriptionTierEnum("subscription_tier").default("free"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default("active"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  paystackCustomerCode: text("paystack_customer_code"),
  paystackSubscriptionCode: text("paystack_subscription_code"),
  monthlyParcelCount: integer("monthly_parcel_count").default(0),
  lastParcelResetDate: timestamp("last_parcel_reset_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const parcels = pgTable("parcels", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  originLat: real("origin_lat"),
  originLng: real("origin_lng"),
  destinationLat: real("destination_lat"),
  destinationLng: real("destination_lng"),
  intermediateStops: text("intermediate_stops").array(),
  size: parcelSizeEnum("size").notNull(),
  weight: real("weight"),
  description: text("description"),
  specialInstructions: text("special_instructions"),
  isFragile: boolean("is_fragile").default(false),
  compensation: integer("compensation").notNull(),
  pickupDate: timestamp("pickup_date").notNull(),
  pickupWindowEnd: timestamp("pickup_window_end"),
  deliveryWindowStart: timestamp("delivery_window_start"),
  deliveryWindowEnd: timestamp("delivery_window_end"),
  expiresAt: timestamp("expires_at"),
  declaredValue: integer("declared_value"),
  insuranceNeeded: boolean("insurance_needed").default(false),
  contactPhone: text("contact_phone"),
  status: parcelStatusEnum("status").default("Pending"),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  transporterId: varchar("transporter_id").references(() => users.id),
  receiverId: varchar("receiver_id").references(() => users.id),
  receiverName: text("receiver_name"),
  receiverPhone: text("receiver_phone"),
  receiverEmail: text("receiver_email"),
  receiverLat: real("receiver_lat"),
  receiverLng: real("receiver_lng"),
  receiverLocationUpdatedAt: timestamp("receiver_location_updated_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const routes = pgTable("routes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  carrierId: varchar("carrier_id").notNull().references(() => users.id),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  originLat: real("origin_lat"),
  originLng: real("origin_lng"),
  destinationLat: real("destination_lat"),
  destinationLng: real("destination_lng"),
  intermediateStops: text("intermediate_stops").array(),
  departureDate: timestamp("departure_date").notNull(),
  departureTime: text("departure_time"),
  frequency: routeFrequencyEnum("frequency").default("one_time"),
  recurrenceEndDate: timestamp("recurrence_end_date"),
  maxParcelSize: parcelSizeEnum("max_parcel_size"),
  maxWeight: real("max_weight"),
  availableCapacity: integer("available_capacity"),
  capacityUsed: integer("capacity_used").default(0),
  pricePerKg: integer("price_per_kg"),
  notes: text("notes"),
  status: routeStatusEnum("status").default("Active"),
  expiresAt: timestamp("expires_at"),
  parentRouteId: varchar("parent_route_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  parcelId: varchar("parcel_id").references(() => parcels.id),
  participant1Id: varchar("participant1_id").notNull().references(() => users.id),
  participant2Id: varchar("participant2_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const connections = pgTable("connections", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  connectedUserId: varchar("connected_user_id").notNull().references(() => users.id),
  connectionType: connectionTypeEnum("connection_type").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sentParcels: many(parcels, { relationName: "sender" }),
  transportingParcels: many(parcels, { relationName: "transporter" }),
  routes: many(routes),
  conversations1: many(conversations, { relationName: "participant1" }),
  conversations2: many(conversations, { relationName: "participant2" }),
  messages: many(messages),
  connections: many(connections, { relationName: "userConnections" }),
  connectedBy: many(connections, { relationName: "connectedByUsers" }),
}));

export const routesRelations = relations(routes, ({ one }) => ({
  carrier: one(users, {
    fields: [routes.carrierId],
    references: [users.id],
  }),
}));

export const parcelsRelations = relations(parcels, ({ one, many }) => ({
  sender: one(users, {
    fields: [parcels.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  transporter: one(users, {
    fields: [parcels.transporterId],
    references: [users.id],
    relationName: "transporter",
  }),
  conversations: many(conversations),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  parcel: one(parcels, {
    fields: [conversations.parcelId],
    references: [parcels.id],
  }),
  participant1: one(users, {
    fields: [conversations.participant1Id],
    references: [users.id],
    relationName: "participant1",
  }),
  participant2: one(users, {
    fields: [conversations.participant2Id],
    references: [users.id],
    relationName: "participant2",
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const connectionsRelations = relations(connections, ({ one }) => ({
  user: one(users, {
    fields: [connections.userId],
    references: [users.id],
    relationName: "userConnections",
  }),
  connectedUser: one(users, {
    fields: [connections.connectedUserId],
    references: [users.id],
    relationName: "connectedByUsers",
  }),
}));

export const reviews = pgTable("reviews", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  parcelId: varchar("parcel_id").notNull().references(() => parcels.id),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id),
  revieweeId: varchar("reviewee_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  reviewType: text("review_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pushTokens = pgTable("push_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  platform: text("platform"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  parcelId: varchar("parcel_id").notNull().references(() => parcels.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  carrierId: varchar("carrier_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  carrierAmount: integer("carrier_amount").notNull(),
  platformFee: integer("platform_fee").notNull(),
  platformFeePercentage: real("platform_fee_percentage").notNull(),
  currency: text("currency").default("NGN"),
  status: paymentStatusEnum("status").default("pending"),
  paystackReference: text("paystack_reference").unique(),
  paystackAccessCode: text("paystack_access_code"),
  paystackAuthorizationUrl: text("paystack_authorization_url"),
  paidAt: timestamp("paid_at"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  tier: subscriptionTierEnum("tier").notNull(),
  status: subscriptionStatusEnum("status").default("active"),
  amount: integer("amount").notNull(),
  currency: text("currency").default("NGN"),
  paystackPlanCode: text("paystack_plan_code"),
  paystackSubscriptionCode: text("paystack_subscription_code"),
  paystackCustomerCode: text("paystack_customer_code"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  nextBillingDate: timestamp("next_billing_date"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const wallets = pgTable("wallets", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  balance: integer("balance").default(0).notNull(),
  currency: text("currency").default("NGN").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull().references(() => wallets.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: transactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  status: transactionStatusEnum("status").default("completed").notNull(),
  description: text("description").notNull(),
  reference: text("reference"),
  parcelId: varchar("parcel_id").references(() => parcels.id),
  paystackReference: text("paystack_reference"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});


export const reviewsRelations = relations(reviews, ({ one }) => ({
  parcel: one(parcels, {
    fields: [reviews.parcelId],
    references: [parcels.id],
  }),
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.id],
    relationName: "reviewsGiven",
  }),
  reviewee: one(users, {
    fields: [reviews.revieweeId],
    references: [users.id],
    relationName: "reviewsReceived",
  }),
}));

export const pushTokensRelations = relations(pushTokens, ({ one }) => ({
  user: one(users, {
    fields: [pushTokens.userId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  parcel: one(parcels, {
    fields: [payments.parcelId],
    references: [parcels.id],
  }),
  sender: one(users, {
    fields: [payments.senderId],
    references: [users.id],
    relationName: "paymentsSent",
  }),
  carrier: one(users, {
    fields: [payments.carrierId],
    references: [users.id],
    relationName: "paymentsReceived",
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  transactions: many(walletTransactions),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [walletTransactions.walletId],
    references: [wallets.id],
  }),
  user: one(users, {
    fields: [walletTransactions.userId],
    references: [users.id],
  }),
  parcel: one(parcels, {
    fields: [walletTransactions.parcelId],
    references: [parcels.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertParcelSchema = createInsertSchema(parcels).omit({
  id: true,
  createdAt: true,
  status: true,
  transporterId: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertConnectionSchema = createInsertSchema(connections).omit({
  id: true,
  createdAt: true,
});

export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;

export const insertPushTokenSchema = createInsertSchema(pushTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertParcel = z.infer<typeof insertParcelSchema>;
export type Parcel = typeof parcels.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type Connection = typeof connections.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type Route = typeof routes.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertPushToken = z.infer<typeof insertPushTokenSchema>;
export type PushToken = typeof pushTokens.$inferSelect;
