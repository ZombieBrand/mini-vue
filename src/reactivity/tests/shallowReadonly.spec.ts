import { isReadonly, shallowReadonly } from "../reactive";

describe("shallowReadonly", () => {
    test("浅层readonly,嵌套层reactive", () => {
        const props = shallowReadonly({ n: { foo: 1 } })
        expect(isReadonly(props)).toBe(true)
        expect(isReadonly(props.n)).toBe(false)
    })
})