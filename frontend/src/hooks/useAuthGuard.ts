"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, gql } from "@/lib/api";

export interface AuthUser {
  id: number;
  email: string;
  roles: string[];
}

/**
 * Guards a dashboard page. Redirects to / if no valid token.
 * Optionally checks for a required role.
 */
export function useAuthGuard(requiredRole?: string): {
  user: AuthUser | null;
  loading: boolean;
} {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/");
      return;
    }

    gql<{ getMe: AuthUser }>(`query { getMe { id email roles } }`)
      .then(({ getMe }) => {
        if (
          requiredRole &&
          !getMe.roles.includes(requiredRole) &&
          !getMe.roles.includes("Admin")
        ) {
          router.replace("/");
          return;
        }
        setUser(getMe);
      })
      .catch(() => {
        router.replace("/");
      })
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
