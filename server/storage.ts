import { 
  User, InsertUser, 
  File, InsertFile, 
  IpWhitelist, InsertIpWhitelist,
  AccessLog, InsertAccessLog,
  DashboardStats
} from "@shared/schema";
import path from "path";
import fs from "fs";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private files: Map<number, File>;
  private ipWhitelists: Map<number, IpWhitelist>;
  private accessLogs: Map<number, AccessLog>;
  
  private currentUserId: number;
  private currentFileId: number;
  private currentIpWhitelistId: number;
  private currentAccessLogId: number;
  
  private uploadsDir: string;
  
  constructor() {
    this.users = new Map();
    this.files = new Map();
    this.ipWhitelists = new Map();
    this.accessLogs = new Map();
    
    this.currentUserId = 1;
    this.currentFileId = 1;
    this.currentIpWhitelistId = 1;
    this.currentAccessLogId = 1;
    
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
    
    // Initialize with some sample data
    this.initializeData();
  }
  
  private initializeData() {
    // Create a sample admin user
    this.users.set(1, {
      id: 1,
      username: 'admin',
      password: 'password',
      role: 'admin'
    });
    
    // Add localhost to IP whitelist
    this.ipWhitelists.set(1, {
      id: 1,
      ipAddress: '127.0.0.1',
      description: 'Localhost',
      isActive: true,
      createdAt: new Date(),
      expiresAt: null,
      createdBy: 1
    });

    // Add some sample VIP.js files
    this.files.set(1, {
      id: 1,
      filename: 'premium-script-1.vip.js',
      originalFilename: 'premium-script.vip.js',
      fileSize: 1024,
      mimeType: 'application/javascript',
      uploadedAt: new Date(),
      uploadedBy: 1
    });

    this.files.set(2, {
      id: 2,
      filename: 'exclusive-module-2.vip.js',
      originalFilename: 'exclusive-module.vip.js',
      fileSize: 2048,
      mimeType: 'application/javascript',
      uploadedAt: new Date(),
      uploadedBy: 1
    });
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const [_, user] of this.users) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || 'user' 
    };
    this.users.set(id, user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      return undefined;
    }

    const updatedUser: User = { 
      ...existingUser, 
      ...userUpdate 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  async getFiles(): Promise<File[]> {
    return Array.from(this.files.values());
  }
  
  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }
  
  async getFileByFilename(filename: string): Promise<File | undefined> {
    for (const file of this.files.values()) {
      if (file.filename === filename) {
        return file;
      }
    }
    return undefined;
  }
  
  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.currentFileId++;
    const file: File = { 
      ...insertFile, 
      id, 
      uploadedAt: new Date() 
    };
    this.files.set(id, file);
    return file;
  }
  
  async deleteFile(id: number): Promise<boolean> {
    const file = this.files.get(id);
    if (!file) {
      return false;
    }
    
    // Delete the file from the filesystem
    const filePath = path.join(this.uploadsDir, file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete from memory
    this.files.delete(id);
    
    return true;
  }
  
  async getIpWhitelists(): Promise<IpWhitelist[]> {
    return Array.from(this.ipWhitelists.values());
  }
  
  async getIpWhitelist(id: number): Promise<IpWhitelist | undefined> {
    return this.ipWhitelists.get(id);
  }
  
  async getIpWhitelistByIp(ipAddress: string): Promise<IpWhitelist | undefined> {
    for (const ipWhitelist of this.ipWhitelists.values()) {
      if (ipWhitelist.ipAddress === ipAddress) {
        return ipWhitelist;
      }
    }
    return undefined;
  }
  
  async createIpWhitelist(insertIpWhitelist: InsertIpWhitelist): Promise<IpWhitelist> {
    const id = this.currentIpWhitelistId++;
    const ipWhitelist: IpWhitelist = { 
      ...insertIpWhitelist, 
      id, 
      createdAt: new Date() 
    };
    this.ipWhitelists.set(id, ipWhitelist);
    return ipWhitelist;
  }
  
  async updateIpWhitelist(id: number, ipWhitelistUpdate: Partial<InsertIpWhitelist>): Promise<IpWhitelist | undefined> {
    const existingIpWhitelist = this.ipWhitelists.get(id);
    if (!existingIpWhitelist) {
      return undefined;
    }
    
    const updatedIpWhitelist: IpWhitelist = { 
      ...existingIpWhitelist, 
      ...ipWhitelistUpdate 
    };
    this.ipWhitelists.set(id, updatedIpWhitelist);
    return updatedIpWhitelist;
  }
  
  async deleteIpWhitelist(id: number): Promise<boolean> {
    return this.ipWhitelists.delete(id);
  }
  
  async getAccessLogs(): Promise<AccessLog[]> {
    return Array.from(this.accessLogs.values());
  }
  
  async getAccessLog(id: number): Promise<AccessLog | undefined> {
    return this.accessLogs.get(id);
  }
  
  async createAccessLog(insertAccessLog: InsertAccessLog): Promise<AccessLog> {
    const id = this.currentAccessLogId++;
    const accessLog: AccessLog = { 
      ...insertAccessLog, 
      id, 
      timestamp: new Date() 
    };
    this.accessLogs.set(id, accessLog);
    return accessLog;
  }
  
  async getDashboardStats(): Promise<DashboardStats> {
    const totalFiles = this.files.size;
    
    // Count total access requests
    const totalAccessRequests = Array.from(this.accessLogs.values()).length;
    
    // Count whitelisted IPs
    const totalWhitelistedIps = this.ipWhitelists.size;
    
    // Count new files in the last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const newFilesThisWeek = Array.from(this.files.values()).filter(
      file => file.uploadedAt && file.uploadedAt > oneWeekAgo
    ).length;
    
    // Count denied requests in the last 24 hours
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);
    
    const deniedRequestsLast24h = Array.from(this.accessLogs.values()).filter(
      log => log.status === 'denied' && log.timestamp > last24Hours
    ).length;
    
    // Count recently added IPs
    const recentlyAddedIps = Array.from(this.ipWhitelists.values()).filter(
      ip => ip.createdAt && ip.createdAt > oneWeekAgo
    ).length;
    
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
    for (const ipWhitelist of this.ipWhitelists.values()) {
      if (ipWhitelist.ipAddress === ipAddress && ipWhitelist.isActive) {
        // Check if the whitelist entry has expired
        if (ipWhitelist.expiresAt && ipWhitelist.expiresAt < new Date()) {
          return false;
        }
        return true;
      }
    }
    return false;
  }
}

export const storage = new MemStorage();