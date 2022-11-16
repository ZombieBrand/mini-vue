import { ReactiveEffect } from './effect';
class ComputedRefImpl {
    private _getter: any;
    private _effect: ReactiveEffect;
    private _dirty: boolean = true;
    private _value: any;
    constructor(getter){
        this._getter = getter
        this._effect = new ReactiveEffect(getter,()=>{
            if(!this._dirty){
                this._dirty = true
            }
        })
    }
    get value(){
        if(this._dirty){
            this._dirty = false
            this._value = this._effect.run()
        }
        return this._value
    }
}
export const computed = (getter) => {
    return new ComputedRefImpl(getter)
};
