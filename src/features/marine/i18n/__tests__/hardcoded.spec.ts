// Plan section 9: "A test fails on any hard-coded string in templates". This covers the shared
// components already moved to vue-i18n; add a file here once its screen is translated.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import en from "../en";
import am from "../am";

const TRANSLATED = [
  "components/PageState.vue",
  "components/ListTable.vue",
  "components/FilterBar.vue",
  "components/FormErrorBanner.vue",
  "components/DeadlineChip.vue",
  "components/FileUploader.vue",
  "components/AlertsBell.vue",
  "components/Autocomplete.vue",
  "components/StatusBadge.vue",
];

/** Text between tags in the template that contains letters and isn't a {{ }} expression. */
function hardCoded(source: string) {
  // Drop expressions and attribute values first: arrow functions in them contain ">"
  const template = source
    .slice(source.indexOf("<template>"), source.lastIndexOf("</template>"))
    .replace(/\{\{[\s\S]*?\}\}/g, "")
    .replace(/"[^"]*"/g, '""');
  return [...template.matchAll(/>([^<>]+)</g)].map((m) => m[1].trim()).filter((text) => /[A-Za-z]/.test(text));
}

const keys = (o: object, prefix = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));

describe("localisation", () => {
  it.each(TRANSLATED)("%s has no hard-coded template text", (file) => {
    const source = readFileSync(resolve(__dirname, "../..", file), "utf8");
    expect(hardCoded(source)).toEqual([]);
  });

  it("Amharic has every English key", () => {
    expect(keys(am).sort()).toEqual(keys(en).sort());
  });
});
