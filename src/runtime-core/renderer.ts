// 通过render把vnode渲染成真实dom

import { isObject, isString } from '../utils';
import { createComponentInstance, setupComponent } from './component';
export function render(vnode: any, container: any) {
  // 进行拆箱操作
  patch(vnode, container);
}
function patch(vnode: any, container: any) {
  // 区分patch的到底是HTML元素还是组件
  if (typeof vnode.type === 'string') {
    processElement(vnode, container);
  } else if (isObject(vnode.type)) {
    processComponent(vnode, container);
  }
}
function processComponent(vnode: any, container: any) {
  mountComonent(vnode, container);
}
function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}
// 挂载Component
function mountComonent(vnode: any, container: any) {
  const instance = createComponentInstance(vnode);
  setupComponent(instance);
  //
  setupRenderEffect(instance, container);
}
// 挂载Element
function mountElement(vnode: any, container: any) {
  const el = document.createElement(vnode.type) as HTMLElement;
  const { children, props } = vnode;
  if (isString(children)) {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    mountChildren(vnode, el);
  }
  for (let key of Object.getOwnPropertyNames(props).values()) {
    if (Array.isArray(props[key])) {
      el.setAttribute(key, props[key].join(' '));
    } else {
      el.setAttribute(key, props[key]);
    }
  }
  container.append(el);
}
// 挂载子节点
function mountChildren(vnode: any, container: any) {
  vnode.children.forEach((vnode: any) => {
    patch(vnode, container);
  });
}
function setupRenderEffect(instance: any, container: any) {
  // 获取到组件返回的h()函数
  const subTree = instance.render();
  // 对组件进行拆箱操作
  patch(subTree, container);
}
