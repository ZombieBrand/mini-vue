import { ReactiveEffect } from '../../reactivity/src/effect';
import { queuePreFlushCb } from './scheduler';

type OnCleanup = (cleanupFn: () => void) => void

export const watchEffect = (source: (onCleanup: OnCleanup) => void) => {

    const _reactiveFunc = new ReactiveEffect(getter, () => {
        queuePreFlushCb(job)
    })

    let cleanup
    const onCleanup = (fn) => {
        cleanup = fn
        _reactiveFunc.onStop = () => {
            fn()
        }
    }

    function getter() {
        if (cleanup) {
            cleanup()
        }
        source(onCleanup)
    }

    function job() {
        _reactiveFunc.run()
    }

    _reactiveFunc.run()

    return () => {
        _reactiveFunc.stop()
    }
};
