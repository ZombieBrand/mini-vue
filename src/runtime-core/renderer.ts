// 通过render把vnode渲染成真实dom
import { ShapeFlags } from "../ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text } from "./vnode";
import { createAppApi } from './createApp';

export const createRenderer = (options) => {
  const { createElement, patchProp, insert } = options

  function render(vnode: any, container: any) {
    // 进行拆箱操作
    console.log("调用 path")
    patch(vnode, container, null);
  }
  function patch(vnode: any, container: any, parentComponent) {
    // 区分patch的到底是HTML元素还是组件
    const { shapeFlag, type } = vnode

    switch (type) {
      case Fragment:
        processFragment(vnode, container, parentComponent)
        break;
      case Text:
        processText(vnode, container)
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(vnode, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(vnode, container, parentComponent);
        }
        break;
    }

  }

  function processText(vnode: any, container: any) {
    const { children } = vnode
    const textNode = (vnode.el = document.createTextNode(children))
    container.append(textNode)
  }
  function processFragment(vnode, container, parentComponent) {
    mountChildren(vnode, container, parentComponent)
  }
  function processComponent(vnode: any, container: any, parentComponent) {
    mountComponent(vnode, container, parentComponent);
  }
  function processElement(vnode: any, container: any, parentComponent) {
    mountElement(vnode, container, parentComponent);
  }
  // 挂载Component
  function mountComponent(initialVNode: any, container: any, parentComponent) {
    const instance = createComponentInstance(initialVNode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
  }
  // 挂载Element
  function mountElement(vnode: any, container: any, parentComponent) {

    const el = (vnode.el = createElement(vnode.type) as HTMLElement);
    const { children, props, shapeFlag } = vnode;

    // children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (Array.isArray(children)) {
      mountChildren(vnode, el, parentComponent);
    }

    // props
    for (let key of Object.getOwnPropertyNames(props).values()) {
      patchProp(el, key, props[key])
    }
    insert(el, container)
  }
  // 挂载子节点
  function mountChildren(vnode: any, container: any, parentComponent) {
    vnode.children.forEach((vnode: any) => {
      patch(vnode, container, parentComponent);
    });
  }

  function setupRenderEffect(instance: any, initialVNode: any, container: any) {
    // 获取到组件返回的h()函数
    const subTree = instance.render.call(instance.proxy);
    // 对组件进行拆箱操作
    patch(subTree, container, instance);
    // 代码到了这里，组件内的所有element已经挂在到document里面了
    initialVNode.el = subTree.el;
  }
  return {
    createApp: createAppApi(render)
  }
};