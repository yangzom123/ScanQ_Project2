import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { View, Text } from 'react-native';

const NetworkCtx = createContext(false);
export const useOffline = () => useContext(NetworkCtx);

export function OfflineBanner() {
  const offline = useOffline();
  if (!offline) return null;
  return (
    <View style={{ backgroundColor: '#b45309', paddingVertical: 6, alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>You're offline. Some actions are unavailable.</Text>
    </View>
  );
}

export function NetworkProvider({ children }) {
  const [offline, setOffline] = useState(false);

  useEffect(() => NetInfo.addEventListener((state) => {
    setOffline(state.isConnected === false || state.isInternetReachable === false);
  }), []);

  return <NetworkCtx.Provider value={offline}>{children}</NetworkCtx.Provider>;
}
