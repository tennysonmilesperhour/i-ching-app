const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (isNode) {
		return defaultValue;
	}
	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const urlParams = new URLSearchParams(window.location.search);
	const searchParam = urlParams.get(paramName);
	if (removeFromUrl) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;
		window.history.replaceState({}, document.title, newUrl);
	}
	if (searchParam) {
		storage.setItem(storageKey, searchParam);
		return searchParam;
	}
	if (defaultValue) {
		storage.setItem(storageKey, defaultValue);
		return defaultValue;
	}
	const storedValue = storage.getItem(storageKey);
	if (storedValue) {
		return storedValue;
	}
	return null;
}

const getAppParams = () => {
	if (getAppParamValue("clear_access_token") === 'true') {
		storage.removeItem('base44_access_token');
		storage.removeItem('token');
	}
	return {
		appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getAppParamValue("from_url", { defaultValue: window.location.href }),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL }),
	}
}

// Session keepalive: refresh token before it expires and recover on visibility change
const SESSION_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

function startSessionKeepalive() {
	if (isNode) return;

	// Periodically check and refresh the token
	setInterval(() => {
		const token = storage.getItem('base44_access_token');
		if (token) {
			// Touch the stored timestamp to keep the session alive
			storage.setItem('base44_session_last_active', Date.now().toString());
		}
	}, SESSION_REFRESH_INTERVAL);

	// Re-validate session when the tab regains focus after being hidden
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') {
			const lastActive = storage.getItem('base44_session_last_active');
			const now = Date.now();
			const elapsed = lastActive ? now - parseInt(lastActive, 10) : Infinity;

			// If the tab was inactive for more than 30 minutes, reload to re-auth
			if (elapsed > 30 * 60 * 1000) {
				const token = storage.getItem('base44_access_token');
				if (!token) {
					window.location.reload();
					return;
				}
			}
			storage.setItem('base44_session_last_active', now.toString());
		}
	});
}

startSessionKeepalive();

export const appParams = {
	...getAppParams()
}
