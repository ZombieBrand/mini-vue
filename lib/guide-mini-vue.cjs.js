'use strict';

// 创建vnode
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children
    };
    return vnode;
}

const toString = Object.prototype.toString;
/**
 * @description: 判断值是否未某个类型
 */
function is(val, type) {
    return toString.call(val) === `[object ${type}]`;
}
/**
 * @description:  是否为函数
 */
function isFunction(val) {
    return is(val, 'Function');
}
/**
 * @description: 是否为对象
 */
const isObject = (val) => {
    return val !== null && is(val, 'Object');
};
/**
 * @description:  是否为字符串
 */
function isString(val) {
    return is(val, 'String');
}

// 用于处理组件
function createComponentInstance(vnode) {
    const type = vnode.type;
    const instance = {
        vnode,
        type,
    };
    return instance;
}
function setupComponent(instance) {
    // 初始化props 暂时不实现
    // initProps()
    // 初始化slots 暂时不实现
    // initSlots()
    setupStatefulComonent(instance);
}
// 执行setup
function setupStatefulComonent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    if (setup) {
        const setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
    finishSetupComponent(instance);
}
function handleSetupResult(instance, setupResult) {
    if (isFunction(setupResult)) ;
    else if (isObject(setupResult)) {
        instance.setupState = setupResult;
    }
}
function finishSetupComponent(instance) {
    const Component = instance.type;
    if (instance) {
        instance.render = Component.render;
    }
}

// 通过render把vnode渲染成真实dom
function render(vnode, container) {
    // 进行拆箱操作
    patch(vnode, container);
}
function patch(vnode, container) {
    // 区分patch的到底是HTML元素还是组件
    if (typeof vnode.type === 'string') {
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        processComponent(vnode, container);
    }
}
function processComponent(vnode, container) {
    mountComonent(vnode, container);
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
// 挂载Component
function mountComonent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    //
    setupRenderEffect(instance, container);
}
// 挂载Element
function mountElement(vnode, container) {
    const el = document.createElement(vnode.type);
    const { children, props } = vnode;
    if (isString(children)) {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        mountChildren(vnode, el);
    }
    for (let key of Object.getOwnPropertyNames(props).values()) {
        if (Array.isArray(props[key])) {
            el.setAttribute(key, props[key].join(' '));
        }
        else {
            el.setAttribute(key, props[key]);
        }
    }
    container.append(el);
}
// 挂载子节点
function mountChildren(vnode, container) {
    vnode.children.forEach((vnode) => {
        patch(vnode, container);
    });
}
function setupRenderEffect(instance, container) {
    // 获取到组件返回的h()函数
    const subTree = instance.render();
    // 对组件进行拆箱操作
    patch(subTree, container);
}

function createApp(rootComponent) {
    const mount = (rootContainer) => {
        const vnode = createVNode(rootComponent);
        render(vnode, rootContainer);
    };
    return {
        mount
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
