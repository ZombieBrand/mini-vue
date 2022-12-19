import { track, trigger } from './effect';
import { ReactiveFlags, reactive, readonly } from './reactive';
import { isObjectLike } from '../utils'
const createGetter = (isReadonly = false, shallow = false) => {
    return function getter(target: object, key: PropertyKey, receiver) {
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly
        }
        if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly
        }
        const res = Reflect.get(target, key, receiver)

        // 是否浅层响应式
        if (shallow) {
            return res
        }
        // 检查获取的值是不是object
        if (isObjectLike(res)) {
            return isReadonly ? readonly(res) : reactive(res)
        }
        if (!isReadonly) {
            // 依赖收集
            track(target, key as string)
        }

        return res
    }
};

const createSetter = (isReadonly = false) => {
    return function set(target: object, key: PropertyKey, value: any): boolean {
        if (!isReadonly) {
            const res: boolean = Reflect.set(target, key, value)
            // 触发依赖
            trigger(target, key as string)
            return res
        } else {
            console.warn(`key:${key.toString()}不可更改,因为是readonly`)
            return true
        }
    }
};

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const readonlySet = createSetter(true)
const shallowReadonlyGet = createGetter(true, true)
export const mutableHandlers = {
    get,
    set
}

export const readonlyHandlers = {
    get: readonlyGet,
    set: readonlySet
}

export const shallowReadonlyHandlers = {
    get: shallowReadonlyGet,
    set: readonlySet
}