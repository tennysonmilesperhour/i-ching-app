import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: true,
			retry: (failureCount, error) => {
				// Don't retry on auth errors - redirect to login instead
				if (error?.status === 401 || error?.status === 403) {
					return false;
				}
				// Retry up to 3 times for transient failures (network, 5xx)
				return failureCount < 3;
			},
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
			staleTime: 2 * 60 * 1000, // 2 minutes before data is considered stale
		},
	},
});
