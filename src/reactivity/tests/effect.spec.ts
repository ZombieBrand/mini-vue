import { reactive } from '../reactive';
import { effect, stop } from '../effect';
describe('effect', () => {
    it('happy path', () => {
        const user = reactive({
            age: 10
        })
        let nextAge
        effect(() => {
            nextAge = user.age + 1
        })
        expect(nextAge).toBe(11)

        // update
        user.age++
        expect(nextAge).toBe(12)
    })

    it('当调用effect时，应该返回runner并且获得effect内返回值', () => {
        let foo = 10
        const runner = effect(() => {
            foo++
            return "foo"
        })
        expect(foo).toBe(11)
        const res = runner()
        expect(foo).toBe(12)
        expect(res).toBe("foo")
    })

    it('scheduler', () => {
        // 1. 通过 effect 的第二个参数给定的 一个 scheduler 的 fn
        // 2. effect 第一次执行的时候还会执行fn
        // 3. 当响应式对象 set update 不会执行 fn 而是执行 scheduler
        // 4. 如果当执行 runner 的时候,会再次执行 fn
        let dummy
        let run: any
        const scheduler = jest.fn(() => {
            run = runner
        })
        const obj = reactive({ foo: 1 })
        const runner = effect(() => {
            dummy = obj.foo
        }, {
            scheduler
        })
        expect(scheduler).not.toHaveBeenCalled()
        expect(dummy).toBe(1)
        obj.foo++
        expect(scheduler).toHaveBeenCalledTimes(1)
        expect(dummy).toBe(1)
        run()
        expect(dummy).toBe(2)
    })

    it("stop", () => {
        let dummy
        const obj = reactive({
            prop: 1
        })
        const runner = effect(() => {
            dummy = obj.prop
        })
        obj.prop = 2
        expect(dummy).toBe(2)
        stop(runner)
        obj.prop++
        expect(dummy).toBe(2)
        runner()
        expect(dummy).toBe(3)
    })
    it("onStop", () => {
        const obj = reactive({
            foo: 1
        })
        const onStop = jest.fn()
        let dummy
        const runner = effect(() => {
            dummy = obj.foo
        }, {
            onStop
        })
        stop(runner)
        expect(onStop).toBeCalledTimes(1)
    })
})