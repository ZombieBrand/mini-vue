export const initSlots = (instance, vnodeChildren) => {

    const slots = {}
    for (const key in vnodeChildren) {
        const value = vnodeChildren[key];
        slots[key] = Array.isArray(value) ? value : [value]
    }
    instance.slots = slots
    
};