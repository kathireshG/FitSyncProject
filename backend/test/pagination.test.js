const test = require("node:test");
const assert = require("node:assert/strict");
const { getPagination, createPagination } = require("../src/utils/pagination");

test("pagination applies defaults, bounds limits, and calculates metadata", () => {
  assert.deepEqual(getPagination({}), { page: 1, limit: 20, skip: 0 });
  assert.deepEqual(getPagination({ page: "3", limit: "500" }), {
    page: 3,
    limit: 100,
    skip: 200,
  });
  assert.deepEqual(createPagination({ page: 2, limit: 10, total: 25 }), {
    page: 2,
    limit: 10,
    total: 25,
    totalPages: 3,
    hasPreviousPage: true,
    hasNextPage: true,
  });
});

test("pagination rejects non-positive and non-integer values", () => {
  assert.throws(() => getPagination({ page: "0" }), /positive integer/);
  assert.throws(() => getPagination({ page: "1.5" }), /positive integer/);
  assert.throws(() => getPagination({ limit: "invalid" }), /positive integer/);
});
