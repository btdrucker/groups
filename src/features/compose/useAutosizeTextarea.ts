import { useRef, useLayoutEffect } from "react";

export function useAutosizeTextarea(value: string): React.RefObject<HTMLTextAreaElement> {
    const ref = useRef<HTMLTextAreaElement>(null);

    useLayoutEffect(() => {
        const textarea = ref.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
        }
    }, [value]);

    return ref as React.RefObject<HTMLTextAreaElement>;
}
