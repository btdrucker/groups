export function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const supportsShare = typeof navigator !== 'undefined' && !!navigator.share;

export function classes(...classes: (string | null | undefined | false | string[])[]): string {
    return classes.flat()
        .filter(it => it)  // Remove falsy items.
        .join(" ")
}
