import { mutableHandlers, readonlyHandlers } from './baseHandlers'

export function reactive(raw: Record<string, any>) {
    return createActiveObject(raw, mutableHandlers)
}

export const readonly = (raw: Record<string, any>) => {
    return createActiveObject(raw, readonlyHandlers)
};

function createActiveObject(raw, baseHandlers) {
    return new Proxy(raw, baseHandlers)
}