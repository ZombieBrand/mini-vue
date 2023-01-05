import { camelize, toHandlerKey } from "../utils"

export function emit(instance, event, ...args) {
    console.log("emit-------------------")
    // instance.props -> event
    const { props } = instance
    // props中触发事件
    const handlerName = toHandlerKey(camelize(event))

    const handler = props[handlerName]

    handler?.(...args)
}