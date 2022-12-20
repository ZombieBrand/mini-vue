'use strict';

// 创建vnode
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null
    };
    // children 
    if (typeof children === 'string') {
        vnode.shapeFlag = vnode.shapeFlag | 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag = vnode.shapeFlag | 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === 'string' ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

// 实例property
const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
};
const publicInstanceProxyHandlers = {
    // 通过target吧instance传递给get操作
    get({ _: instance }, key) {
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
        // 后续我们这里还可能会返回props、`$el`、`$slots`等等
    },
};

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

// 用于处理组件
function createComponentInstance(vnode) {
    const type = vnode.type;
    const instance = {
        vnode,
        type,
        setupState: {}
    };
    return instance;
}
function setupComponent(instance) {
    // 初始化props 暂时不实现
    // initProps()
    // 初始化slots 暂时不实现
    // initSlots()
    setupStatefulComponent(instance);
}
// 执行setup
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // 解决render返回的h()函数里面this的问题，指向setup函数
    instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandlers);
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
    const { shapeFlag } = vnode;
    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
        processElement(vnode, container);
    }
    else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
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
function mountComonent(initialVNode, container) {
    const instance = createComponentInstance(initialVNode);
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
}
// 挂载Element
function mountElement(vnode, container) {
    const el = document.createElement(vnode.type);
    const { children, props, shapeFlag } = vnode;
    // children
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        mountChildren(vnode, el);
    }
    // props
    for (let key of Object.getOwnPropertyNames(props).values()) {
        if (key === 'onClick') {
            el.addEventListener('click', props[key]);
        }
        if (Array.isArray(props[key])) {
            el.setAttribute(key, props[key].join(" "));
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
function setupRenderEffect(instance, initialVNode, container) {
    // 获取到组件返回的h()函数
    const subTree = instance.render.call(instance.proxy);
    // 对组件进行拆箱操作
    patch(subTree, container);
    // 代码到了这里，组件内的所有element已经挂在到document里面了
    initialVNode.el = subTree.el;
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
