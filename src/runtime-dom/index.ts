import { createRenderer } from "../runtime-core"
function createElement(type) {
    console.log("createElement----------------")
    return document.createElement(type)
}
function patchProp(el, key, value) {
    console.log("patchProp-----------------")
    const isOn = (key: string) => /^on[A-Z]/.test(key)
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase()
        el.addEventListener(event, value)
    }

    if (Array.isArray(value)) {
        el.setAttribute(key, value.join(" "));
    } else {
        el.setAttribute(key, value);
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