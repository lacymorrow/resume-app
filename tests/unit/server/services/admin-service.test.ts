/**
 * Regression tests for the Payload hole in `isAdmin()` (LAC-5048, ported LAC-5245).
 *
 * `isAdmin()` used to end with "this email exists in Payload's `users`
 * collection, therefore admin". `auth-service` writes every
 * credentials-registered account into that same collection, so on any
 * deployment with Payload enabled every registered user was an admin.
 *
 * These are unit tests rather than additions to the integration suite on
 * purpose: `tests/integration/server/services/admin-service.test.ts` mocks
 * `getPayloadClient` to return `null`, which is exactly why it never caught
 * this. The Payload branch needs a client that answers.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  dbFindFirst: vi.fn(),
  getPayloadClient: vi.fn(),
  payloadFind: vi.fn(),
  hasPermission: vi.fn(),
  isAdminByEmailConfig: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock("@/server/db", () => ({
  db: { query: { users: { findFirst: mocks.dbFindFirst } } },
}));

vi.mock("@/lib/payload/payload", () => ({
  getPayloadClient: mocks.getPayloadClient,
  payload: null,
}));

vi.mock("@/server/services/rbac", () => ({
  rbacService: { hasPermission: mocks.hasPermission },
}));

vi.mock("@/config/admin-config", () => ({
  adminConfig: {
    emails: [],
    domains: [],
    isAdminByEmailConfig: mocks.isAdminByEmailConfig,
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: mocks.loggerWarn, error: vi.fn() },
}));

const { isAdmin } = await import("@/server/services/admin-service");

/** What Payload returns for an account that signed up through the normal flow. */
const payloadHit = {
  docs: [{ id: "payload-1", email: "registered@shipkit.test" }],
  totalDocs: 1,
};

describe("isAdmin and Payload membership (LAC-5048, ported LAC-5245)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAdminByEmailConfig.mockReturnValue(false);
    mocks.hasPermission.mockResolvedValue(false);
    mocks.payloadFind.mockResolvedValue(payloadHit);
    mocks.getPayloadClient.mockResolvedValue({ find: mocks.payloadFind });
  });

  it("refuses a Payload-synced user who is not an admin anywhere else", async () => {
    // Ordinary account: role "user", email verified, no RBAC grant, no config
    // match. Its only distinguishing feature is a row in Payload's `users`
    // collection, which credentials registration creates for everybody.
    mocks.dbFindFirst.mockResolvedValue({
      id: "user-1",
      role: "user",
      emailVerified: new Date(),
    });

    expect(await isAdmin({ email: "registered@shipkit.test" })).toBe(false);
  });

  it("refuses a Payload-only user with no Shipkit account at all", async () => {
    mocks.dbFindFirst.mockResolvedValue(undefined);

    expect(await isAdmin({ email: "payload-only@shipkit.test" })).toBe(false);
  });

  it("never consults Payload while deciding admin status", async () => {
    // The stronger claim, and the one that keeps the hole from being
    // reintroduced in a different shape: Payload is not an input to this
    // decision. Nothing in that collection distinguishes an admin from a
    // signup, so there is no query here worth making.
    mocks.dbFindFirst.mockResolvedValue({
      id: "user-1",
      role: "user",
      emailVerified: new Date(),
    });

    await isAdmin({ email: "registered@shipkit.test" });

    expect(mocks.getPayloadClient).not.toHaveBeenCalled();
    expect(mocks.payloadFind).not.toHaveBeenCalled();
  });

  it("still grants a Payload-synced user who holds role=admin", async () => {
    // Removing the Payload check must not cost a real admin their access.
    mocks.dbFindFirst.mockResolvedValue({
      id: "admin-1",
      role: "admin",
      emailVerified: new Date(),
    });

    expect(await isAdmin({ email: "registered@shipkit.test" })).toBe(true);
  });

  it("still grants a Payload-synced user who holds the RBAC system:admin permission", async () => {
    mocks.dbFindFirst.mockResolvedValue({
      id: "rbac-1",
      role: "user",
      emailVerified: new Date(),
    });
    mocks.hasPermission.mockResolvedValue(true);

    expect(await isAdmin({ email: "registered@shipkit.test" })).toBe(true);
    expect(mocks.hasPermission).toHaveBeenCalledWith("rbac-1", "system", "admin");
  });

  it("still grants a verified account that the static config names", async () => {
    mocks.isAdminByEmailConfig.mockReturnValue(true);
    mocks.dbFindFirst.mockResolvedValue({
      id: "config-1",
      role: "user",
      emailVerified: new Date(),
    });

    expect(await isAdmin({ email: "registered@shipkit.test" })).toBe(true);
  });
});

