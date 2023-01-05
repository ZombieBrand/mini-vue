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
 * @description: 是否已定义
 */
const isDef = (val) => {
    return typeof val !== 'undefined';
};
const isUnDef = (val) => {
    return !isDef(val);
};
/**
 * @description: 是否为对象
 */
const isObject = (val) => {
    return val !== null && is(val, 'Object');
};
function isNull(val) {
    return val === null;
}
function isNullAndUnDef(val) {
    return isUnDef(val) && isNull(val);
}
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
// 最长递增子序列
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

// 实例property
const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
};
const publicInstanceProxyHandlers = {
    // 通过target吧instance传递给get操作
    get({ _: instance }, key) {
        console.log('publicInstanceProxyHandlers-----------------');
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
    console.log("initProps-------------------");
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
    console.log("emit-------------------");
    // instance.props -> event
    const { props } = instance;
    // props中触发事件
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler === null || handler === void 0 ? void 0 : handler(...args);
}

const initSlots = (instance, vnodeChildren) => {
    console.log("initSlots-------------------");
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
    console.log("createComponentInstance-------------------");
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
    console.log("setupComponent-------------------");
    // 初始化props 暂时不实现
    initProps(instance, instance.vnode.props);
    // 初始化slots 暂时不实现
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
let currentInstance = null;
// 执行setup
function setupStatefulComponent(instance) {
    console.log("setupStatefulComponent-------------------");
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
    console.log("handleSetupResult-------------------");
    if (isFunction(setupResult)) ;
    else if (isObject(setupResult)) {
        instance.setupState = proxyRefs(setupResult);
    }
}
function finishSetupComponent(instance) {
    console.log("finishSetupComponent-------------------");
    const Component = instance.type;
    if (instance) {
        instance.render = Component.render;
    }
}
const getCurrentInstance = () => {
    console.log("getCurrentInstance-------------------");
    return currentInstance;
};
const setCurrentInstance = (instance) => {
    console.log("setCurrentInstance-------------------");
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
    console.log("createVNode-------------------");
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        key: props && props.key,
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
    console.log("createTextVNode-------------------");
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
    console.log('createRenderer----------');
    const { createElement, patchProp, insert, remove, setElementText } = options;
    function render(vnode, container) {
        // 进行拆箱操作
        console.log("render 调用 path-------");
        patch(null, vnode, container, null, null);
    }
    function patch(oldVNode, nextVNode, container, parentComponent, anchor) {
        console.log("path-------");
        // 区分patch的到底是HTML元素还是组件
        const { shapeFlag, type } = nextVNode;
        switch (type) {
            case Fragment:
                processFragment(oldVNode, nextVNode, container, parentComponent, anchor);
                break;
            case Text:
                processText(oldVNode, nextVNode, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(oldVNode, nextVNode, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(oldVNode, nextVNode, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processText(oldVNode, nextVNode, container) {
        console.log('processText-----------');
        const { children } = nextVNode;
        const textNode = (nextVNode.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processFragment(oldVNode, nextVNode, container, parentComponent, anchor) {
        console.log('processFragment-----------');
        mountChildren(nextVNode.children, container, parentComponent, anchor);
    }
    function processComponent(oldVNode, nextVNode, container, parentComponent, anchor) {
        console.log('processComponent-----------');
        mountComponent(nextVNode, container, parentComponent, anchor);
    }
    function processElement(oldVNode, nextVNode, container, parentComponent, anchor) {
        console.log('processElement-----------');
        if (!oldVNode) {
            mountElement(nextVNode, container, parentComponent, anchor);
        }
        else {
            patchElement(oldVNode, nextVNode, container, parentComponent, anchor);
        }
    }
    function patchElement(oldVNode, nextVNode, container, parentComponent, anchor) {
        console.log("patchElement----------");
        console.log("container", container);
        console.log("oldVNode", oldVNode);
        console.log("nextVNode", nextVNode);
        const oldProps = oldVNode.props || {};
        const newProps = nextVNode.props || {};
        const el = (nextVNode.el = oldVNode.el);
        patchChildren(oldVNode, nextVNode, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(oldVNode, nextVNode, container, parentComponent, anchor) {
        console.log('patchChildren-----------');
        const oldShapeFlag = oldVNode.shapeFlag;
        const nextShapeFlag = nextVNode.shapeFlag;
        const nextChildren = nextVNode.children;
        const oldChildren = oldVNode.children;
        if (nextShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            if (oldShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 1. 把老children清空
                unmountChildren(oldVNode.children);
            }
            // 2. 设置text
            if (oldChildren !== nextChildren) {
                setElementText(container, nextChildren);
            }
        }
        else {
            if (oldShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                setElementText(container, "");
                mountChildren(nextChildren, container, parentComponent, anchor);
            }
            else {
                // array diff array
                patchKeyedChildren(oldChildren, nextChildren, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(oldChildren, nextChildren, container, parentComponent, parentAnchor) {
        console.log('patchKeyedChildren-----------');
        let i = 0;
        let e1 = oldChildren.length - 1;
        let e2 = nextChildren.length - 1;
        let l2 = nextChildren.length;
        //  左侧
        while (i <= e1 && i <= e2) {
            const n1 = oldChildren[i];
            const n2 = nextChildren[i];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // 右侧
        while (i <= e1 && i <= e2) {
            const n1 = oldChildren[e1];
            const n2 = nextChildren[e2];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 新的比老的多 创建
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anchor = e2 + 1 < l2 ? nextChildren[nextPos].el : null;
                while (i <= e2) {
                    patch(null, nextChildren[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            while (i <= e1) {
                remove(oldChildren[i].el);
                i++;
            }
        }
        else {
            // 中间乱序处理
            let s1 = i;
            let s2 = i;
            const toBePatched = e2 - s2 + 1;
            let patched = 0;
            const keyToNewIndexMap = new Map();
            let newIndexToOldIndexMap = new Array(toBePatched);
            for (let i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0;
            let moved = false;
            let maxNewIndexSoFar = 0;
            for (let i = s2; i <= e2; i++) {
                let nextChild = nextChildren[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            let newIndex;
            for (i = s1; i <= e1; i++) {
                const prevChild = oldChildren[i];
                if (patched >= toBePatched) {
                    remove(prevChild.el);
                    continue;
                }
                if (!isNullAndUnDef(prevChild.key)) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j <= e2; j++) {
                        if (isSomeVNodeType(prevChild, nextChildren[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    remove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, nextChildren[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = nextChildren[nextIndex];
                const anchor = nextIndex + 1 < l2 ? nextChildren[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        console.log('移动');
                        insert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    function isSomeVNodeType(n1, n2) {
        return n1.type === n2.type && n1.key === n2.key;
    }
    function unmountChildren(children) {
        console.log('unmountChildren-----------');
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            remove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        console.log('patchProps-----------');
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
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        console.log('mountComponent-----------');
        const instance = createComponentInstance(initialVNode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    // 挂载Element
    function mountElement(vnode, container, parentComponent, anchor) {
        console.log('mountElement-----------');
        const el = (vnode.el = createElement(vnode.type));
        const { children, props, shapeFlag } = vnode;
        // children
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (Array.isArray(children)) {
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        // props
        for (let key of Object.getOwnPropertyNames(props).values()) {
            patchProp(el, key, null, props[key]);
        }
        insert(el, container, anchor);
    }
    // 挂载子节点
    function mountChildren(children, container, parentComponent, anchor) {
        console.log('mountChildren-----------');
        children.forEach((vnode) => {
            patch(null, vnode, container, parentComponent, anchor);
        });
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        console.log('setupRenderEffect-----------');
        effect(() => {
            if (!instance.isMounted) {
                // 获取到组件返回的h()函数
                const subTree = (instance.subTree = instance.render.call(instance.proxy));
                // 对组件进行拆箱操作
                patch(null, subTree, container, instance, anchor);
                // 代码到了这里，组件内的所有element已经挂在到document里面了
                initialVNode.el = subTree.el;
                // 初次挂载完成
                instance.isMounted = true;
            }
            else {
                const subTree = instance.render.call(instance.proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
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
function insert(el, container, anchor) {
    console.log("insert-------------------");
    container.insertBefore(el, anchor || null);
}
function remove(child) {
    console.log("remove-------------------");
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    console.log("setElementText-------------------");
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
});
const createApp = (...args) => {
    console.log("createApp-------------------");
    return renderer.createApp(...args);
};

export { createApp, createRenderer, createTextVNode, effect, getCurrentInstance, h, inject, provide, proxyRefs, ref, renderSlots };
