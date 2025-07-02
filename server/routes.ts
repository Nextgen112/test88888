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
  
  // Ensure the uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Simple authentication middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const isAuth = authHeader === 'Bearer authenticated' || req.headers['x-auth'] === 'authenticated';
    
    if (!isAuth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (username === 'admin' && password === 'password') {
        res.json({ 
          success: true, 
          message: 'Login successful',
          token: 'authenticated'
        });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
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
  
  // Upload a file (protected)
  app.post('/api/files/upload', isAuthenticated, async (req, res) => {
    try {
      // Apply file upload middleware
      fileUploadMiddleware(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ error: err.message });
        }
        
        const file = req.file;
        if (!file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // Get client IP address
        const ipAddress = req.ip || 
                       req.headers['x-forwarded-for'] as string || 
                       req.socket.remoteAddress || 
                       '0.0.0.0';
        
        // Store file metadata in the database
        const newFile = await storage.createFile({
          filename: file.filename,
          originalFilename: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedBy: 1 // Default user ID (admin)
        });
        
        // Log the upload
        await storage.createAccessLog({
          ipAddress,
          fileId: newFile.id,
          eventType: 'file_upload',
          status: 'successful',
          details: `File uploaded: ${file.originalname}`
        });
        
        // Return the file info with URL
        res.status(201).json({
          ...newFile,
          url: `/api/files/${newFile.id}/download`
        });
      });
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
  
  // Download a file - requires IP verification
  app.get('/api/files/:id/download', verifyIpMiddleware, async (req, res) => {
    try {
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
        details: `File downloaded: ${file.originalFilename}`
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
  
  // Add IP to whitelist (protected)
  app.post('/api/ip-whitelist', isAuthenticated, async (req, res) => {
    try {
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
  
  // Get all users
  app.get('/api/users', isAuthenticated, async (_req, res) => {
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

  // Create new user
  app.post('/api/users', isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        username: z.string().min(3).max(50),
        password: z.string().min(6).max(100),
      });

      const validatedData = schema.parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const newUser = await storage.createUser(validatedData);
      res.json({ 
        id: newUser.id, 
        username: newUser.username 
      });
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input data' });
      }
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // Update user
  app.put('/api/users/:id', isAuthenticated, async (req, res) => {
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

  // Delete user
  app.delete('/api/users/:id', isAuthenticated, async (req, res) => {
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
