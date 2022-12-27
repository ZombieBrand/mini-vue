'use strict';

const Fragment = Symbol("Fragment");
const Text = Symbol('Text');
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
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlag = vnode.shapeFlag | 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === 'string' ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}
const createTextVNode = (text) => {
    return createVNode(Text, {}, text);
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
function isObjectLike(value) {
    return value != null && typeof value == 'object';
}
const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);
// 第一个字母转换大写
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
// 兼容方案,add-num -> addNum
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
};
// 用户传入事件名添加on
const toHandlerKey = (event) => {
    return event ? "on" + capitalize(event) : '';
};

// 实例property
const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
};
const publicInstanceProxyHandlers = {
    // 通过target吧instance传递给get操作
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
        // 后续我们这里还可能会返回props、`$el`、`$slots`等等
    },
};

const initProps = (instance, rawProps) => {
    instance.props = rawProps || {};
};

const targetMap = new WeakMap();
/**
 * 触发收集的依赖
 * @param target - 正在观察的对象
 * @param key - 正在观察的属性名称
 */
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap === null || depsMap === void 0 ? void 0 : depsMap.get(key);
    if (dep) {
        triggerEffects(dep);
    }
}
const triggerEffects = (dep) => {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
};

const createGetter = (isReadonly = false, shallow = false) => {
    return function getter(target, key, receiver) {
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        }
        if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        const res = Reflect.get(target, key, receiver);
        // 是否浅层响应式
        if (shallow) {
            return res;
        }
        // 检查获取的值是不是object
        if (isObjectLike(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
};
const createSetter = (isReadonly = false) => {
    return function set(target, key, value) {
        if (!isReadonly) {
            const res = Reflect.set(target, key, value);
            // 触发依赖
            trigger(target, key);
            return res;
        }
        else {
            console.warn(`key:${key.toString()}不可更改,因为是readonly`);
            return true;
        }
    };
};
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const readonlySet = createSetter(true);
const shallowReadonlyGet = createGetter(true, true);
const mutableHandlers = {
    get,
    set
};
const readonlyHandlers = {
    get: readonlyGet,
    set: readonlySet
};
const shallowReadonlyHandlers = {
    get: shallowReadonlyGet,
    set: readonlySet
};

function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
const readonly = (raw) => {
    return createReactiveObject(raw, readonlyHandlers);
};
const shallowReadonly = (raw) => {
    return createReactiveObject(raw, shallowReadonlyHandlers);
};
function createReactiveObject(raw, baseHandlers) {
    if (!isObject(raw)) {
        console.warn('不是一个对象' + raw);
        return raw;
    }
    return new Proxy(raw, baseHandlers);
}
var ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
})(ReactiveFlags || (ReactiveFlags = {}));

function emit(instance, event, ...args) {
    // instance.props -> event
    const { props } = instance;
    // props中触发事件
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler === null || handler === void 0 ? void 0 : handler(...args);
}

const initSlots = (instance, vnodeChildren) => {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(vnodeChildren, instance.slots);
    }
};
function normalizeObjectSlots(vnodeChildren, slots) {
    for (const key in vnodeChildren) {
        const value = vnodeChildren[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

// 用于处理组件
function createComponentInstance(vnode) {
    const type = vnode.type;
    const instance = {
        vnode,
        type,
        setupState: {},
        props: {},
        slots: {},
        emit: (event) => { }
    };
    instance.emit = emit.bind(null, instance);
    return instance;
}
function setupComponent(instance) {
    // 初始化props 暂时不实现
    initProps(instance, instance.vnode.props);
    // 初始化slots 暂时不实现
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
// 执行setup
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // 解决render返回的h()函数里面this的问题，指向setup函数
    instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
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

function render(vnode, container) {
    // 进行拆箱操作
    patch(vnode, container);
}
function patch(vnode, container) {
    // 区分patch的到底是HTML元素还是组件
    const { shapeFlag, type } = vnode;
    switch (type) {
        case Fragment:
            processFragment(vnode, container);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                processElement(vnode, container);
            }
            else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                processComponent(vnode, container);
            }
            break;
    }
}
function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
}
function processFragment(vnode, container) {
    mountChildren(vnode, container);
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
// 挂载Component
function mountComponent(initialVNode, container) {
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
        const isOn = (key) => /^on[A-Z]/.test(key);
        if (isOn(key)) {
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, props[key]);
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

const renderSlots = (slots, name, props) => {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            return createVNode(Fragment, {}, slot(props));
        }
    }
};

exports.createApp = createApp;
exports.createTextVNode = createTextVNode;
exports.h = h;
exports.renderSlots = renderSlots;
