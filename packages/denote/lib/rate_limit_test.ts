import { assertEquals } from "jsr:@std/assert@1";
import { isAllowed } from "./rate-limit.ts";

Deno.test("isAllowed - allows requests under the limit", () => {
  // Use a unique IP per test to avoid cross-test contamination
  const ip = "test-under-limit-" + Math.random();
  for (let i = 0; i < 10; i++) {
    assertEquals(isAllowed(ip), true);
  }
});

Deno.test("isAllowed - blocks after 10 requests in the window", () => {
  const ip = "test-over-limit-" + Math.random();
  for (let i = 0; i < 10; i++) {
    isAllowed(ip);
  }
  assertEquals(isAllowed(ip), false);
});

Deno.test("isAllowed - different IPs are independent", () => {
  const ip1 = "test-ip1-" + Math.random();
  const ip2 = "test-ip2-" + Math.random();

  // Exhaust ip1
  for (let i = 0; i < 10; i++) {
    isAllowed(ip1);
  }
  assertEquals(isAllowed(ip1), false);

  // ip2 should still be allowed
  assertEquals(isAllowed(ip2), true);
});

Deno.test("isAllowed - remains blocked on repeated attempts", () => {
  const ip = "test-stays-blocked-" + Math.random();
  for (let i = 0; i < 10; i++) {
    isAllowed(ip);
  }
  // Multiple attempts after limit should all fail
  assertEquals(isAllowed(ip), false);
  assertEquals(isAllowed(ip), false);
  assertEquals(isAllowed(ip), false);
});
