import { afterEach, describe, expect, it } from "vitest";
import { appConfirm, appPrompt, finishDialog, getDialogSnapshot } from "../src/lib/app-dialog";

afterEach(() => { while (getDialogSnapshot()) finishDialog(false); });

describe("overlapping dialog requests", () => {
  it("allows both queued confirmations to be dismissed without confirming", async () => {
    const first = appConfirm("Primeira");
    const second = appConfirm("Segunda");
    const firstId = getDialogSnapshot()?.id;
    finishDialog(false, firstId);
    expect(await first).toBe(false);
    const secondId = getDialogSnapshot()?.id;
    expect(secondId).not.toBe(firstId);
    finishDialog(false, firstId);
    expect(getDialogSnapshot()?.id).toBe(secondId);
    finishDialog(false, secondId);
    expect(await second).toBe(false);
    expect(getDialogSnapshot()).toBeNull();
  });

  it("cancels a prompt without submitting its draft", async () => {
    const prompt = appPrompt("Valor", "100");
    finishDialog(null);
    expect(await prompt).toBeNull();
    expect(getDialogSnapshot()).toBeNull();
  });
});