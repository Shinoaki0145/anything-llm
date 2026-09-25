jest.mock(
  "../../../../../utils/agents/aibitat/providers/ai-provider.js",
  () =>
    class Provider {
      supportsNativeToolCalling() {
        return false;
      }

      providerLog() {}
    }
);
jest.mock("../../../../../utils/http/index.js", () => ({
  safeJsonParse: (value, fallback = null) => {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  },
  toValidNumber: (value, fallback) => Number(value) || fallback,
}));
jest.mock("../../../../../utils/helpers/chat/responses.js", () => ({
  extractReasoningContent: (value) => value?.reasoning_content,
}));
jest.mock("../../../../../utils/AiProviders/genericOpenAi", () => ({
  GenericOpenAiLLM: { parseCustomHeaders: () => ({}) },
}));
jest.mock("../../../../../endpoints/utils", () => ({
  getAnythingLLMUserAgent: () => "AnythingLLM/Test",
}));
jest.mock(
  "../../../../../utils/agents/aibitat/providers/helpers/tooled.js",
  () => ({ tooledStream: jest.fn(), tooledComplete: jest.fn() })
);
jest.mock("openai", () => class OpenAI {}, { virtual: true });

const GenericOpenAiProvider = require("../../../../../utils/agents/aibitat/providers/genericOpenAi.js");

describe("GenericOpenAiProvider untooled function selection", () => {
  const messages = [{ role: "user", content: "Create a PDF report" }];
  const functions = [
    {
      name: "create-pdf-file",
      description: "Create a PDF file",
      parameters: {
        type: "object",
        properties: {
          filename: { type: "string" },
          content: { type: "string" },
        },
        required: ["filename", "content"],
      },
    },
  ];
  const toolCall = JSON.stringify({
    name: "create-pdf-file",
    arguments: { filename: "report.pdf", content: "# Report" },
  });

  function qwenClient({ selectTool = true, rejectChatTemplate = false } = {}) {
    return {
      chat: {
        completions: {
          create: async (body) => {
            const isToolSelection = body.messages[0]?.role === "system";
            if (rejectChatTemplate && body.chat_template_kwargs) {
              throw new Error("Unknown parameter: chat_template_kwargs");
            }

            const thinkingDisabled =
              body.chat_template_kwargs?.enable_thinking === false;
            const content = !isToolSelection
              ? thinkingDisabled
                ? { content: "Answer without thinking" }
                : {
                    reasoning_content: "Reasoned answer",
                    content: "Final answer",
                  }
              : selectTool && (thinkingDisabled || rejectChatTemplate)
                ? { content: toolCall }
                : selectTool
                  ? { reasoning_content: toolCall }
                  : { content: "No tool selected" };

            if (!body.stream) return { choices: [{ message: content }] };
            return (async function* () {
              yield { choices: [{ delta: content }] };
            })();
          },
        },
      },
    };
  }

  function provider(options) {
    const provider = new GenericOpenAiProvider({ model: "test-model" });
    provider._client = qwenClient(options);
    return provider;
  }

  it("selects a tool without thinking in non-streaming mode", async () => {
    await expect(
      provider().complete(messages, functions)
    ).resolves.toMatchObject({
      functionCall: JSON.parse(toolCall),
    });
  });

  it("selects a tool without thinking in streaming mode", async () => {
    await expect(provider().stream(messages, functions)).resolves.toMatchObject(
      {
        functionCall: JSON.parse(toolCall),
      }
    );
  });

  it.each([
    ["non-streaming", "complete", "Final answer"],
    ["streaming", "stream", "<think>Reasoned answer</think>Final answer"],
  ])(
    "keeps thinking enabled for %s answers without a tool call",
    async (_, method, expected) => {
      await expect(
        provider({ selectTool: false })[method](messages, functions)
      ).resolves.toMatchObject({ textResponse: expected });
    }
  );

  it.each(["complete", "stream"])(
    "retries %s without chat_template_kwargs when unsupported",
    async (method) => {
      await expect(
        provider({ rejectChatTemplate: true })[method](messages, functions)
      ).resolves.toMatchObject({ functionCall: JSON.parse(toolCall) });
    }
  );

  it.each([
    ["non-streaming", "complete", "Final answer"],
    ["streaming", "stream", "<think>Reasoned answer</think>Final answer"],
  ])(
    "generates the %s final answer after a tool result instead of selecting another tool",
    async (_, method, expected) => {
      const messagesAfterTool = [
        ...messages,
        {
          role: "function",
          name: "create-pdf-file",
          content: 'Successfully created PDF document "report.pdf".',
        },
      ];

      await expect(
        provider()[method](messagesAfterTool, functions)
      ).resolves.toMatchObject({ textResponse: expected });
    }
  );

  it("removes the streaming selector status before a normal answer", async () => {
    const events = [];
    await provider({ selectTool: false }).stream(
      messages,
      functions,
      (_, event) => events.push(event)
    );

    const selectorStatus = events.find(
      (event) =>
        event.type === "statusResponse" && event.content === "No tool selected"
    );
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "removeStatusResponse",
        uuid: selectorStatus.uuid,
      })
    );
  });
});
