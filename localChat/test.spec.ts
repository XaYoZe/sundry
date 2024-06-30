import { expect, test } from 'vitest';

function add (a, b) {
  return [a, b]
}

test('add 1 + 1 = 2', () => {
  let a = {};
  expect(add(a,1)).toBe([a, 1])
})