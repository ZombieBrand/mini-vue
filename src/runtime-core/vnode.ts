import { ShapeFlags } from "../ShapeFlags";
export { createVNode as createElementVNode }
export const Fragment = Symbol("Fragment");
export const Text = Symbol('Text')

// 创建vnode
export function createVNode(type: any, props?: any, children?: any) {
  console.log("createVNode-------------------")
  const vnode = {
    type,
    props,
    children,
    component: null,
    shapeFlag: getShapeFlag(type),
    key: props && props.key,
    el: null
  }

  // children 
  if (typeof children === 'string') {
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.TEXT_CHILDREN
  } else if (Array.isArray(children)) {
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.ARRAY_CHILDREN
  }

  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === 'object') {
      vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.SLOT_CHILDREN
    }
  }
  return vnode
}

export function getShapeFlag(type) {
  return typeof type === 'string' ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT
}

export const createTextVNode = (text: string) => {
  console.log("createTextVNode-------------------")
  return createVNode(Text, {}, text)
};
