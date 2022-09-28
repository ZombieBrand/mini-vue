import { track, trigger } from './effect';
import { ReactiveFlags } from './reactive';
const createGetter = (isReadonly = false) => {
    return function getter(target, key) {
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly
        }
        if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly
        }
        const res = Reflect.get(target, key)
        if (!isReadonly) {
            // 依赖收集
            track(target, key as string)
        }
        return res
    }
};

const createSetter = (isReadonly = false) => {
    return function set(target, key, value): boolean {
        if (!isReadonly) {
            const res: boolean = Reflect.set(target, key, value)
            // 触发依赖
            trigger(target, key as string)
            return res
        } else {
            console.warn(`key:${key}不可更改,因为是readonly`)
            return true
        }
    }
};

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const readonlySet = createSetter(true)

export const mutableHandlers = {
    get,
    set
}

export const readonlyHandlers = {
    get: readonlyGet,
    set: readonlySet
}