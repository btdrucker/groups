export function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));