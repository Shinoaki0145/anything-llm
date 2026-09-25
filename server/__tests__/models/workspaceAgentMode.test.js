jest.mock("../../utils/prisma", () => ({}));
jest.mock("../../models/documents", () => ({}));
jest.mock("../../models/workspaceUsers", () => ({}));
jest.mock("../../models/user", () => ({}));
jest.mock("../../models/promptHistory", () => ({}));
jest.mock("../../utils/middleware/multiUserProtected", () => ({
  ROLES: {},
}));
jest.mock("../../models/systemSettings", () => ({
  SystemSettings: { saneDefaultSystemPrompt: "default prompt" },
}));
jest.mock(
  "slugify",
  () => {
    const slugify = jest.fn((value) => value);
    slugify.extend = jest.fn();
    return slugify;
  },
  { virtual: true }
);

const { Workspace } = require("../../models/workspace");

it("hides the @agent command when automatic mode always routes through the agent", async () => {
  jest.spyOn(Workspace, "supportsNativeToolCalling").mockResolvedValue(false);

  await expect(
    Workspace.isAgentCommandAvailable({ chatMode: "automatic" })
  ).resolves.toBe(false);
});
