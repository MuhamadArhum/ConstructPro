import { useEffect } from 'react';
import { API_BASE_URL } from '../utils/constants';

const PING_INTERVAL_MS = 10 * 60 * 1000; // ping every 10 minutes

export function useKeepAlive() {
  useEffect(() => {
    const healthUrl = `${API_BASE_URL}/health`;

    const ping = () => fetch(healthUrl, { method: 'GET' }).catch(() => {});

    ping(); // ping immediately on mount
    const id = setInterval(ping, PING_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
}
