// 用于处理组件
import { publicInstanceProxyHandlers } from './componentPublicInstance'
import { isFunction, isObject } from '../utils';
import { initProps } from './componentProps'
import { shallowReadonly } from '../reactivity/reactive';
import { emit } from './componentEmit';
import { initSlots } from './componentSlots';

export function createComponentInstance(vnode: any) {
  const type = vnode.type;
  const instance = {
    vnode,
    type,
    setupState: {},
    props: {},
    slots: {},
    emit: (event) => { }
  };
  instance.emit = emit.bind(null, instance)
  return instance;
}

export function setupComponent(instance: any) {
  // 初始化props 暂时不实现
  initProps(instance, instance.vnode.props)
  // 初始化slots 暂时不实现
  initSlots(instance, instance.vnode.children)
  setupStatefulComponent(instance);
}
let currentInstance = null
// 执行setup
function setupStatefulComponent(instance: any) {
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
  if (isFunction(setupResult)) {
    // 这里处理setup的返回值是h()函数的情况
  } else if (isObject(setupResult)) {
    instance.setupState = setupResult;
  }
}

function finishSetupComponent(instance: any) {
  const Component = instance.type;
  if (instance) {
    instance.render = Component.render;
  }
}


export const getCurrentInstance = () => {
  return currentInstance
};
export const setCurrentInstance = (instance) => {
  currentInstance = instance
};
