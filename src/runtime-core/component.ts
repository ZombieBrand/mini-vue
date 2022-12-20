// 用于处理组件
import { publicInstanceProxyHandlers } from './componentPublicInstance'
import { isFunction, isObject } from '../utils';

export function createComponentInstance(vnode: any) {
  const type = vnode.type;
  const instance = {
    vnode,
    type,
    setupState: {}
  };
  return instance;
}

export function setupComponent(instance: any) {
  // 初始化props 暂时不实现
  // initProps()
  // 初始化slots 暂时不实现
  // initSlots()
  setupStatefulComponent(instance);
}

// 执行setup
function setupStatefulComponent(instance: any) {
  const Component = instance.type;
  // 解决render返回的h()函数里面this的问题，指向setup函数
  instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandlers)
  const { setup } = Component;
  if (setup) {
    const setupResult = setup();
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
