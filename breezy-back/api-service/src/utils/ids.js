function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

module.exports = {
    createId
};