import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isNativePlatform } from '@/lib/platform';
import {
  readSupporterBackground,
  saveSupporterBackground,
  isSupporterPreview,
  supporterStore,
} from '@/lib/supporter';

const SupporterContext = createContext(null);

const EMPTY_STATUS = {
  available: false,
  entitled: false,
  productId: null,
  displayName: 'Supporter Upgrade',
  displayPrice: null,
  description: null,
  activeIcon: 'standard',
};

const PREVIEW_STATUS = {
  ...EMPTY_STATUS,
  available: true,
  productId: 'com.thefreeiching.app.supporter',
  displayPrice: '$9.99',
};

export function SupporterProvider({ children }) {
  const [preview] = useState(isSupporterPreview);
  const [native] = useState(() => isNativePlatform());
  const [status, setStatus] = useState(() => preview ? PREVIEW_STATUS : EMPTY_STATUS);
  const [loading, setLoading] = useState(native && !preview);
  const [background, setBackgroundState] = useState(readSupporterBackground);

  const refresh = useCallback(async () => {
    if (preview) return PREVIEW_STATUS;
    if (!native) return EMPTY_STATUS;

    setLoading(true);
    try {
      const next = await supporterStore.getStatus();
      setStatus({ ...EMPTY_STATUS, ...next });
      return next;
    } finally {
      setLoading(false);
    }
  }, [native, preview]);

  useEffect(() => {
    if (!native || preview) return undefined;

    refresh().catch(() => setLoading(false));
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [native, preview, refresh]);

  const purchase = useCallback(async () => {
    const result = await supporterStore.purchase();
    await refresh();
    return result;
  }, [refresh]);

  const restorePurchases = useCallback(async () => {
    const result = await supporterStore.restorePurchases();
    await refresh();
    return result;
  }, [refresh]);

  const setGildedIcon = useCallback(async (gilded) => {
    const result = await supporterStore.setGildedIcon(gilded);
    setStatus((current) => ({ ...current, activeIcon: result.activeIcon }));
    return result;
  }, []);

  const setBackground = useCallback((value) => {
    setBackgroundState(saveSupporterBackground(value));
  }, []);

  const value = useMemo(() => ({
    native,
    loading,
    ...status,
    background,
    activeBackground: status.entitled ? background : 'parchment',
    refresh,
    purchase,
    restorePurchases,
    setGildedIcon,
    setBackground,
  }), [native, loading, status, background, refresh, purchase, restorePurchases, setGildedIcon, setBackground]);

  return <SupporterContext.Provider value={value}>{children}</SupporterContext.Provider>;
}

export function useSupporter() {
  const value = useContext(SupporterContext);
  if (!value) throw new Error('useSupporter must be used within SupporterProvider');
  return value;
}
