// 通过render把vnode渲染成真实dom
import { ShapeFlags } from "../ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text } from "./vnode";
import { createAppApi } from './createApp';
import { effect } from "../reactivity";

export const createRenderer = (options) => {
  const { createElement, patchProp, insert } = options

  function render(vnode: any, container: any) {
    // 进行拆箱操作
    console.log("调用 path-------")
    patch(null, vnode, container, null);
  }

  function patch(oldVNode, nextVNode: any, container: any, parentComponent) {
    // 区分patch的到底是HTML元素还是组件
    const { shapeFlag, type } = nextVNode

    switch (type) {
      case Fragment:
        processFragment(oldVNode, nextVNode, container, parentComponent)
        break;
      case Text:
        processText(oldVNode, nextVNode, container)
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(oldVNode, nextVNode, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(oldVNode, nextVNode, container, parentComponent);
        }
        break;
    }

  }

  function processText(oldVNode, nextVNode: any, container: any) {
    const { children } = nextVNode
    const textNode = (nextVNode.el = document.createTextNode(children))
    container.append(textNode)
  }

  function processFragment(oldVNode, nextVNode, container, parentComponent) {
    mountChildren(nextVNode, container, parentComponent)
  }

  function processComponent(oldVNode, nextVNode: any, container: any, parentComponent) {
    mountComponent(nextVNode, container, parentComponent);
  }

  function processElement(oldVNode, nextVNode: any, container: any, parentComponent) {
    if (!oldVNode) {
      mountElement(nextVNode, container, parentComponent);
    } else {
      patchElement(oldVNode, nextVNode, container)
    }
  }

  function patchElement(oldVNode, nextVNode, container) {
    console.log("patchElement----------")
    console.log("container", container)
    console.log("oldVNode", oldVNode)
    console.log("nextVNode", nextVNode)

    const oldProps = oldVNode.props || {}
    const newProps = nextVNode.props || {}

    const el = (nextVNode.el = oldVNode.el)
    patchProps(el, oldProps, newProps)
  }

  function patchProps(el, oldProps, newProps) {
    if (!Object.is(oldProps, newProps)) {

      for (const key in newProps) {
        const oldProp = oldProps[key]
        const newProp = newProps[key]

        if (!Object.is(oldProp, newProp)) {
          patchProp(el, key, oldProp, newProp)
        }
      }

      if (Object.keys(oldProps).length > 0) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            patchProp(el, key, oldProps[key], null)
          }
        }
      }

    }
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
      patchProp(el, key, null, props[key])
    }
    insert(el, container)
  }

  // 挂载子节点
  function mountChildren(vnode: any, container: any, parentComponent) {
    vnode.children.forEach((vnode: any) => {
      patch(null, vnode, container, parentComponent);
    });
  }

  function setupRenderEffect(instance: any, initialVNode: any, container: any) {
    effect(() => {
      if (!instance.isMounted) {
        // 获取到组件返回的h()函数
        const subTree = (instance.subTree = instance.render.call(instance.proxy))
        // 对组件进行拆箱操作
        patch(null, subTree, container, instance);
        // 代码到了这里，组件内的所有element已经挂在到document里面了
        initialVNode.el = subTree.el;
        // 初次挂载完成
        instance.isMounted = true
      } else {
        const subTree = instance.render.call(instance.proxy)
        const prevSubTree = instance.subTree
        instance.subTree = subTree
        patch(prevSubTree, subTree, container, instance);
      }

    })
  }

  return {
    createApp: createAppApi(render)
  }
};