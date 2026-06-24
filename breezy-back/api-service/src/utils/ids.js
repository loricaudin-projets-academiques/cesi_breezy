function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export {
    createId
};