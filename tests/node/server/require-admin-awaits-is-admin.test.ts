import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `isAdmin()` is async. LAC-6117 found every boolean guard in this repo
 * calling it without `await`, so the guard tested a Promise, which is always truthy,
 * and `!isAdmin(...)` was always false.
 *
 * `requireAdmin()` could therefore never throw, and it is the only guard on
 * the four admin payment server actions in `src/server/actions/payments.ts`
 * (`importPayments`, `deleteAllPayments`, `refreshAllPayments`,
 * `importPaymentsFromAllProviders`). Any signed-in user with an email cleared
 * it; `deleteAllPayments` wipes the payments table.
 *
 * The first test below fails on the un-awaited code: with `isAdmin` resolving
 * `false`, `requireAdmin()` resolved the session instead of rejecting. The
 * census at the bottom fails on a *new* un-awaited call site anywhere in
 * `src/`, which is how this class came back three times (LAC-4524, LAC-6117).
 */

const isAdminMock = vi.fn<(args: { email?: string | null; userId?: string }) => Promise<boolean>>();
const authMock = vi.fn();

vi.mock("@/server/services/admin-service", () => ({
  isAdmin: (args: unknown) => isAdminMock(args as never),
}));

vi.mock("@/server/auth", () => ({
  auth: (...args: unknown[]) => authMock(...args),
}));

const ADMIN_SESSION = { user: { id: "u1", email: "someone@example.com" } };

const loadRequireAdmin = async () => (await import("@/server/lib/auth")).requireAdmin;

describe("requireAdmin()", () => {
  beforeEach(() => {
    vi.resetModules();
    isAdminMock.mockReset();
    authMock.mockReset();
    authMock.mockResolvedValue(ADMIN_SESSION);
  });

  it("refuses a signed-in session that is not an admin", async () => {
    isAdminMock.mockResolvedValue(false);

    const requireAdmin = await loadRequireAdmin();

    await expect(requireAdmin()).rejects.toThrow("Unauthorized: Admin access required");
    expect(isAdminMock).toHaveBeenCalledWith({ email: "someone@example.com" });
  });

  it("returns the session for an admin", async () => {
    isAdminMock.mockResolvedValue(true);

    const requireAdmin = await loadRequireAdmin();

    await expect(requireAdmin()).resolves.toEqual(ADMIN_SESSION);
  });

  it("refuses a session with no email, without asking isAdmin", async () => {
    authMock.mockResolvedValue({ user: { id: "u1" } });
    isAdminMock.mockResolvedValue(true);

    const requireAdmin = await loadRequireAdmin();

    await expect(requireAdmin()).rejects.toThrow("Unauthorized: Admin access required");
    expect(isAdminMock).not.toHaveBeenCalled();
  });
});

const ROOT = join(__dirname, "..", "..", "..");

/**
 * Comments blanked out rather than deleted, so prose cannot fail a test and
 * the offender line numbers below still match the file on disk.
 */
const stripComments = (source: string) => {
  const blank = (text: string) => text.replace(/[^\n]/g, " ");
  return source.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/^[ \t]*\/\/.*$/gm, blank);
};

/** Every .ts/.tsx file under src/, excluding tests. */
const sourceFiles = (): string[] => {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(rel);
      } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
        out.push(rel);
      }
    }
  };
  walk("src");
  return out;
};

describe("every isAdmin() call site in src/", () => {
  it("either awaits the promise or hands it to Promise.all", () => {
    const callSite = /(?<![\w.$])isAdmin\s*\(/g;
    const offenders: string[] = [];

    for (const file of sourceFiles()) {
      const code = stripComments(readFileSync(join(ROOT, file), "utf8").replace(/\r\n/g, "\n"));

      for (const match of code.matchAll(callSite)) {
        const before = code.slice(0, match.index);

        // The declaration itself: `export async function isAdmin({...})`.
        if (/\bfunction\s+$/.test(before)) continue;
        // Awaited directly, including `!(await isAdmin(...))`.
        if (/\bawait\s+$/.test(before)) continue;
        // Collected unawaited inside `await Promise.all([...])`, which is
        // awaited as a group. True when the nearest enclosing bracket pair
        // is still open at this point.
        const openedAt = before.lastIndexOf("Promise.all([");
        const closedAt = before.lastIndexOf("]);");
        if (openedAt > -1 && openedAt > closedAt) continue;

        offenders.push(`${file}:${before.split("\n").length}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
