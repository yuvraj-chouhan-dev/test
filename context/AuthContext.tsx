
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api'; 
import { config } from '../services/config';
import { Logger } from '../services/logger';
import { isTokenExpiringSoon } from '../services/authUtils';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'CLIENT';
  companyName?: string;
  logoUrl?: string;
  brandColor?: string;
  isTrial?: boolean;
  trialEndsAt?: string;
  twoFactorEnabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresTwoFactor: boolean; 
  login: (email: string, password: string) => Promise<void>;
  verifyTwoFactor: (code: string) => Promise<void>; 
  loginAsClient: () => Promise<void>;
  signup: (name: string, email: string, password: string, companyName: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (email: string, token: string, newPassword: string) => Promise<void>;
  toggleTwoFactor: (enabled: boolean) => Promise<void>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('wpm_user_session');
    const token = localStorage.getItem('wpm_auth_token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // --- AUTOMATIC TOKEN REFRESH ---
  useEffect(() => {
    // Check every minute if token needs refreshing
    const refreshInterval = setInterval(async () => {
        const token = localStorage.getItem('wpm_auth_token');
        const refreshToken = localStorage.getItem('wpm_refresh_token');

        // Only try to refresh if we have both tokens and access token is expiring soon
        if (token && refreshToken && isTokenExpiringSoon(token)) {
            try {
                Logger.info("Access token expiring soon. Refreshing...");
                
                // We call API directly to avoid circular dependencies or complex retry logic here
                const response = await fetch(`${config.API_BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.token) {
                        localStorage.setItem('wpm_auth_token', data.token);
                        Logger.info("Token refreshed successfully.");
                    }
                } else {
                    // Refresh failed (e.g. expired refresh token), force logout
                    Logger.warn("Refresh failed. Logging out.");
                    logout(); 
                }
            } catch (e) {
                Logger.error("Failed to refresh token", e);
            }
        }
    }, 60 * 1000); // Check every 60 seconds

    return () => clearInterval(refreshInterval);
  }, []);

  const login = async (email: string, password: string) => {
    if (config.USE_MOCK_DATA) {
        // Mock logic omitted for brevity
    }
    
    try {
        const response = await api.post<{ token: string; refreshToken: string; user: User }>('/auth/login', { email, password });
        
        // Handle 2FA logic (if applicable)
        if (response.user.twoFactorEnabled) {
             setPendingUser(response.user);
             setRequiresTwoFactor(true);
             // Store temporary tokens? Usually 2FA implies no token yet, or a temp token.
             // For this implementation, we'll assume standard flow first.
             return;
        }

        localStorage.setItem('wpm_auth_token', response.token);
        if (response.refreshToken) {
            localStorage.setItem('wpm_refresh_token', response.refreshToken);
        }
        localStorage.setItem('wpm_user_session', JSON.stringify(response.user));
        setUser(response.user);
        Logger.audit(`User logged in: ${email}`);
    } catch (error) {
        throw error;
    }
  };

  const verifyTwoFactor = async (code: string) => {
      return new Promise<void>((resolve, reject) => {
          setTimeout(() => {
              if (code === '123456' && pendingUser) {
                  // In a real 2FA flow, you'd send the code to backend and get the real JWTs back.
                  // Here we simulate successful 2FA completion
                  setUser(pendingUser);
                  localStorage.setItem('wpm_user_session', JSON.stringify(pendingUser));
                  // Note: In real app, 'login' would return a temp token, and 'verifyTwoFactor' would return final tokens.
                  // We assume tokens were set during login step for simplicity in this hybrid structure.
                  
                  setPendingUser(null);
                  setRequiresTwoFactor(false);
                  Logger.audit(`2FA Verified for user: ${pendingUser.email}`);
                  resolve();
              } else {
                  reject(new Error('Invalid verification code'));
              }
          }, 800);
      });
  };

  const signup = async (name: string, email: string, password: string, companyName: string) => {
    try {
        const response = await api.post<{ token: string; refreshToken: string; user: User }>('/auth/signup', { name, email, password, companyName });
        localStorage.setItem('wpm_auth_token', response.token);
        if (response.refreshToken) {
            localStorage.setItem('wpm_refresh_token', response.refreshToken);
        }
        localStorage.setItem('wpm_user_session', JSON.stringify(response.user));
        setUser(response.user);
        Logger.audit(`User signed up: ${email}`);
    } catch (error) {
        throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('wpm_auth_token');
    localStorage.removeItem('wpm_refresh_token');
    localStorage.removeItem('wpm_user_session');
    localStorage.removeItem('wpm_user_session_secure');
    if (user) Logger.audit(`User logged out: ${user.email}`);
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
      if (!user) return;
      // In real app: await api.put('/users/profile', updates);
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('wpm_user_session', JSON.stringify(updatedUser));
      Logger.audit(`Profile updated for user: ${user.email}`);
  };
  
  const loginAsClient = async () => {
      const clientUser: User = { id: 'demo_client', name: 'Safari Travels Ltd', email: 'client@safari.co.ke', role: 'CLIENT', companyName: 'Safari Travels Ltd' };
      setUser(clientUser);
      localStorage.setItem('wpm_user_session', JSON.stringify(clientUser));
      Logger.audit(`Demo Client Login`);
  };

  const requestPasswordReset = async (email: string) => {
    // Simulate API call
    return new Promise<void>((resolve) => setTimeout(resolve, 500));
  };

  const confirmPasswordReset = async (email: string, token: string, newPassword: string) => {
     // Simulate API call
    return new Promise<void>((resolve) => setTimeout(resolve, 500));
  };

  const toggleTwoFactor = async (enabled: boolean) => {
      await updateProfile({ twoFactorEnabled: enabled });
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, 
        requiresTwoFactor,
        login, 
        verifyTwoFactor,
        loginAsClient,
        signup, 
        logout, 
        updateProfile,
        requestPasswordReset,
        confirmPasswordReset,
        toggleTwoFactor
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
