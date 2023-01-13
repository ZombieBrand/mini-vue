import { h, renderSlots } from "../../dist/guide-mini-vue.esm.js";
export const Foo = {
  setup() {},
  render() {
    const age = 10;
    console.log(this.$slots, "$slots");
    const foo = h("p", {}, "foo");
    return h("div", {}, [
      renderSlots(this.$slots, "header", { age }),
      foo,
      renderSlots(this.$slots, "footer"),
    ]);
  },
};
