import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';
import { upsertUserByDevice } from '../services/users';

type User = { id: string; nickname?: string | null } | null;

type Ctx = {
  user: User;
  setNickname: (nickname: string) => Promise<void>;
};

const UserContext = createContext<Ctx | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    (async () => {
      const storedId = await SecureStore.getItemAsync('user_id');
      let deviceId: string | undefined = undefined;
      if (Application.androidId) {
        deviceId = Application.androidId;
      } else if ('getIosIdForVendorAsync' in Application) {
        try {
          // @ts-ignore
          deviceId = await Application.getIosIdForVendorAsync();
        } catch {}
      }
      const created = await upsertUserByDevice(deviceId ?? storedId ?? 'unknown-device');
      setUser({ id: created.id, nickname: created.nickname });
      if (!storedId) await SecureStore.setItemAsync('user_id', created.id);
    })();
  }, []);

  const value = useMemo<Ctx>(() => ({
    user,
    setNickname: async (nickname: string) => {
      if (!user) return;
      const updated = await upsertUserByDevice(undefined, user.id, nickname);
      setUser(updated);
    },
  }), [user]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
};


