jest.mock("../../../utils/agents/aibitat", () => jest.fn());
jest.mock("../../../utils/agents/aibitat/plugins", () => ({}));
jest.mock("../../../utils/agents/aibitat/plugins/http-socket.js", () => ({}));
jest.mock("../../../utils/agents/imported", () => ({}));
jest.mock("../../../utils/agents/defaults", () => ({}));
jest.mock("../../../utils/agentFlows", () => ({}));
jest.mock("../../../utils/MCP", () => jest.fn());
jest.mock("../../../utils/DocumentManager", () => ({}));
jest.mock("../../../utils/http", () => ({}));
jest.mock("../../../utils/chats/agents", () => ({}));
jest.mock("../../../utils/helpers/chat/responses", () => ({}));
jest.mock("../../../models/user", () => ({}));
jest.mock("../../../models/workspaceChats", () => ({}));
jest.mock("../../../models/workspaceParsedFiles", () => ({}));
jest.mock("../../../models/workspace", () => ({
  Workspace: {
    supportsNativeToolCalling: jest.fn().mockResolvedValue(false),
  },
}));
jest.mock("../../../models/workspaceAgentInvocation", () => ({
  WorkspaceAgentInvocation: {
    parseAgents: jest.fn().mockReturnValue([]),
  },
}));

const { AgentHandler } = require("../../../utils/agents");
const { EphemeralAgentHandler } = require("../../../utils/agents/ephemeral");

describe.each([
  ["WebSocket", AgentHandler],
  ["REST API", EphemeralAgentHandler],
])("%s automatic agent routing", (_, Handler) => {
  it("invokes the agent without @agent when native tool calling is disabled", async () => {
    await expect(
      Handler.isAgentInvocation({
        message: "Use the available tool",
        workspace: { id: 1 },
        chatMode: "automatic",
      })
    ).resolves.toBe(true);
  });
});
