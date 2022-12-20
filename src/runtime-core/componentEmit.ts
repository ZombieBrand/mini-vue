import { camelize, toHandlerKey } from "../utils"

export function emit(instance, event, ...args) {
    // instance.props -> event
    const { props } = instance
    // props中触发事件
    const handlerName = toHandlerKey(camelize(event))
    console.log(camelize(event),handlerName,1111)
    const handler = props[handlerName]
    console.log({ handler })
    handler && handler(...args)
}