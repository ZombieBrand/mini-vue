import { createVNode } from './vnode';

export const renderSlots = (slots, name: string) => {

    const slot = slots[name]

    if (slot) {
        return createVNode("div", {}, slots)
    }

};
