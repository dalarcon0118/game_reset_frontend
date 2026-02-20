export const NetworkUtils = {
    /**
     * Detects if an error is related to network connectivity issues.
     * This helps to decide whether to trigger offline mode or show a network error.
     */
    isNetworkError: (error: any): boolean => {
        if (!error) return false;
        
        const errorMsg = (error.message || error.toString()).toLowerCase();
        
        return (
            errorMsg.includes('network request failed') ||
            errorMsg.includes('failed to fetch') ||
            errorMsg.includes('timeout') ||
            errorMsg.includes('aborted') ||
            // React Native specific
            errorMsg.includes('internet connection appears to be offline')
        );
    }
};
