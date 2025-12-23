
/**
 * Decodes a JWT payload (base64) without validation (validation happens on server).
 */
export const parseJwt = (token: string): any => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            window.atob(base64)
                .split('')
                .map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

/**
 * Checks if the token is expired or expiring within a specific threshold (buffer).
 * @param token The JWT string
 * @param bufferSeconds Time in seconds before actual expiration to consider it "expired" for refresh purposes
 */
export const isTokenExpiringSoon = (token: string, bufferSeconds: number = 120): boolean => {
    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) return true; // If invalid, treat as expired

    const now = Math.floor(Date.now() / 1000);
    const timeLeft = decoded.exp - now;

    return timeLeft < bufferSeconds;
};
