import { createRenderer } from "@mini-vue/runtime-core"
export * from "@mini-vue/runtime-core"
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

function insert(el, container, anchor) {
    console.log("insert-------------------")
    container.insertBefore(el, anchor || null)
}

function remove(child) {
    console.log("remove-------------------")
    const parent = child.parentNode
    if (parent) {
        parent.removeChild(child)
    }
}

function setElementText(el, text) {
    console.log("setElementText-------------------")
    el.textContent = text
}

const renderer: any = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
})

export const createApp = (...args) => {
    console.log("createApp-------------------")
    return renderer.createApp(...args)
};

