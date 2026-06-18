import { useInsuredPersonsRefreshStore } from '@/features/insured_persons/store/insuredPersonsRefreshStore';

// Composable wrapper around the Pinia store for backward compatibility and convenience
export function useInsuredPersonsRefresh() {
  const store = useInsuredPersonsRefreshStore();
  
  return {
    refresh: () => store.triggerRefresh(),
    refreshTrigger: store.refreshTrigger,
  };
}

// Backward compatibility - provideInsuredPersonsRefresh is no longer needed
// but keeping as a no-op function to avoid breaking existing code
export function provideInsuredPersonsRefresh() {
  // Store-based approach doesn't require explicit provider
  // Just return the store methods for compatibility
  return useInsuredPersonsRefresh();
}
