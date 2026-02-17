import test from "node:test";
import assert from "node:assert/strict";
import { parsePagination, toPageResponse } from "../src/utils/pagination.js";

test("parsePagination returns defaults", () => {
  const result = parsePagination({});
  assert.equal(result.page, 1);
  assert.equal(result.limit, 20);
  assert.equal(result.skip, 0);
});

test("parsePagination sanitizes invalid values", () => {
  const result = parsePagination({ page: "-2", limit: "0" });
  assert.equal(result.page, 1);
  assert.equal(result.limit, 20);
});

test("parsePagination caps limit", () => {
  const result = parsePagination({ page: "2", limit: "999" });
  assert.equal(result.page, 2);
  assert.equal(result.limit, 100);
  assert.equal(result.skip, 100);
});

test("toPageResponse returns total pages", () => {
  const result = toPageResponse({
    items: [1, 2],
    total: 45,
    page: 2,
    limit: 20,
  });

  assert.equal(result.totalPages, 3);
  assert.equal(result.items.length, 2);
});
