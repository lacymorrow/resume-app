import ai from "./ai.json";
import complete from "./complete.json";
import devops from "./devops.json";
import frontend from "./frontend.json";
import fullstack from "./fullstack.json";
import gtm from "./gtm.json";
import lead from "./lead.json";

/**
 * Every flavor, in the order they appear in the rail.
 *
 * Adding a flavor means dropping a JSON file in this directory and adding it
 * here. `bun run validate:resume` checks that its overrides reference entries
 * that actually exist.
 */
export const FLAVOR_FILES = [complete, frontend, fullstack, devops, ai, gtm, lead];
