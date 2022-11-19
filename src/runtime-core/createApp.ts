import { createVNode } from './vnode'
import { render } from './renderer'
export function createApp(rootComponent: any){
  const mount = (rootContainer: any) => {
    const vnode = createVNode(rootComponent)
    render(vnode, rootContainer)
  }
  return {
    mount
  }
}