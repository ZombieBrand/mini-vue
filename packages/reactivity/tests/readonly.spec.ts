import { readonly, isReadonly, isProxy } from '../src/reactive';
import { vi } from 'vitest'
describe('readonly', () => {
    it("happy path", () => {
        const original = { foo: 1, bar: { baz: 2 } }
        const wrapped = readonly(original)
        expect(wrapped).not.toBe(original)
        expect(wrapped.foo).toBe(1)
        expect(isReadonly(wrapped)).toBe(true)
        expect(isReadonly(original)).toBe(false)
        expect(isReadonly(wrapped.bar)).toBe(true)
        expect(isProxy(wrapped)).toBe(true)
    })

    it("触发set返回警告", () => {
        console.warn = vi.fn()
        const user = readonly({
            age: 10,
            bar: { baz: 2 }
        })
        user.age = 11
        // 修改readonly响应式对象的property的值会调用console.warn发出警告 
        expect(console.warn).toBeCalled()
    })
})