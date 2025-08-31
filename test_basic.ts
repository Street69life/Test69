// test_basic.ts
Deno.test("basic test", () => {
  if (1 + 1 !== 2) throw new Error("Math is broken");
});
