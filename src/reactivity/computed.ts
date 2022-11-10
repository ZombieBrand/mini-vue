class ComputedRefImpl {

}
export const computed = (getter) => {
    return new ComputedRefImpl()
};
