import { trackEffects, triggerEffects, isTracking } from './effect';
import { isObject } from '../utils';
import { reactive } from './reactive';

export enum RefFlags {
    IS_REF = "_v_isRef",
}
class RefImpl {
    public dep = new Set()
    private _rawValue
    private _value
    public [RefFlags.IS_REF] = true
    constructor(value) {
        this._value = convert(value)
        this._rawValue = value
    }
    get value() {
        trackRefValue(this.dep)
        return this._value
    }
    set value(newValue) {
        // 检测是否和当前值相同
        if (!Object.is(newValue, this._rawValue)) {
            this._rawValue = newValue
            this._value = convert(newValue)
            triggerEffects(this.dep)
        }
    }
}
export const ref = (value) => {
    const ref = new RefImpl(value)
    return ref
};
export const isRef = (value) => {
    return !!value[RefFlags.IS_REF]
};
export const unRef = (value) => {
    return isRef(value) ? value.value : value
};

export const proxyRefs = (objectWithRefs) => {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key))
        },
        set(target, key, value) {
            const setTarget = Reflect.get(target, key)
            if (isRef(setTarget) && !isRef(value)) {
                return Reflect.set(setTarget, 'value', value)
            } else {
                return Reflect.set(target, key, value)
            }
        }
    })
};

function convert(value) {
    return isObject(value) ? reactive(value) : value

}
function trackRefValue(dep) {
    if (isTracking()) {
        trackEffects(dep)
    }
}
