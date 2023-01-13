// 通过render把vnode渲染成真实dom
import { ShapeFlags } from "@mini-vue/shared/src/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text } from "./vnode";
import { createAppApi } from './createApp';
import { effect } from "@mini-vue/reactivity";
import { getSequence, isNullAndUnDef } from "@mini-vue/shared/src/utils";
import { shouldUpdateComponent } from "./componentUpdateUtils";
import { queueJobs } from "./scheduler";

export const createRenderer = (options) => {
  console.log('createRenderer----------')
  const { createElement, patchProp, insert, remove, setElementText } = options

  function render(vnode: any, container: any) {
    // 进行拆箱操作
    console.log("render 调用 path-------")
    patch(null, vnode, container, null, null);
  }

  function patch(oldVNode, nextVNode: any, container: any, parentComponent, anchor) {
    console.log("path-------")
    // 区分patch的到底是HTML元素还是组件
    const { shapeFlag, type } = nextVNode

    switch (type) {
      case Fragment:
        processFragment(oldVNode, nextVNode, container, parentComponent, anchor)
        break;
      case Text:
        processText(oldVNode, nextVNode, container)
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(oldVNode, nextVNode, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(oldVNode, nextVNode, container, parentComponent, anchor);
        }
        break;
    }

  }

  function processText(oldVNode, nextVNode: any, container: any) {
    console.log('processText-----------')
    const { children } = nextVNode
    const textNode = (nextVNode.el = document.createTextNode(children))
    container.append(textNode)
  }

  function processFragment(oldVNode, nextVNode, container, parentComponent, anchor) {
    console.log('processFragment-----------')
    mountChildren(nextVNode.children, container, parentComponent, anchor)
  }

  function processComponent(oldVNode, nextVNode: any, container: any, parentComponent, anchor) {
    console.log('processComponent-----------')
    if (!oldVNode) {
      mountComponent(nextVNode, container, parentComponent, anchor);
    } else {
      updateComponent(oldVNode, nextVNode)
    }
  }

  // 更新组件
  function updateComponent(oldVNode, nextVNode) {
    const instance = (nextVNode.component = oldVNode.component)
    if (shouldUpdateComponent(oldVNode, nextVNode)) {
      instance.next = nextVNode
      instance.update()
    } else {
      nextVNode.el = oldVNode.el
      instance.vnode = nextVNode
    }
  }

  function processElement(oldVNode, nextVNode: any, container: any, parentComponent, anchor) {
    console.log('processElement-----------')
    if (!oldVNode) {
      mountElement(nextVNode, container, parentComponent, anchor);
    } else {
      patchElement(oldVNode, nextVNode, container, parentComponent, anchor)
    }
  }

  function patchElement(oldVNode, nextVNode, container, parentComponent, anchor) {
    console.log("patchElement----------")
    console.log("container", container)
    console.log("oldVNode", oldVNode)
    console.log("nextVNode", nextVNode)

    const oldProps = oldVNode.props || {}
    const newProps = nextVNode.props || {}

    const el = (nextVNode.el = oldVNode.el)
    patchChildren(oldVNode, nextVNode, el, parentComponent, anchor)
    patchProps(el, oldProps, newProps)
  }

  function patchChildren(oldVNode, nextVNode, container, parentComponent, anchor) {
    console.log('patchChildren-----------')
    const oldShapeFlag = oldVNode.shapeFlag
    const nextShapeFlag = nextVNode.shapeFlag
    const nextChildren = nextVNode.children
    const oldChildren = oldVNode.children
    if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (oldShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 1. 把老children清空
        unmountChildren(oldVNode.children)
      }

      // 2. 设置text
      if (oldChildren !== nextChildren) {
        setElementText(container, nextChildren)
      }
    } else {
      if (oldShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        setElementText(container, "")
        mountChildren(nextChildren, container, parentComponent, anchor)
      } else {
        // array diff array
        patchKeyedChildren(oldChildren, nextChildren, container, parentComponent, anchor)
      }
    }
  }

  function patchKeyedChildren(oldChildren, nextChildren, container, parentComponent, parentAnchor) {
    console.log('patchKeyedChildren-----------')
    let i = 0
    let e1 = oldChildren.length - 1
    let e2 = nextChildren.length - 1
    let l2 = nextChildren.length
    //  左侧
    while (i <= e1 && i <= e2) {
      const n1 = oldChildren[i]
      const n2 = nextChildren[i]

      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break
      }
      i++
    }
    // 右侧
    while (i <= e1 && i <= e2) {
      const n1 = oldChildren[e1]
      const n2 = nextChildren[e2]

      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor)
      } else {
        break
      }
      e1--
      e2--
    }
    // 新的比老的多 创建
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1
        const anchor = e2 + 1 < l2 ? nextChildren[nextPos].el : null
        while (i <= e2) {
          patch(null, nextChildren[i], container, parentComponent, anchor)
          i++
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        remove(oldChildren[i].el)
        i++
      }
    } else {
      // 中间乱序处理
      let s1 = i
      let s2 = i
      const toBePatched = e2 - s2 + 1
      let patched = 0
      const keyToNewIndexMap = new Map()
      let newIndexToOldIndexMap = new Array(toBePatched).fill(0)
      let moved = false
      let maxNewIndexSoFar = 0
      for (let i = s2; i <= e2; i++) {
        let nextChild = nextChildren[i]
        keyToNewIndexMap.set(nextChild.key, i)
      }

      let newIndex

      for (i = s1; i <= e1; i++) {
        const prevChild = oldChildren[i]

        if (patched >= toBePatched) {
          remove(prevChild.el)
          continue
        }

        if (!isNullAndUnDef(prevChild.key)) {
          newIndex = keyToNewIndexMap.get(prevChild.key)

        } else {
          for (let j = s2; j <= e2; j++) {
            if (isSomeVNodeType(prevChild, nextChildren[j])) {
              newIndex = j
              break
            }
          }
        }

        if (newIndex === undefined) {
          remove(prevChild.el)
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex
          } else {
            moved = true
          }
          newIndexToOldIndexMap[newIndex - s2] = i + 1
          patch(prevChild, nextChildren[newIndex], container, parentComponent, null)
          patched++
        }
      }

      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : []
      let j = increasingNewIndexSequence.length - 1

      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2
        const nextChild = nextChildren[nextIndex]
        const anchor = nextIndex + 1 < l2 ? nextChildren[nextIndex + 1].el : null;

        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor)
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            console.log('移动')
            insert(nextChild.el, container, anchor)
          } else {
            j--
          }
        }
      }
    }
  }

  function isSomeVNodeType(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key
  }

  function unmountChildren(children) {
    console.log('unmountChildren-----------')
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el
      remove(el)
    }
  }

  function patchProps(el, oldProps, newProps) {
    console.log('patchProps-----------')
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
  function mountComponent(initialVNode: any, container: any, parentComponent, anchor) {
    console.log('mountComponent-----------')
    const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent))
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container, anchor);
  }

  // 挂载Element
  function mountElement(vnode: any, container: any, parentComponent, anchor) {
    console.log('mountElement-----------')
    const el = (vnode.el = createElement(vnode.type) as HTMLElement);
    const { children, props, shapeFlag } = vnode;

    // children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (Array.isArray(children)) {
      mountChildren(vnode.children, el, parentComponent, anchor);
    }

    // props
    for (const key in props) {
      const val = props[key];
      patchProp(el, key, null, val);
    }

    insert(el, container, anchor)
  }

  // 挂载子节点
  function mountChildren(children: any, container: any, parentComponent, anchor) {
    console.log('mountChildren-----------')
    children.forEach((vnode: any) => {
      patch(null, vnode, container, parentComponent, anchor);
    });
  }

  function setupRenderEffect(instance: any, initialVNode: any, container: any, anchor) {
    console.log('setupRenderEffect-----------')
    instance.update = effect(() => {
      if (!instance.isMounted) {
        // 获取到组件返回的h()函数
        const subTree = (instance.subTree = instance.render.call(instance.proxy, instance.proxy))
        // 对组件进行拆箱操作
        patch(null, subTree, container, instance, anchor);
        // 代码到了这里，组件内的所有element已经挂在到document里面了
        initialVNode.el = subTree.el;
        // 初次挂载完成
        instance.isMounted = true
      } else {
        console.log('update setupRenderEffect')
        const { next, vnode } = instance
        if (next) {
          next.el = vnode.el
          updateComponentPreRender(instance, next)
        }
        const subTree = instance.render.call(instance.proxy, instance.proxy)
        const prevSubTree = instance.subTree
        instance.subTree = subTree
        patch(prevSubTree, subTree, container, instance, anchor);
      }

    }, {
      scheduler() {
        console.log('update,scheduler')
        queueJobs(instance.update)
      }
    })
  }

  // 更新组件渲染前更新参数
  function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode
    instance.next = null
    instance.props = nextVNode.props
  }
  return {
    createApp: createAppApi(render)
  }
};