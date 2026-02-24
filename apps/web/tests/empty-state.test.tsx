import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EmptyInbox, EmptyState } from "../src/components/ui/empty-state";

function TestIcon({ className }: { className?: string }) {
  return <svg className={className} data-testid="icon" />;
}

describe("EmptyState", () => {
  it("renders base content and size styles", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        icon={TestIcon}
        title="No data"
        description="Create your first item"
        size="lg"
      />
    );

    expect(html).toContain("No data");
    expect(html).toContain("Create your first item");
    expect(html).toContain("h-24 w-24");
    expect(html).toContain("text-xl");
  });

  it("renders prebuilt variants with default copy", () => {
    const html = renderToStaticMarkup(<EmptyInbox />);
    expect(html).toContain("All caught up!");
    expect(html).toContain("You have no pending tasks");
  });
});
