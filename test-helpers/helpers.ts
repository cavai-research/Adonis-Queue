export const sleep = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout))

export const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1)
