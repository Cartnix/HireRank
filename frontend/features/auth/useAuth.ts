import { createClient } from "@/shared/utils/supabase/client";
import { useState } from "react";

export const useAuth = () => {
  const supabase = createClient();
  const [isLoading, setLoading] = useState(false);

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    return { data, error };
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    return error
  };

  return { signIn, signUp, signOut, isLoading };
};
