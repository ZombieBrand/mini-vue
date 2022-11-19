import { createVNode } from "./vnode"

export function createApp(rootComponent){
    return{
        mount(rootContainer){
            // component -> vNode
            const vnode = createVNode(rootComponent)
            
        }
    }
}