export const getAuthErrorMessage = (error, fallback) => {
    const message = String(error?.message ?? "").toLowerCase();

    if (
        error?.status === 429 ||
        /rate limit|too many requests|security purposes/.test(message)
    ) {
        return "Too many requests. Please wait a moment and try again.";
    }

    if (/invalid login credentials|invalid credentials/.test(message)) {
        return "Incorrect email or password.";
    }

    if (/email not confirmed/.test(message)) {
        return "Please confirm your email before signing in.";
    }

    if (/expired|invalid.*(link|token)|otp/.test(message)) {
        return "This link is invalid or expired. Please request a new one.";
    }

    if (/cancelled|canceled/.test(message)) {
        return "Sign-in was cancelled.";
    }

    if (/network|fetch failed|failed to fetch/.test(message)) {
        return "Unable to connect. Check your internet connection and try again.";
    }

    return fallback;
};
