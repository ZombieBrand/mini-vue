const isFalsy = value => !value;
const isWhitespaceString = value =>
    typeof value === 'string' && /^\s*$/.test(value);
const isEmptyCollection = value =>
    (Array.isArray(value) || value === Object(value)) &&
    !Object.keys(value).length;
const isInvalidDate = value =>
    value instanceof Date && Number.isNaN(value.getTime());
const isEmptySet = value => value instanceof Set && value.size === 0;
const isEmptyMap = value => value instanceof Map && value.size === 0;

const isBlank = value => {
    if (isFalsy(value)) return true;
    if (isWhitespaceString(value)) return true;
    if (isEmptyCollection(value)) return true;
    if (isInvalidDate(value)) return true;
    if (isEmptySet(value)) return true;
    if (isEmptyMap(value)) return true;
    return false;
};
export {
    isBlank
}