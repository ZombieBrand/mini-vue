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
    //用于记录当前实例的状态，为ture时为调用stop方法，否则一调用，避免重复防止重复调用 stop 方法
    active = true
    onStop?: () => void
    constructor(private fn: Function, public scheduler?: Function) { }
    run() {
        // 为什么要在这里把this赋值给activeEffect呢？因为这里是fn执行之前，就是track依赖收集执行之前，又是effect开始执行之后，
        // this能捕捉到这个依赖，将这个依赖赋值给activeEffect是刚刚好的时机
        activeEffect = this
        return this.fn()
    }
    stop() {
        if (this.active) {
            clearupEffect(this)
            if (this.onStop) {
                this.onStop()
            }
            this.active = false
        }
    }
}

function clearupEffect(effect) {
    effect.deps.forEach((dep: any) => {
        dep.delete(effect)
    })
}
/**
 * vue作用域创建
 * @param fn - 运行时将被调用的函数
 */
export function effect(fn, options: any = {}) {
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
    if (!activeEffect) return
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
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
}

/**
 * 触发收集的依赖
 * @param target - 正在观察的对象
 * @param key - 正在观察的属性名称
 */
export function trigger(target: Record<EffectKey, any>, key: EffectKey) {
    let depsMap = targetMap.get(target)
    let dep = depsMap?.get(key)
    if (dep) {
        for (const effect of dep) {
            if (effect.scheduler) {
                effect.scheduler()
            } else {
                effect.run()
            }
        }
    }
}

export function stop(runner) {
    runner.effect.stop()
}