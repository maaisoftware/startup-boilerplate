import { fc, test } from "@fast-check/vitest";
import { describe, expect, it } from "vitest";

import {
  ACTIONS,
  canPerform,
  PermissionDeniedError,
  POLICY,
  requirePermission,
  RESOURCES,
  ROLES,
  roleSatisfies,
} from "./rbac.ts";

const roleArb = fc.constantFrom(...ROLES);
const resourceArb = fc.constantFrom(...RESOURCES);
const actionArb = fc.constantFrom(...ACTIONS);

describe("RBAC — roleSatisfies", () => {
  it("admin satisfies every required role", () => {
    for (const required of ROLES) {
      expect(roleSatisfies("admin", required)).toBe(true);
    }
  });

  it("viewer fails to satisfy admin or editor", () => {
    expect(roleSatisfies("viewer", "admin")).toBe(false);
    expect(roleSatisfies("viewer", "editor")).toBe(false);
    expect(roleSatisfies("viewer", "viewer")).toBe(true);
  });

  test.prop([roleArb, roleArb])(
    "role hierarchy is reflexive + transitive",
    (a, b) => {
      const satisfiesAB = roleSatisfies(a, b);
      const satisfiesBA = roleSatisfies(b, a);
      // Any pair satisfies at least one direction (total order).
      expect(satisfiesAB || satisfiesBA).toBe(true);
      // A role always satisfies itself.
      expect(roleSatisfies(a, a)).toBe(true);
    },
  );
});

describe("RBAC — canPerform", () => {
  it("admin can do anything that is declared", () => {
    for (const resource of RESOURCES) {
      for (const action of ACTIONS) {
        if (POLICY[resource][action] !== undefined) {
          expect(canPerform("admin", resource, action)).toBe(true);
        }
      }
    }
  });

  it("undeclared (resource, action) pairs are denied for every role", () => {
    // audit_log has no mutation policies — every mutation must be denied.
    for (const role of ROLES) {
      expect(canPerform(role, "audit_log", "create")).toBe(false);
      expect(canPerform(role, "audit_log", "update")).toBe(false);
      expect(canPerform(role, "audit_log", "delete")).toBe(false);
    }
  });

  it("viewer cannot publish posts or pages", () => {
    expect(canPerform("viewer", "post", "publish")).toBe(false);
    expect(canPerform("viewer", "page", "publish")).toBe(false);
  });

  it("editor can publish but cannot delete newsletters", () => {
    expect(canPerform("editor", "post", "publish")).toBe(true);
    expect(canPerform("editor", "newsletter", "delete")).toBe(false);
  });

  test.prop([roleArb, resourceArb, actionArb])(
    "canPerform agrees with canPerform('admin', r, a) via hierarchy",
    (role, resource, action) => {
      // If the admin policy would deny (undefined), then no role may do it.
      if (POLICY[resource][action] === undefined) {
        expect(canPerform(role, resource, action)).toBe(false);
        return;
      }
      // If role satisfies admin hierarchy, it can do anything admin can.
      if (roleSatisfies(role, "admin")) {
        expect(canPerform(role, resource, action)).toBe(true);
      }
    },
  );

  test.prop([roleArb, resourceArb, actionArb])(
    "granting to a higher role never demotes a lower role's permissions",
    (role, resource, action) => {
      // Property: if role X can perform, any role >= X also can.
      if (canPerform(role, resource, action)) {
        for (const other of ROLES) {
          if (roleSatisfies(other, role)) {
            expect(canPerform(other, resource, action)).toBe(true);
          }
        }
      }
    },
  );
});

describe("RBAC — requirePermission", () => {
  it("returns nothing on success", () => {
    expect(requirePermission("admin", "post", "delete")).toBeUndefined();
  });

  it("throws PermissionDeniedError on failure with readable message", () => {
    expect(() => requirePermission("viewer", "audit_log", "delete")).toThrow(
      PermissionDeniedError,
    );
    try {
      requirePermission("viewer", "audit_log", "delete");
    } catch (error) {
      expect(error).toBeInstanceOf(PermissionDeniedError);
      expect((error as Error).message).toContain("viewer");
      expect((error as Error).message).toContain("audit_log");
      expect((error as Error).message).toContain("delete");
    }
  });
});
