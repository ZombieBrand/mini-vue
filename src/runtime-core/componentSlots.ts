import { ShapeFlags } from "../ShapeFlags";

export const initSlots = (instance, vnodeChildren) => {
    const { vnode } = instance
    if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
        normalizeObjectSlots(vnodeChildren, instance.slots);
    }

};

function normalizeObjectSlots(vnodeChildren: any, slots: any) {
    for (const key in vnodeChildren) {
        const value = vnodeChildren[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}

function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value]
}