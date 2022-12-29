import { createRenderer } from "../runtime-core"
function createElement(type) {
    console.log("createElement----------------")
    return document.createElement(type)
}
function patchProp(el, key, oldValue, nextValue) {
    console.log("patchProp-----------------")
    const isOn = (key: string) => /^on[A-Z]/.test(key)
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase()
        el.addEventListener(event, nextValue)
    }

    if (Array.isArray(nextValue)) {
        el.setAttribute(key, nextValue.join(" "));
    } else if (nextValue === undefined || nextValue === null) {
        el.removeAttribute(key)
    } else {
        el.setAttribute(key, nextValue);
    }
}
function insert(el, container) {
    console.log("insert-------------------")
    container.append(el);
}

const renderer: any = createRenderer({
    createElement,
    patchProp,
    insert
})

export const createApp = (...args) => {
    return renderer.createApp(...args)
};

export * from "../runtime-core"