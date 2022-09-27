import { isBlank } from '../utils'

let activeEffect
class ReactiveEffect {
    deps = []
    active = true
    onStop?: () => void
    constructor(private fn: Function, public scheduler?: Function) { }
    run() {
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
// 收集依赖数据
const targetMap = new Map()

/**
 * 依赖收集方法
 * @param target - 正在观察的对象
 * @param key - 正在观察的属性名称
 */
export function track(target, key) {
    let depsMap = targetMap.get(target)
    if (isBlank(depsMap)) {
        depsMap = new Map()
        targetMap.set(target, depsMap)
    }
    let dep = depsMap.get(key)
    if (isBlank(dep)) {
        dep = new Set()
        depsMap.set(key, dep)
    }

    if (!activeEffect) return
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
}

/**
 * 触发收集的依赖
 * @param target - 正在观察的对象
 * @param key - 正在观察的属性名称
 */
export function trigger(target, key) {
    let depsMap = targetMap.get(target)
    let dep = depsMap.get(key)
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler()
        } else {
            effect.run()
        }
    }
}

export function stop(runner) {
    runner.effect.stop()
}