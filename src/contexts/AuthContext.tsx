import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  name: string | null;
  roll_number: string | null;
  room_number: string | null;
  email: string | null;
  approved: boolean;
  role: "student" | "admin" | "primary_admin";
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profileData) return null;

    // Fetch role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    return {
      ...profileData,
      role: (roleData?.role || "student") as "student" | "admin" | "primary_admin",
    } as UserProfile;
  };

  useEffect(() => {
    // Seed primary admin on app load
    supabase.functions.invoke("seed-primary-admin").catch(() => {});

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Use setTimeout to avoid potential deadlock with Supabase client
        setTimeout(async () => {
          const p = await fetchProfile(session.user.id);
          setProfile(p);
          setLoading(false);
        }, 0);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id).then((p) => {
          setProfile(p);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (username: string, password: string) => {
    const email = `${username.toLowerCase().replace(/\s+/g, "_")}@dormconnect.app`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { success: false, message: "Invalid credentials" };
    }

    // Fetch profile to check approval
    const p = await fetchProfile(data.user.id);
    if (p && p.role === "admin" && !p.approved) {
      await supabase.auth.signOut();
      return { success: false, message: "Your account is pending approval by Primary Admin" };
    }

    setProfile(p);
    return { success: true, message: "Login successful" };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.id);
      setProfile(p);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
