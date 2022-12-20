import { hasOwn } from '../utils'
// 实例property
const publicPropertiesMap = {
    $el: (i: any) => i.vnode.el,
    $slots: (i: any) => i.slots,
};

export const publicInstanceProxyHandlers: ProxyHandler<any> = {
    // 通过target吧instance传递给get操作
    get({ _: instance }, key: string) {
        const { setupState } = instance

        if (key in setupState) {
            return setupState[key]
        }
        const publicGetter = publicPropertiesMap[key]
        if (publicGetter) {
            return publicGetter(instance)
        }
        // 后续我们这里还可能会返回props、`$el`、`$slots`等等
    },
}