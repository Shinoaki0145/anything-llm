const mockWriteResponseChunk = jest.fn();
const mockNewInvocation = jest.fn().mockResolvedValue({
  invocation: { uuid: "agent-invocation-id" },
  message: null,
});

jest.mock("pluralize", () => jest.fn((word) => word), { virtual: true });
jest.mock("../../../utils/helpers/chat/responses", () => ({
  writeResponseChunk: (...args) => mockWriteResponseChunk(...args),
}));
jest.mock("../../../models/workspace", () => ({
  Workspace: {
    supportsNativeToolCalling: jest.fn().mockResolvedValue(false),
  },
}));
jest.mock("../../../models/workspaceAgentInvocation", () => ({
  WorkspaceAgentInvocation: {
    parseAgents: jest.fn().mockReturnValue([]),
    new: (...args) => mockNewInvocation(...args),
  },
}));

const { grepAgents } = require("../../../utils/chats/agents");

it("starts an automatic agent session without @agent when native tools are disabled", async () => {
  const started = await grepAgents({
    uuid: "chat-id",
    response: {},
    message: "Use the available tool",
    workspace: { id: 1, chatMode: "automatic" },
  });

  expect(started).toBe(true);
  expect(mockNewInvocation).toHaveBeenCalledTimes(1);
});
