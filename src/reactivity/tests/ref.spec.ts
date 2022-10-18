import { effect } from '../effect';
import { ref, isRef, unRef, proxyRefs } from '../ref';
import { reactive } from '../reactive';

describe('ref', () => {
    it('happy path', () => {
        const test = ref(1)
        expect(test.value).toBe(1)
    })
    it("应该是响应性", () => {
        const test = ref(1)
        let dummy
        let calls = 0
        effect(() => {
            calls++;
            dummy = test.value
        })
        expect(calls).toBe(1)
        expect(dummy).toBe(1)
        test.value = 2
        expect(calls).toBe(2)
        expect(dummy).toBe(2)
        // 相同的值不应触发
        test.value = 2
        expect(calls).toBe(2)
        expect(dummy).toBe(2)
    })
    it("应该使嵌套属性具有响应性", () => {
        const test = ref({
            count: 1
        })
        let dummy
        effect(() => {
            dummy = test.value.count
        })
        expect(dummy).toBe(1)
        test.value.count = 2
        expect(dummy).toBe(2)
    })

    it("isRef", () => {
        const test = ref(1);
        const user = reactive({
            age: 1
        })
        expect(isRef(test)).toBe(true)
        expect(isRef(1)).toBe(false)
        expect(isRef(user)).toBe(false)
    })

    it("unRef", () => {
        const test = ref(1)
        expect(unRef(test)).toBe(1)
        expect(unRef(1)).toBe(1)
    })

    it("proxyRefs", () => {
        const user = {
            age: ref(10),
            name: "xiaoche"
        }
        const proxyUser = proxyRefs(user)
        expect(user.age.value).toBe(10)
        expect(proxyUser.age).toBe(10)
        expect(proxyUser.name).toBe("xiaoche")

        proxyUser.age = 20
        expect(proxyUser.age).toBe(20)
        expect(user.age.value).toBe(20)

        proxyUser.age = ref(10)
        expect(proxyUser.age).toBe(10)
        expect(user.age.value).toBe(10)
    })
})