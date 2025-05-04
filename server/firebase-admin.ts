// Firebase Admin SDK setup for server-side authentication

// In a real production environment, we would use the actual Firebase Admin SDK
// For now, in development, this is a mock implementation
export const auth = {
  verifyIdToken: async (token: string) => {
    // This is a mock implementation for development
    // In production, this would actually verify the token with Firebase
    console.log("Mock verifying token:", token);
    
    // Return a mock decoded token
    return {
      uid: "1",
      email: "doctor@example.com",
      name: "Dr. João Silva"
    };
  }
};