/**
 * Regression tests for the static-config hole in `isAdmin()` (LAC-3811,
 * ported LAC-6023).
 *
 * Check 1 used to return true on `adminConfig.isAdminByEmailConfig(email)`
 * alone, before any account lookup happened. The config is a list of
 * addresses and domains, so clearing it needed nothing but presenting a
 * matching address: an unverified signup, or an OAuth profile from a
 * provider that does not verify the email it hands over. A config match now
 * has to land on a real account that proved it owns the address.
 *
 * `emailVerified` is a floor, not a ceiling. It cannot be written on an
 * existing row, but it is settable on a NEW row by an unauthenticated
 * action (LAC-5209), so this raises the bar rather than closing the door.
 */
describe("isAdmin and the static admin config (LAC-3811, ported LAC-6023)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The config names this address on every test in this block.
    mocks.isAdminByEmailConfig.mockReturnValue(true);
    mocks.hasPermission.mockResolvedValue(false);
    mocks.getPayloadClient.mockResolvedValue({ find: mocks.payloadFind });
    mocks.payloadFind.mockResolvedValue(payloadHit);
  });

  it("refuses a config-named address that no account owns", async () => {
    // Nobody ever signed up as this address, so nobody has proved they own
    // it. Before the fix this returned true without reading the database.
    mocks.dbFindFirst.mockResolvedValue(undefined);

    expect(await isAdmin({ email: "unowned@shipkit.test" })).toBe(false);
  });

  it("refuses a config-named address whose account never verified", async () => {
    mocks.dbFindFirst.mockResolvedValue({
      id: "unverified-1",
      role: "user",
      emailVerified: null,
    });

    expect(await isAdmin({ email: "unverified@shipkit.test" })).toBe(false);
  });

  it("logs the refusal without naming the address", async () => {
    mocks.dbFindFirst.mockResolvedValue({
      id: "unverified-1",
      role: "user",
      emailVerified: null,
    });

    await isAdmin({ email: "unverified@shipkit.test" });

    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      "Admin config matched an email with no verified account; refusing admin",
      { hasAccount: true }
    );
    // `logger` has no level filter and copies its metadata into OTel span
    // attributes, so an address passed here is written straight into
    // production telemetry (LAC-6126). Assert over the whole call list, not
    // just the metadata object, so a future author cannot smuggle it into
    // the message string either.
    expect(JSON.stringify(mocks.loggerWarn.mock.calls)).not.toContain("@");
  });

  it("separates a missing account from an unverified one in the log", async () => {
    // The two near misses need different operator responses: nobody owns the
    // configured address, versus somebody signed up and never verified. That
    // distinction is what `email` used to carry, and it survives without it.
    mocks.dbFindFirst.mockResolvedValue(undefined);

    await isAdmin({ email: "unowned@shipkit.test" });

    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      "Admin config matched an email with no verified account; refusing admin",
      { hasAccount: false }
    );
    expect(JSON.stringify(mocks.loggerWarn.mock.calls)).not.toContain("@");
  });

  it("reads the account before deciding, not after", async () => {
    // The ordering is the fix. A config match that short-circuits ahead of
    // the lookup is the bug, whatever the lookup would have said.
    mocks.dbFindFirst.mockResolvedValue(undefined);

    await isAdmin({ email: "unowned@shipkit.test" });

    expect(mocks.dbFindFirst).toHaveBeenCalledTimes(1);
  });

  it("still grants a config-named address on an unverified row that holds role=admin", async () => {
    // Check 2 is independent of the verification floor on check 1: an
    // explicit role on the account is its own grant and must not regress.
    mocks.dbFindFirst.mockResolvedValue({
      id: "admin-1",
      role: "admin",
      emailVerified: null,
    });

    expect(await isAdmin({ email: "admin@shipkit.test" })).toBe(true);
  });
});
