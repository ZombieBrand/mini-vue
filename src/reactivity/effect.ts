let shouldTrack = false
let activeEffect: ReactiveEffect
// 收集依赖的数据结构
// targetMap : {
//   target : {
//     deps: [eff, eff1, eff2]
//   }
// }
type EffectKey = string
const targetMap = new WeakMap<Record<EffectKey, any>, Map<EffectKey, Set<ReactiveEffect>>>()
class ReactiveEffect {
    //用于存储与当前实例相关的响应式对象的property对应的Set实例
    deps: Set<ReactiveEffect>[] = []
    //用于记录当前实例的状态，为 true 时为调用stop方法，否则一调用，避免重复防止重复调用 stop 方法
    active = true
    onStop?: () => void
    constructor(private fn: Function, public scheduler?: Function) { }
    run() {
        // 为什么要在这里把this赋值给activeEffect呢？因为这里是fn执行之前，就是track依赖收集执行之前，又是effect开始执行之后，
        // this能捕捉到这个依赖，将这个依赖赋值给activeEffect是刚刚好的时机
        if (!this.active) {
            return this.fn()
        }
        shouldTrack = true
        activeEffect = this
        const result = this.fn()
        shouldTrack = false
        return result
    }
    stop() {
        // stop(runner) 就是删除effect返回runner中构造的new ReactiveEffect实例
        // 因为trigger 的时候触发this的run方法,所以stop后trigger就不会执行effect传入的fn
        if (this.active) {
            clearupEffect(this)
            if (this.onStop) {
                this.onStop()
            }
            this.active = false
        }
    }
}

function clearupEffect(effect: ReactiveEffect) {
    effect.deps.forEach((dep: any) => {
        dep.delete(effect)
    })
    effect.deps.length = 0
}
/**
 * vue作用域创建
 * @param fn - 运行时将被调用的函数
 */
export function effect(fn: Function, options: any = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler)

    Object.assign(_effect, options)

    _effect.run()

    const runner: any = _effect.run.bind(activeEffect)
    runner.effect = _effect

    return runner
}



/**
 * 依赖收集方法
 * @param target - 正在观察的对象
 * @param key - 正在观察的属性名称
 */
export function track(target: Record<EffectKey, any>, key: EffectKey) {
    if (!isTracking()) return

    let depsMap = targetMap.get(target)

    if (!depsMap) {
        depsMap = new Map()
        targetMap.set(target, depsMap)
    }

    let dep = depsMap.get(key)

    if (!dep) {
        dep = new Set()
        depsMap.set(key, dep)
    }

    trackEffects(dep)
}

export const trackEffects = (dep: Set<any>) => {
    // 看看dep之前是否添加过,添加过那么就不push了
    if (dep.has(activeEffect)) return
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
};

/**
 * 触发收集的依赖
 * @param target - 正在观察的对象
 * @param key - 正在观察的属性名称
 */
export function trigger(target: Record<EffectKey, any>, key: EffectKey) {
    let depsMap = targetMap.get(target)
    let dep = depsMap?.get(key)
    if (dep) {
        triggerEffects(dep)
    }
}

export const triggerEffects = (dep: Set<any>) => {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler()
        } else {
            effect.run()
        }
    }
};

// 停止追踪
export function stop(runner) {
    runner.effect.stop()
}

// 正在跟踪
export function isTracking() {
    return shouldTrack && activeEffect !== undefined
}