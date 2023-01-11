import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from './baseHandlers'
import { isObjectLike } from '../utils';

export function reactive(raw: Record<string, any>) {
    return createReactiveObject(raw, mutableHandlers)
}

export const readonly = (raw: Record<string, any>) => {
    return createReactiveObject(raw, readonlyHandlers)
};

export const shallowReadonly = (raw: Record<string, any>) => {
    return createReactiveObject(raw, shallowReadonlyHandlers)
}

function createReactiveObject(raw: Record<string, any>, baseHandlers: ProxyHandler<any>) {
    if (!isObjectLike(raw)) {
        console.warn('不是一个对象' + raw)
        return raw
    }
    return new Proxy(raw, baseHandlers)
}
// 如果是proxy,会触发get中判断是否不是readonly的reactive,否则获取是不存在值返回undefind
export const isReactive = (value: object) => {
    return !!Reflect.get(value, ReactiveFlags.IS_REACTIVE)
};
export const isReadonly = (value: object) => {
    return !!Reflect.get(value, ReactiveFlags.IS_READONLY)
}
export const isProxy = (value: object) => {
    return isReactive(value) || isReadonly(value)
};

export enum ReactiveFlags {
    IS_REACTIVE = "__v_isReactive",
    IS_READONLY = "__v_isReadonly"
}
