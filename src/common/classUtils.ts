export function classes(...classes: (string | null | undefined | false | string[])[]): string {
    return classes.flat()
        .filter(it => it)  // Remove falsy items.
        .join(" ")
}
