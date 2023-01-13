import { deepEqual } from "@mini-vue/shared/src/utils";

export const shouldUpdateComponent = (oldVNode, nextVNode) => {
    const { props: oldProps } = oldVNode
    const { props: nextProps } = nextVNode
    console.log(deepEqual(oldProps,nextProps))
    return !deepEqual(oldProps,nextProps)
};
