import {
  User, InsertUser,
  File, InsertFile,
  IpWhitelist, InsertIpWhitelist,
  AccessLog, InsertAccessLog,
  DashboardStats,
  users, files, ipWhitelist, accessLogs
} from "@shared/schema";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { eq, and, gt, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // File operations
  getFiles(): Promise<File[]>;
  getFile(id: number): Promise<File | undefined>;
  getFileByFilename(filename: string): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: number): Promise<boolean>;
  
  // IP Whitelist operations
  getIpWhitelists(): Promise<IpWhitelist[]>;
  getIpWhitelist(id: number): Promise<IpWhitelist | undefined>;
  getIpWhitelistByIp(ipAddress: string): Promise<IpWhitelist | undefined>;
  createIpWhitelist(ipWhitelist: InsertIpWhitelist): Promise<IpWhitelist>;
  updateIpWhitelist(id: number, ipWhitelist: Partial<InsertIpWhitelist>): Promise<IpWhitelist | undefined>;
  deleteIpWhitelist(id: number): Promise<boolean>;
  
  // Access Log operations
  getAccessLogs(): Promise<AccessLog[]>;
  getAccessLog(id: number): Promise<AccessLog | undefined>;
  createAccessLog(accessLog: InsertAccessLog): Promise<AccessLog>;
  
  // Dashboard statistics
  getDashboardStats(): Promise<DashboardStats>;
  
  // IP Verification
  isIpWhitelisted(ipAddress: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  private uploadsDir: string;
  
  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
    
    // Initialize with some sample data if needed
    this.initializeData();
  }
  
  private async initializeData() {
    // Check if we have any users
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length === 0) {
      // Create a sample admin user
      await db.insert(users).values({
        username: 'admin',
        password: 'password'
      });
    }
    
    // Check if localhost is already whitelisted
    const existingLocalhost = await db.select()
      .from(ipWhitelist)
      .where(eq(ipWhitelist.ipAddress, '127.0.0.1'));
    
    if (existingLocalhost.length === 0) {
      // Add localhost to IP whitelist
      await db.insert(ipWhitelist).values({
        ipAddress: '127.0.0.1',
        description: 'Localhost',
        isActive: true,
        createdBy: 1
      });
    }
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async getFiles(): Promise<File[]> {
    return db.select().from(files).orderBy(desc(files.uploadedAt));
  }
  
  async getFile(id: number): Promise<File | undefined> {
    const result = await db.select().from(files).where(eq(files.id, id));
    return result[0];
  }
  
  async getFileByFilename(filename: string): Promise<File | undefined> {
    const result = await db.select().from(files).where(eq(files.filename, filename));
    return result[0];
  }
  
  async createFile(insertFile: InsertFile): Promise<File> {
    const [file] = await db.insert(files).values(insertFile).returning();
    return file;
  }
  
  async deleteFile(id: number): Promise<boolean> {
    const file = await this.getFile(id);
    if (!file) {
      return false;
    }
    
    // Delete the file from the filesystem
    const filePath = path.join(this.uploadsDir, file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete from database
    const result = await db.delete(files).where(eq(files.id, id)).returning();
    return result.length > 0;
  }
  
  async getIpWhitelists(): Promise<IpWhitelist[]> {
    return db.select().from(ipWhitelist).orderBy(desc(ipWhitelist.createdAt));
  }
  
  async getIpWhitelist(id: number): Promise<IpWhitelist | undefined> {
    const result = await db.select().from(ipWhitelist).where(eq(ipWhitelist.id, id));
    return result[0];
  }
  
  async getIpWhitelistByIp(ipAddress: string): Promise<IpWhitelist | undefined> {
    const result = await db.select().from(ipWhitelist).where(eq(ipWhitelist.ipAddress, ipAddress));
    return result[0];
  }
  
  async createIpWhitelist(insertIpWhitelist: InsertIpWhitelist): Promise<IpWhitelist> {
    const [ip] = await db.insert(ipWhitelist).values(insertIpWhitelist).returning();
    return ip;
  }
  
  async updateIpWhitelist(id: number, ipWhitelistUpdate: Partial<InsertIpWhitelist>): Promise<IpWhitelist | undefined> {
    const [updatedIp] = await db.update(ipWhitelist)
      .set(ipWhitelistUpdate)
      .where(eq(ipWhitelist.id, id))
      .returning();
    
    return updatedIp;
  }
  
  async deleteIpWhitelist(id: number): Promise<boolean> {
    const result = await db.delete(ipWhitelist).where(eq(ipWhitelist.id, id)).returning();
    return result.length > 0;
  }
  
  async getAccessLogs(): Promise<AccessLog[]> {
    return db.select().from(accessLogs).orderBy(desc(accessLogs.timestamp));
  }
  
  async getAccessLog(id: number): Promise<AccessLog | undefined> {
    const result = await db.select().from(accessLogs).where(eq(accessLogs.id, id));
    return result[0];
  }
  
  async createAccessLog(insertAccessLog: InsertAccessLog): Promise<AccessLog> {
    const [log] = await db.insert(accessLogs).values(insertAccessLog).returning();
    return log;
  }
  
  async getDashboardStats(): Promise<DashboardStats> {
    // Count total files
    const filesResult = await db.select({ count: sql<number>`count(*)` }).from(files);
    const totalFiles = filesResult[0].count;
    
    // Count total access requests
    const logsResult = await db.select({ count: sql<number>`count(*)` }).from(accessLogs);
    const totalAccessRequests = logsResult[0].count;
    
    // Count whitelisted IPs
    const ipsResult = await db.select({ count: sql<number>`count(*)` }).from(ipWhitelist);
    const totalWhitelistedIps = ipsResult[0].count;
    
    // Count new files in the last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const newFilesResult = await db.select({ count: sql<number>`count(*)` })
      .from(files)
      .where(gt(files.uploadedAt, oneWeekAgo));
    
    const newFilesThisWeek = newFilesResult[0].count;
    
    // Count denied requests in the last 24 hours
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);
    
    const deniedResult = await db.select({ count: sql<number>`count(*)` })
      .from(accessLogs)
      .where(
        and(
          eq(accessLogs.status, 'denied'),
          gt(accessLogs.timestamp, last24Hours)
        )
      );
    
    const deniedRequestsLast24h = deniedResult[0].count;
    
    // Count recently added IPs
    const recentIpsResult = await db.select({ count: sql<number>`count(*)` })
      .from(ipWhitelist)
      .where(gt(ipWhitelist.createdAt, oneWeekAgo));
    
    const recentlyAddedIps = recentIpsResult[0].count;
    
    return {
      totalFiles,
      totalAccessRequests,
      totalWhitelistedIps,
      newFilesThisWeek,
      deniedRequestsLast24h,
      recentlyAddedIps
    };
  }
  
  async isIpWhitelisted(ipAddress: string): Promise<boolean> {
    const result = await db.select()
      .from(ipWhitelist)
      .where(
        and(
          eq(ipWhitelist.ipAddress, ipAddress),
          eq(ipWhitelist.isActive, true)
        )
      );
    
    if (result.length === 0) {
      return false;
    }
    
    const ip = result[0];
    
    // Check if the whitelist entry has expired
    if (ip.expiresAt && ip.expiresAt < new Date()) {
      return false;
    }
    
    return true;
  }
}

// Export the database storage instance
export const storage = new DatabaseStorage();