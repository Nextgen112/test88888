import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

/**
 * Middleware to verify if the client's IP address is whitelisted
 */
export const verifyIpMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the client's IP address
    const clientIp = req.ip || 
                     req.headers['x-forwarded-for'] as string || 
                     req.socket.remoteAddress || 
                     '0.0.0.0';
    
    // Clean the IP address (if it's IPv6 format with IPv4 embedded)
    const ipAddress = clientIp.includes('::ffff:') 
      ? clientIp.split('::ffff:')[1] 
      : clientIp;
    
    // Add the IP to the request for later use in routes
    req.clientIp = ipAddress;
    
    // Check if the IP is whitelisted
    const isWhitelisted = await storage.isIpWhitelisted(ipAddress);
    
    if (!isWhitelisted) {
      // Log the access attempt
      await storage.createAccessLog({
        ipAddress,
        fileId: req.params.id ? parseInt(req.params.id) : undefined,
        eventType: 'file_access',
        status: 'denied',
        details: 'IP not whitelisted'
      });
      
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'Your IP address is not authorized to access this file',
        ipAddress
      });
    }
    
    // IP is whitelisted, continue to the next middleware
    next();
  } catch (error) {
    console.error('IP verification error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to verify IP address'
    });
  }
};

// Augment the Express Request interface to include clientIp
declare global {
  namespace Express {
    interface Request {
      clientIp?: string;
    }
  }
}
