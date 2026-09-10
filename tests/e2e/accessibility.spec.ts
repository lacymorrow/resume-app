import { createRequire } from "node:module";
import { expect, type Page, test } from "@playwright/test";

/**
 * The accessibility floor for the resume.
 *
 * axe catches the mechanical failures; the tests under it cover the things a
 * rule engine cannot see, which is where every real defect in this page has
 * been: a heading outline that skipped the sections, flavor links wearing radio
 * semantics so six of seven were unreachable by Tab, and focus dropping to the
 * body when the builder opened.
 */

const AXE_PATH = createRequire(import.meta.url).resolve("axe-core");

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

interface AxeResult {
  violations: { id: string; impact: string; help: string; nodes: { target: string[] }[] }[];
}

/** Runs axe over the whole document and returns violations, newest rules included. */
async function axeViolations(page: Page) {
  await page.addScriptTag({ path: AXE_PATH });
  const result = await page.evaluate(
    async (tags) =>
      (await (
        window as unknown as { axe: { run: (d: Document, o: unknown) => Promise<AxeResult> } }
      ).axe.run(document, {
        resultTypes: ["violations"],
        runOnly: { type: "tag", values: tags },
      })) as AxeResult,
    WCAG
  );
  return result.violations.map((v) => `${v.impact}: ${v.id} (${v.nodes.length}) ${v.help}`);
}

async function waitForHydration(page: Page) {
  await page.getByRole("button", { name: /Customize/ }).waitFor({ state: "visible" });
}

test.describe("accessibility", () => {
  for (const path of ["/", "/ai", "/?role=twilio-inc"]) {
    test(`${path} has no axe violations`, async ({ page }) => {
      await page.goto(path);
      await waitForHydration(page);
      expect(await axeViolations(page)).toEqual([]);
    });
  }

  test("the builder has no axe violations, including a switched-off role", async ({ page }) => {
    // A hidden row is the state that carried the contrast failure, and it only
    // exists once something has actually been switched off.
    await page.goto("/?hc=Yahoo");
    await waitForHydration(page);
    await page.getByRole("button", { name: /Customize/ }).click();
    await page.getByRole("button", { name: /^Roles/ }).click();
    await expect(page.locator('label[for="company-yahoo"]')).toBeVisible();
    expect(await axeViolations(page)).toEqual([]);
  });

  test("the first tab stop skips the rail and lands in the resume", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    await page.keyboard.press("Tab");
    const skip = page.locator(".resume-skip");
    await expect(skip).toBeFocused();
    // Off-screen until focused, on-screen once it is.
    expect((await skip.boundingBox())!.x).toBeGreaterThan(0);

    await page.keyboard.press("Enter");
    await expect(page.locator("#resume-main")).toBeFocused();
  });

  test("every section label is a heading, so the outline is navigable", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    const heads = page.locator('main h2[id^="sh-"]');
    expect(await heads.count()).toBeGreaterThanOrEqual(4);

    // Each one is what its section is named by, not a div that happens to sit
    // above it.
    for (const section of await page.locator("main section[aria-labelledby]").all()) {
      const id = await section.getAttribute("aria-labelledby");
      await expect(page.locator(`h2#${id}`)).toHaveCount(1);
    }
  });

  test("a role heading names its employer, not just the job title", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    // Two roles on this resume share the title "Full-Stack Next.js Developer",
    // so the title alone cannot tell them apart in a heading list.
    const names = await page
      .locator('section[aria-labelledby="sh-work"] h3')
      .evaluateAll((els) => els.map((el) => el.textContent ?? ""));
    expect(names.length).toBeGreaterThan(1);
    expect(new Set(names).size).toBe(names.length);
  });

  test("every flavor is a link and every one is reachable by Tab", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    const links = page.locator(".resume-flavors a");
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(7);

    // A roving tabindex left six of seven out of the tab order entirely.
    for (const link of await links.all()) {
      await expect(link).not.toHaveAttribute("tabindex", "-1");
      await expect(link).toHaveAttribute("href", /.+/);
    }
    await expect(page.locator('.resume-flavors a[aria-current="page"]')).toHaveCount(1);
  });

  test("opening and closing the builder keeps focus somewhere useful", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    const customize = page.getByRole("button", { name: /Customize/ });
    await customize.click();
    // Focus lands inside the panel rather than falling back to the body when
    // the button that opened it unmounts.
    await expect(page.locator(".resume-desk")).toContainText("Builder");
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");

    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(customize).toBeFocused();
  });

  test("reduced motion turns off smooth scrolling", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const behaviour = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior
    );
    expect(behaviour).toBe("auto");
  });
});
