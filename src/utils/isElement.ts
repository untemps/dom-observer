const isElement = (value: unknown): value is Element => (value as Element)?.nodeType === 1

export default isElement
