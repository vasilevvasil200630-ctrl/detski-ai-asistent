"use client";

import { useEffect, useState } from "react";
import { getMe, type MeUser } from "@/lib/client/me";

/** Текущият учител в клиентски компонент. `loading` е true до първия отговор. */
export function useMe(): { user: MeUser | null; loading: boolean; reload: () => void } {
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getMe({ fresh: tick > 0 })
      .then((data) => {
        if (!cancelled && data) setUser(data.user);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  useEffect(() => {
    const onChange = () => setTick((t) => t + 1);
    window.addEventListener("detski-auth-changed", onChange);
    return () => window.removeEventListener("detski-auth-changed", onChange);
  }, []);

  return { user, loading, reload: () => setTick((t) => t + 1) };
}
