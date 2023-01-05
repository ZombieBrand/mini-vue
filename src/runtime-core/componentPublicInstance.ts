import { hasOwn } from '../utils';
// 实例property
const publicPropertiesMap = {
    $el: (i: any) => i.vnode.el,
    $slots: (i: any) => i.slots,
    $props: (i: any) => i.props
};

export const publicInstanceProxyHandlers: ProxyHandler<any> = {
    // 通过target吧instance传递给get操作
    get({ _: instance }, key: string) {
        console.log('publicInstanceProxyHandlers-----------------')
        const { setupState, props } = instance

        if (hasOwn(setupState, key)) {
            return setupState[key]
        } else if (hasOwn(props, key)) {
            return props[key]
        }

        const publicGetter = publicPropertiesMap[key]
        if (publicGetter) {
            return publicGetter(instance)
        }
        // 后续我们这里还可能会返回props、`$el`、`$slots`等等
    },
}