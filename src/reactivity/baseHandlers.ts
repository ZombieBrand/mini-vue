import { track, trigger } from './effect';

const createGetter = (isReadonly = false) => {
    return function getter(target, key) {
        const res = Reflect.get(target, key)
        if (!isReadonly) {
            // 依赖收集
            track(target, key as string)
        }
        return res
    }
};

const createSetter = (isReadonly = false) => {
    return function set(target, key, value) {
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