'use strict';

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

let shouldTrack = false;
let activeEffect;
const targetMap = new WeakMap();
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.fn = fn;
        this.scheduler = scheduler;
        //用于存储与当前实例相关的响应式对象的property对应的Set实例
        this.deps = [];
        //用于记录当前实例的状态，为 true 时为调用stop方法，否则一调用，避免重复防止重复调用 stop 方法
        this.active = true;
    }
    run() {
        // 为什么要在这里把this赋值给activeEffect呢？因为这里是fn执行之前，就是track依赖收集执行之前，又是effect开始执行之后，
        // this能捕捉到这个依赖，将这个依赖赋值给activeEffect是刚刚好的时机
        if (!this.active) {
            return this.fn();
        }
        shouldTrack = true;
        activeEffect = this;
        const result = this.fn();
        shouldTrack = false;
        return result;
    }
    stop() {
        // stop(runner) 就是删除effect返回runner中构造的new ReactiveEffect实例
        // 因为trigger 的时候触发this的run方法,所以stop后trigger就不会执行effect传入的fn
        if (this.active) {
            clearupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function clearupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
/**
 * vue作用域创建
 * @param fn - 运行时将被调用的函数
 */
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    Object.assign(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(activeEffect);
    runner.effect = _effect;
    return runner;
}
/**
 * 依赖收集方法
 * @param target - 正在观察的对象
 * @param key - 正在观察的属性名称
 */
function track(target, key) {
    if (!isTracking())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
const trackEffects = (dep) => {
    // 看看dep之前是否添加过,添加过那么就不push了
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
};
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
// 正在跟踪
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}

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
        if (!isReadonly) {
            // 依赖收集
            track(target, key);
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

var _a;
var RefFlags;
(function (RefFlags) {
    RefFlags["IS_REF"] = "_v_isRef";
})(RefFlags || (RefFlags = {}));
class RefImpl {
    constructor(value) {
        this.dep = new Set();
        this[_a] = true;
        this._value = convert(value);
        this._rawValue = value;
    }
    get value() {
        trackRefValue(this.dep);
        return this._value;
    }
    set value(newValue) {
        // 检测是否和当前值相同
        if (!Object.is(newValue, this._rawValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerEffects(this.dep);
        }
    }
}
_a = RefFlags.IS_REF;
const ref = (value) => {
    const ref = new RefImpl(value);
    return ref;
};
const isRef = (value) => {
    return !!value[RefFlags.IS_REF];
};
const unRef = (value) => {
    return isRef(value) ? value.value : value;
};
const proxyRefs = (objectWithRefs) => {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            const setTarget = Reflect.get(target, key);
            if (isRef(setTarget) && !isRef(value)) {
                return Reflect.set(setTarget, 'value', value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
};
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(dep) {
    if (isTracking()) {
        trackEffects(dep);
    }
}

// 用于处理组件
function createComponentInstance(vnode, parentComponent) {
    const type = vnode.type;
    const instance = {
        vnode,
        type,
        setupState: {},
        props: {},
        slots: {},
        emit: (event) => { },
        provides: parentComponent ? parentComponent.provides : {},
        parent: parentComponent,
        isMounted: false,
        subTree: {} // 虚拟节点树
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
let currentInstance = null;
// 执行setup
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // 解决render返回的h()函数里面this的问题，指向setup函数
    instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
    finishSetupComponent(instance);
}
function handleSetupResult(instance, setupResult) {
    if (isFunction(setupResult)) ;
    else if (isObject(setupResult)) {
        instance.setupState = proxyRefs(setupResult);
    }
}
function finishSetupComponent(instance) {
    const Component = instance.type;
    if (instance) {
        instance.render = Component.render;
    }
}
const getCurrentInstance = () => {
    return currentInstance;
};
const setCurrentInstance = (instance) => {
    currentInstance = instance;
};

const provide = (key, value) => {
    // 提供者
    // key和value存在哪呢？挂在instance的provides属性上吧！
    var _a;
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = (_a = currentInstance.parent) === null || _a === void 0 ? void 0 : _a.provides;
        if (provides === parentProvides) {
            // 把provide原型指向父组件的provide
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
};
const inject = (key, defaultValue) => {
    // 接收者
    // 在哪里拿value呢？在instance的parent上面获取到父组件的instance然后点出provide
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else {
            // 找不到注入的
            // 如果默认值是函数，执行函数
            if (isFunction(defaultValue)) {
                return defaultValue();
            }
            return defaultValue;
        }
    }
};

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

function createAppApi(render) {
    return function createApp(rootComponent) {
        const mount = (rootContainer) => {
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        };
        return {
            mount
        };
    };
}

const createRenderer = (options) => {
    const { createElement, patchProp, insert } = options;
    function render(vnode, container) {
        // 进行拆箱操作
        console.log("调用 path-------");
        patch(null, vnode, container, null);
    }
    function patch(oldVNode, nextVNode, container, parentComponent) {
        // 区分patch的到底是HTML元素还是组件
        const { shapeFlag, type } = nextVNode;
        switch (type) {
            case Fragment:
                processFragment(oldVNode, nextVNode, container, parentComponent);
                break;
            case Text:
                processText(oldVNode, nextVNode, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(oldVNode, nextVNode, container, parentComponent);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(oldVNode, nextVNode, container, parentComponent);
                }
                break;
        }
    }
    function processText(oldVNode, nextVNode, container) {
        const { children } = nextVNode;
        const textNode = (nextVNode.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processFragment(oldVNode, nextVNode, container, parentComponent) {
        mountChildren(nextVNode, container, parentComponent);
    }
    function processComponent(oldVNode, nextVNode, container, parentComponent) {
        mountComponent(nextVNode, container, parentComponent);
    }
    function processElement(oldVNode, nextVNode, container, parentComponent) {
        if (!oldVNode) {
            mountElement(nextVNode, container, parentComponent);
        }
        else {
            patchElement(oldVNode, nextVNode, container);
        }
    }
    function patchElement(oldVNode, nextVNode, container) {
        console.log("patchElement----------");
        console.log("container", container);
        console.log("oldVNode", oldVNode);
        console.log("nextVNode", nextVNode);
        const oldProps = oldVNode.props || {};
        const newProps = nextVNode.props || {};
        const el = (nextVNode.el = oldVNode.el);
        patchProps(el, oldProps, newProps);
    }
    function patchProps(el, oldProps, newProps) {
        if (!Object.is(oldProps, newProps)) {
            for (const key in newProps) {
                const oldProp = oldProps[key];
                const newProp = newProps[key];
                if (!Object.is(oldProp, newProp)) {
                    patchProp(el, key, oldProp, newProp);
                }
            }
            if (Object.keys(oldProps).length > 0) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        patchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    // 挂载Component
    function mountComponent(initialVNode, container, parentComponent) {
        const instance = createComponentInstance(initialVNode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container);
    }
    // 挂载Element
    function mountElement(vnode, container, parentComponent) {
        const el = (vnode.el = createElement(vnode.type));
        const { children, props, shapeFlag } = vnode;
        // children
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (Array.isArray(children)) {
            mountChildren(vnode, el, parentComponent);
        }
        // props
        for (let key of Object.getOwnPropertyNames(props).values()) {
            patchProp(el, key, null, props[key]);
        }
        insert(el, container);
    }
    // 挂载子节点
    function mountChildren(vnode, container, parentComponent) {
        vnode.children.forEach((vnode) => {
            patch(null, vnode, container, parentComponent);
        });
    }
    function setupRenderEffect(instance, initialVNode, container) {
        effect(() => {
            if (!instance.isMounted) {
                // 获取到组件返回的h()函数
                const subTree = (instance.subTree = instance.render.call(instance.proxy));
                // 对组件进行拆箱操作
                patch(null, subTree, container, instance);
                // 代码到了这里，组件内的所有element已经挂在到document里面了
                initialVNode.el = subTree.el;
                // 初次挂载完成
                instance.isMounted = true;
            }
            else {
                const subTree = instance.render.call(instance.proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        });
    }
    return {
        createApp: createAppApi(render)
    };
};

function createElement(type) {
    console.log("createElement----------------");
    return document.createElement(type);
}
function patchProp(el, key, oldValue, nextValue) {
    console.log("patchProp-----------------");
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextValue);
    }
    if (Array.isArray(nextValue)) {
        el.setAttribute(key, nextValue.join(" "));
    }
    else if (nextValue === undefined || nextValue === null) {
        el.removeAttribute(key);
    }
    else {
        el.setAttribute(key, nextValue);
    }
}
function insert(el, container) {
    console.log("insert-------------------");
    container.append(el);
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert
});
const createApp = (...args) => {
    return renderer.createApp(...args);
};

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.effect = effect;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.renderSlots = renderSlots;
