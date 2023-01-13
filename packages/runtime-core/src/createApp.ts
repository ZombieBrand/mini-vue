import { createVNode } from './vnode'

export function createAppApi(render) {
 return function createApp(rootComponent: any) {
    const mount = (rootContainer: any) => {
      const vnode = createVNode(rootComponent)
      render(vnode, rootContainer)
    }
    return {
      mount
    }
  }
}