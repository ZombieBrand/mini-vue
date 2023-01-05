// 用于处理组件
import { publicInstanceProxyHandlers } from './componentPublicInstance'
import { isFunction, isObject } from '../utils';
import { initProps } from './componentProps'
import { shallowReadonly } from '../reactivity/reactive';
import { emit } from './componentEmit';
import { initSlots } from './componentSlots';
import { proxyRefs } from '../reactivity';

export function createComponentInstance(vnode: any, parentComponent) {
  console.log("createComponentInstance-------------------")
  const type = vnode.type;
  const instance = {
    vnode,
    type,
    setupState: {},
    props: {},
    slots: {},
    next: null, // 下次更新虚拟节点
    emit: (event) => { },
    provides: parentComponent ? parentComponent.provides : {} as Record<string, any>, // 新增
    parent: parentComponent, // 新增  父组件的组件实例
    isMounted: false,
    subTree: {} // 虚拟节点树
  };
  instance.emit = emit.bind(null, instance)
  return instance;
}

export function setupComponent(instance: any) {
  console.log("setupComponent-------------------")
  // 初始化props 暂时不实现
  initProps(instance, instance.vnode.props)
  // 初始化slots 暂时不实现
  initSlots(instance, instance.vnode.children)
  setupStatefulComponent(instance);
}
let currentInstance = null
// 执行setup
function setupStatefulComponent(instance: any) {
  console.log("setupStatefulComponent-------------------")
  const Component = instance.type;
  // 解决render返回的h()函数里面this的问题，指向setup函数
  instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandlers)
  const { setup } = Component;
  if (setup) {
    setCurrentInstance(instance)
    const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
    setCurrentInstance(null)
    handleSetupResult(instance, setupResult)
  }
  finishSetupComponent(instance);
}

function handleSetupResult(instance: any, setupResult: any) {
  console.log("handleSetupResult-------------------")
  if (isFunction(setupResult)) {
    // 这里处理setup的返回值是h()函数的情况
  } else if (isObject(setupResult)) {
    instance.setupState = proxyRefs(setupResult)
  }
}

function finishSetupComponent(instance: any) {
  console.log("finishSetupComponent-------------------")
  const Component = instance.type;
  if (instance) {
    instance.render = Component.render;
  }
}


export const getCurrentInstance = () => {
  console.log("getCurrentInstance-------------------")
  return currentInstance
};

export const setCurrentInstance = (instance) => {
  console.log("setCurrentInstance-------------------")
  currentInstance = instance
};
