import { describe, expect, it } from "vitest";
import marineNavs from "../navs";

const paths = (items: { path?: string; navs?: { path?: string }[] }[]): string[] =>
  items.flatMap((item) => [item.path, ...(item.navs ?? []).map((child) => child.path)]).filter((path): path is string => !!path);

describe("marine navigation", () => {
  it("keeps operations at the top and groups configuration under Marine Settings", () => {
    const listed = paths(marineNavs);
    expect(marineNavs.map((item) => item.name)).toEqual([
      "Dashboard",
      "Proposals",
      "Quotations",
      "Open covers",
      "Declarations",
      "Policies",
      "Certificates",
      "Claims",
      "Marine Settings",
    ]);
    const claims = marineNavs.find((item) => item.name === "Claims");
    expect(claims?.navs?.map((child) => child.name)).toEqual([
      "New Claim",
      "Process Claims",
      "Approved Claims",
      "Completed Claims",
    ]);
    expect(claims?.navs?.map((child) => child.path)).toEqual([
      "/marine/claims/new",
      "/marine/claims/process",
      "/marine/claims/approved",
      "/marine/claims/completed",
    ]);
    const settings = marineNavs.find((item) => item.name === "Marine Settings");
    expect(settings?.navs?.map((child) => child.path)).toEqual([
      "/marine/admin/fx-rates",
      "/marine/admin/rate-tables",
      "/marine/admin/rules",
      "/marine/admin/users",
      "/marine/deadlines",
      "/marine/admin/masters",
      "/marine/product",
      "/form-builder/marine",
      "/marine/admin/sanctions",
    ]);
    expect(listed).not.toContain("/marine/underwriting");
    expect(listed).not.toContain("/marine/open-cover-applications");
  });
});
