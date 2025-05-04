import { Request, Response, NextFunction } from "express";
import { auth } from "../firebase-admin";

// Add user property to Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        displayName?: string;
        role?: string;
      };
    }
  }
}

// Middleware to validate Firebase auth token
export async function validateAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // For development/testing, allow a mock user
    if (process.env.NODE_ENV === "development" && process.env.MOCK_AUTH === "true") {
      req.user = {
        id: "1",
        email: "doctor@example.com",
        displayName: "Dr. João Silva",
        role: "doctor"
      };
      return next();
    }
    
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }
  
  const token = authHeader.split("Bearer ")[1];
  
  try {
    // In a real app, verify the Firebase ID token
    // For now, we'll mock this behavior for development
    // const decodedToken = await auth.verifyIdToken(token);
    
    // Mock user for development
    const decodedToken = {
      uid: "1",
      email: "doctor@example.com",
      name: "Dr. João Silva"
    };
    
    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email || "",
      displayName: decodedToken.name,
      role: "doctor" // Default role
    };
    
    next();
  } catch (error) {
    console.error("Error verifying auth token:", error);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}
