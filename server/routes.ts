import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fileUploadMiddleware } from "./middlewares/file-upload";
import { verifyIpMiddleware } from "./middlewares/ip-verification";
import path from "path";
import fs from "fs";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Base directory for file uploads
  const uploadsDir = path.join(process.cwd(), 'uploads');

  // Handle preflight OPTIONS request for CORS
  app.options('/VIP.js', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    res.status(200).end();
  });

  // VIP.js route - registered early to avoid frontend interference
  app.get('/VIP.js', verifyIpMiddleware, async (req, res) => {
    try {
      // Get the first VIP.js file (or you can specify which one)
      const files = await storage.getFiles();
      const vipFile = files.find(f => f.originalFilename.includes('.vip.js'));
      
      if (!vipFile) {
        return res.status(404).send('// VIP.js file not found');
      }
      
      const filePath = path.join(uploadsDir, vipFile.filename);
      
      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).send('// VIP.js file not found on disk');
      }
      
      // Log successful access
      await storage.createAccessLog({
        ipAddress: req.clientIp || 'unknown',
        fileId: vipFile.id,
        eventType: 'file_access',
        status: 'successful',
        details: `VIP.js accessed: ${vipFile.originalFilename}`
      });
      
      // Read and serve file content directly as JavaScript
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Set CORS headers to allow cross-origin requests
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(fileContent);
    } catch (error) {
      console.error('Error serving VIP.js:', error);
      res.status(500).send('// Error loading VIP.js file');
    }
  });
  
  // Ensure the uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Session-based authentication middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.session && req.session.authenticated && req.session.userId) {
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized' });
  };

  // Authentication routes
  // Admin login endpoint
  app.post('/api/auth/admin-login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password || user.role !== 'admin') {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }
      
      // Set session data
      req.session.authenticated = true;
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
      
      res.json({ success: true, message: 'Admin login successful' });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: 'Admin login failed' });
    }
  });

  // User login endpoint with automatic IP whitelisting
  app.post('/api/auth/user-login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password || user.role !== 'user') {
        return res.status(401).json({ error: 'Invalid user credentials' });
      }
      
      // Get user's IP address
      const userIp = req.clientIp || req.ip || 'unknown';
      
      // Check if IP is already whitelisted
      const existingIpEntry = await storage.getIpWhitelistByIp(userIp);
      
      if (!existingIpEntry) {
        // Automatically add user's IP to whitelist
        await storage.createIpWhitelist({
          ipAddress: userIp,
          description: `Auto-added for user: ${username}`,
          isActive: true,
          expiresAt: null, // Never expires for user login
          createdBy: user.id
        });
      }
      
      // Set session data
      req.session.authenticated = true;
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
      
      // Log the access
      await storage.createAccessLog({
        ipAddress: userIp,
        eventType: 'user_login',
        status: 'successful',
        fileId: null,
        details: `User ${username} logged in, IP automatically whitelisted`
      });
      
      res.json({ 
        success: true, 
        message: 'User login successful', 
        ipAdded: !existingIpEntry,
        userIp: userIp
      });
    } catch (error) {
      console.error('User login error:', error);
      res.status(500).json({ error: 'User login failed' });
    }
  });

  // Keep old login for backward compatibility
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (user && user.password === password) {
        req.session.authenticated = true;
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        
        res.json({ 
          success: true, 
          message: 'Login successful'
        });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });
  
  // Check authentication status and user role
  app.get('/api/auth/status', async (req: any, res) => {
    if (!req.session || !req.session.authenticated || !req.session.userId) {
      return res.json({ authenticated: false });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.json({ authenticated: false });
      }

      res.json({
        authenticated: true,
        userId: user.id,
        username: user.username,
        role: user.role
      });
    } catch (error) {
      console.error('Error fetching user for auth status:', error);
      res.json({ authenticated: false });
    }
  });

  // Logout route
  app.post('/api/auth/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: 'Could not log out' });
      }
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });

  // API routes - all prefixed with /api
  
  // Dashboard stats (protected)
  app.get('/api/stats', isAuthenticated, async (_req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
  });
  
  // File management routes
  
  // Get all files
  app.get('/api/files', async (_req, res) => {
    try {
      const files = await storage.getFiles();
      
      // Add URLs to the files
      const filesWithUrls = files.map(file => ({
        ...file,
        url: `/api/files/${file.id}/download`
      }));
      
      res.json(filesWithUrls);
    } catch (error) {
      console.error('Error fetching files:', error);
      res.status(500).json({ error: 'Failed to fetch files' });
    }
  });
  
  // File upload route (admin only)
  app.post('/api/files/upload', isAuthenticated, fileUploadMiddleware, async (req, res) => {
    try {
      // Check if current user is admin
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Create file record in database
      const newFile = await storage.createFile({
        filename: req.file.filename,
        originalFilename: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: currentUser.id
      });

      // Log the upload
      await storage.createAccessLog({
        ipAddress: req.clientIp || 'unknown',
        fileId: newFile.id,
        eventType: 'file_upload',
        status: 'upload',
        details: `File uploaded by admin: ${newFile.originalFilename}`
      });

      res.status(201).json(newFile);
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });
  
  // Delete a file
  app.delete('/api/files/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid file ID' });
      }
      
      const deleted = await storage.deleteFile(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      res.status(200).json({ success: true, message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  });
  
  // VIP.js route moved to beginning of routes for priority handling

  // Admin-only file download route (for management purposes)
  app.get('/api/files/:id/download', isAuthenticated, verifyIpMiddleware, async (req, res) => {
    try {
      // Check if current user is admin
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required for file downloads' });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid file ID' });
      }
      
      const file = await storage.getFile(id);
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      const filePath = path.join(uploadsDir, file.filename);
      
      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on disk' });
      }
      
      // Log successful access
      await storage.createAccessLog({
        ipAddress: req.clientIp || 'unknown',
        fileId: file.id,
        eventType: 'file_access',
        status: 'successful',
        details: `File downloaded by admin: ${file.originalFilename}`
      });
      
      // Send the file
      res.download(filePath, file.originalFilename);
    } catch (error) {
      console.error('Error downloading file:', error);
      res.status(500).json({ error: 'Failed to download file' });
    }
  });
  
  // IP Whitelist routes
  
  // Get all IP whitelist entries (protected)
  app.get('/api/ip-whitelist', isAuthenticated, async (_req, res) => {
    try {
      const ipWhitelists = await storage.getIpWhitelists();
      res.json(ipWhitelists);
    } catch (error) {
      console.error('Error fetching IP whitelist:', error);
      res.status(500).json({ error: 'Failed to fetch IP whitelist' });
    }
  });
  
  // Add current user's IP to whitelist (for regular users)
  app.post('/api/add-my-ip', isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Get client IP address
      const ipAddress = req.ip || 
                     req.headers['x-forwarded-for'] as string || 
                     req.socket.remoteAddress || 
                     '0.0.0.0';

      // Check if IP already exists
      const existingIp = await storage.getIpWhitelistByIp(ipAddress);
      if (existingIp) {
        return res.status(200).json({ 
          success: true, 
          message: 'Your IP address is already whitelisted',
          ipAddress: existingIp.ipAddress,
          alreadyExists: true
        });
      }

      // Create new IP whitelist entry
      const newIpWhitelist = await storage.createIpWhitelist({
        ipAddress,
        description: `Added by user: ${currentUser.username}`,
        isActive: true,
        expiresAt: null,
        createdBy: currentUser.id
      });

      res.status(201).json(newIpWhitelist);
    } catch (error) {
      console.error('Error adding user IP to whitelist:', error);
      res.status(500).json({ error: 'Failed to add IP to whitelist' });
    }
  });

  // Add IP to whitelist (admin only)
  app.post('/api/ip-whitelist', isAuthenticated, async (req, res) => {
    try {
      // Check if current user is admin
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      // Validate request body
      const schema = z.object({
        ipAddress: z.string().min(1).max(45),
        description: z.string().min(1).max(255),
        expiresAt: z.string().optional().nullable(),
      });
      
      const validationResult = schema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Invalid request data', details: validationResult.error });
      }
      
      const { ipAddress, description, expiresAt } = validationResult.data;
      
      // Check if IP already exists
      const existingIp = await storage.getIpWhitelistByIp(ipAddress);
      
      if (existingIp) {
        return res.status(409).json({ error: 'IP address already whitelisted' });
      }
      
      // Create new IP whitelist entry
      const newIpWhitelist = await storage.createIpWhitelist({
        ipAddress,
        description,
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        createdBy: 1 // Default user ID (admin)
      });
      
      res.status(201).json(newIpWhitelist);
    } catch (error) {
      console.error('Error adding IP to whitelist:', error);
      res.status(500).json({ error: 'Failed to add IP to whitelist' });
    }
  });
  
  // Update IP whitelist entry
  app.put('/api/ip-whitelist/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid IP whitelist ID' });
      }
      
      // Validate request body
      const schema = z.object({
        description: z.string().min(1).max(255).optional(),
        isActive: z.boolean().optional(),
        expiresAt: z.string().optional().nullable(),
      });
      
      const validationResult = schema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Invalid request data', details: validationResult.error });
      }
      
      const { description, isActive, expiresAt } = validationResult.data;
      
      // Update IP whitelist entry
      const updatedIpWhitelist = await storage.updateIpWhitelist(id, {
        description,
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });
      
      if (!updatedIpWhitelist) {
        return res.status(404).json({ error: 'IP whitelist entry not found' });
      }
      
      res.json(updatedIpWhitelist);
    } catch (error) {
      console.error('Error updating IP whitelist:', error);
      res.status(500).json({ error: 'Failed to update IP whitelist' });
    }
  });
  
  // Delete IP whitelist entry
  app.delete('/api/ip-whitelist/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid IP whitelist ID' });
      }
      
      const deleted = await storage.deleteIpWhitelist(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'IP whitelist entry not found' });
      }
      
      res.status(200).json({ success: true, message: 'IP whitelist entry deleted successfully' });
    } catch (error) {
      console.error('Error deleting IP whitelist:', error);
      res.status(500).json({ error: 'Failed to delete IP whitelist' });
    }
  });
  
  // User Management routes (protected)
  
  // Check if user is main admin
  const isMainAdmin = (req: any) => {
    return req.session && req.session.authenticated && req.session.username === 'admin';
  };

  // Get all users (only main admin)
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    if (!isMainAdmin(req)) {
      return res.status(403).json({ error: 'Only the main administrator can manage users' });
    }
    try {
      const users = await storage.getUsers();
      // Don't return passwords
      const safeUsers = users.map(user => ({ 
        id: user.id, 
        username: user.username 
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Create new user (admin only, max 3 admins)
  app.post('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      // Check if current user is admin
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const schema = z.object({
        username: z.string().min(3).max(50),
        password: z.string().min(6).max(100),
        role: z.enum(['admin', 'user']).default('user'),
      });

      const validatedData = schema.parse(req.body);

      // If creating an admin, check limit of 3
      if (validatedData.role === 'admin') {
        const allUsers = await storage.getUsers();
        const adminCount = allUsers.filter(u => u.role === 'admin').length;
        if (adminCount >= 3) {
          return res.status(400).json({ error: 'Maximum 3 admin users allowed' });
        }
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const newUser = await storage.createUser(validatedData);
      res.json({ 
        id: newUser.id, 
        username: newUser.username,
        role: newUser.role
      });
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input data' });
      }
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // Update user (only main admin)
  app.put('/api/users/:id', isAuthenticated, async (req: any, res) => {
    if (!isMainAdmin(req)) {
      return res.status(403).json({ error: 'Only the main administrator can manage users' });
    }
    try {
      const userId = parseInt(req.params.id);
      const schema = z.object({
        password: z.string().min(6).max(100).optional(),
        username: z.string().min(3).max(50).optional(),
      });

      const validatedData = schema.parse(req.body);

      // If updating username, check if it already exists
      if (validatedData.username) {
        const existingUser = await storage.getUserByUsername(validatedData.username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ error: 'Username already exists' });
        }
      }

      const updatedUser = await storage.updateUser(userId, validatedData);
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ 
        id: updatedUser.id, 
        username: updatedUser.username 
      });
    } catch (error) {
      console.error('Error updating user:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input data' });
      }
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Delete user (only main admin)
  app.delete('/api/users/:id', isAuthenticated, async (req: any, res) => {
    if (!isMainAdmin(req)) {
      return res.status(403).json({ error: 'Only the main administrator can manage users' });
    }
    try {
      const userId = parseInt(req.params.id);
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });
  
  // Access Logs routes
  
  // Get all access logs
  app.get('/api/access-logs', async (req: Request, res: Response) => {
    try {
      const accessLogs = await storage.getAccessLogs();
      
      // Handle filtering
      let filteredLogs = [...accessLogs];
      
      const eventType = req.query.eventType as string | undefined;
      const status = req.query.status as string | undefined;
      
      if (eventType) {
        filteredLogs = filteredLogs.filter(log => log.eventType === eventType);
      }
      
      if (status) {
        filteredLogs = filteredLogs.filter(log => log.status === status);
      }
      
      // For each log, attach file info if available
      const logsWithFileInfo = await Promise.all(
        filteredLogs.map(async log => {
          if (log.fileId) {
            const file = await storage.getFile(log.fileId);
            if (file) {
              return {
                ...log,
                filename: file.originalFilename
              };
            }
          }
          return {
            ...log,
            filename: null
          };
        })
      );
      
      res.json(logsWithFileInfo);
    } catch (error) {
      console.error('Error fetching access logs:', error);
      res.status(500).json({ error: 'Failed to fetch access logs' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
