const toString = Object.prototype.toString;

/**
 * @description: 判断值是否未某个类型
 */
export function is(val: unknown, type: string) {
    return toString.call(val) === `[object ${type}]`;
}

/**
 * @description:  是否为函数
 */
export function isFunction<T = Function>(val: unknown): val is T {
    return is(val, 'Function');
}

/**
 * @description: 是否已定义
 */
export const isDef = <T = unknown>(val?: T): val is T => {
    return typeof val !== 'undefined';
};

export const isUnDef = <T = unknown>(val?: T): val is T => {
    return !isDef(val);
};
/**
 * @description: 是否为对象
 */
export const isObject = (val: any): val is Record<any, any> => {
    return val !== null && is(val, 'Object');
};

/**
 * @description:  是否为时间
 */
export function isDate(val: unknown): val is Date {
    return is(val, 'Date');
}

/**
 * @description:  是否为数值
 */
export function isNumber(val: unknown): val is number {
    return is(val, 'Number');
}

/**
 * @description:  是否为AsyncFunction
 */
export function isAsyncFunction<T = any>(val: unknown): val is Promise<T> {
    return is(val, 'AsyncFunction');
}

/**
 * @description:  是否为字符串
 */
export function isString(val: unknown): val is string {
    return is(val, 'String');
}

/**
 * @description:  是否为boolean类型
 */
export function isBoolean(val: unknown): val is boolean {
    return is(val, 'Boolean');
}

/**
 * @description:  是否为数组
 */
export function isArray(val: any): val is Array<any> {
    return val && Array.isArray(val);
}

export function isNull(val: unknown): val is null {
    return val === null;
}

export function isNullAndUnDef(val: unknown): val is null | undefined {
    return isUnDef(val) && isNull(val);
}

export function isNullOrUnDef(val: unknown): val is null | undefined {
    return isUnDef(val) || isNull(val);
}
export function isObjectLike(value: unknown) {
    return value != null && typeof value == 'object';
}

export function deepEqual(object1, object2) {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (const key of keys1) {
        const val1 = object1[key];
        const val2 = object2[key];
        const areObjects = isObject(val1) && isObject(val2);
        if (
            (areObjects && !deepEqual(val1, val2)) ||
            (!areObjects && val1 !== val2)
        ) {
            return false;
        }
    }

    return true;
}

export const hasOwn = (target: Record<string, any>, key: any) => Object.prototype.hasOwnProperty.call(target, key)


// 第一个字母转换大写
const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
}
// 兼容方案,add-num -> addNum
export const camelize = (str: string) => {
    return str.replace(/-(\w)/g, (_, c: string) => {
        return c ? c.toUpperCase() : ""
    })
}
// 用户传入事件名添加on
export const toHandlerKey = (event: string) => {
    return event ? "on" + capitalize(event) : ''
}

// 最长递增子序列
export function getSequence(arr: number[]): number[] {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                } else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}