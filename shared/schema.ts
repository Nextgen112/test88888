import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // "admin" or "user"
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

// Files schema
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  uploadedBy: integer("uploaded_by").references(() => users.id),
});

export const insertFileSchema = createInsertSchema(files).pick({
  filename: true,
  originalFilename: true,
  fileSize: true,
  mimeType: true,
  uploadedBy: true,
});

// IP Whitelist schema
export const ipWhitelist = pgTable("ip_whitelist", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull().unique(),
  description: text("description").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  createdBy: integer("created_by").references(() => users.id),
});

export const insertIpWhitelistSchema = createInsertSchema(ipWhitelist).pick({
  ipAddress: true,
  description: true,
  isActive: true,
  expiresAt: true,
  createdBy: true,
});

// Access Logs schema
export const accessLogs = pgTable("access_logs", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull(),
  fileId: integer("file_id").references(() => files.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  eventType: text("event_type").notNull(), // 'file_access', 'file_upload'
  status: text("status").notNull(), // 'successful', 'denied'
  details: text("details"),
});

export const insertAccessLogSchema = createInsertSchema(accessLogs).pick({
  ipAddress: true,
  fileId: true,
  eventType: true,
  status: true,
  details: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type IpWhitelist = typeof ipWhitelist.$inferSelect;
export type InsertIpWhitelist = z.infer<typeof insertIpWhitelistSchema>;

export type AccessLog = typeof accessLogs.$inferSelect;
export type InsertAccessLog = z.infer<typeof insertAccessLogSchema>;

// Dashboard Stats
export type DashboardStats = {
  totalFiles: number;
  totalAccessRequests: number;
  totalWhitelistedIps: number;
  newFilesThisWeek: number;
  deniedRequestsLast24h: number;
  recentlyAddedIps: number;
};
