const { chatPrompt } = require("../../chats");

class CohereLLM {
  constructor(embedder = null) {
    const { CohereClient } = require("cohere-ai");
    if (!process.env.COHERE_API_KEY)
      throw new Error("No Cohere API key was set.");

    const cohere = new CohereClient({
      token: process.env.COHERE_API_KEY,
    });

    this.cohere = cohere;
    this.model = process.env.COHERE_MODEL_PREF;
    this.limits = {
      history: this.promptWindowLimit() * 0.15,
      system: this.promptWindowLimit() * 0.15,
      user: this.promptWindowLimit() * 0.7,
    };

    if (!embedder)
      throw new Error(
        "INVALID COHERE AI SETUP. No embedding engine has been set. Go to instance settings and set up an embedding interface to use Cohere as your LLM."
      );
    this.embedder = embedder;
  }

  #appendContext(contextTexts = []) {
    if (!contextTexts || !contextTexts.length) return "";
    return (
      "\nContext:\n" +
      contextTexts
        .map((text, i) => {
          return `[CONTEXT ${i}]:\n${text}\n[END CONTEXT ${i}]\n\n`;
        })
        .join("")
    );
  }

  #convertChatHistoryCohere(chatHistory = []) {
    let cohereHistory = [];
    chatHistory.forEach((message) => {
      switch (message.role) {
        case "system":
          cohereHistory.push({ role: "SYSTEM", message: message.content });
          break;
        case "user":
          cohereHistory.push({ role: "USER", message: message.content });
          break;
        case "assistant":
          cohereHistory.push({ role: "CHATBOT", message: message.content });
          break;
      }
    });

    return cohereHistory;
  }

  streamingEnabled() {
    return false;
    // return "streamChat" in this && "streamGetChatCompletion" in this;
  }

  promptWindowLimit() {
    switch (this.model) {
      case "command-r":
        return 128_000;
      case "command-r-plus":
        return 128_000;
      case "command":
        return 4_096;
      case "command-light":
        return 4_096;
      case "command-nightly":
        return 8_192;
      case "command-light-nightly":
        return 8_192;
      default:
        return 4_096;
    }
  }

  async isValidChatCompletionModel(model = "") {
    const validModels = [
      "command-r",
      "command-r-plus",
      "command",
      "command-light",
      "command-nightly",
      "command-light-nightly",
    ];
    return validModels.includes(model);
  }

  constructPrompt({
    systemPrompt = "",
    contextTexts = [],
    chatHistory = [],
    userPrompt = "",
  }) {
    const prompt = {
      role: "system",
      content: `${systemPrompt}${this.#appendContext(contextTexts)}`,
    };
    return [prompt, ...chatHistory, { role: "user", content: userPrompt }];
  }

  async isSafe(_input = "") {
    // Not implemented so must be stubbed
    return { safe: true, reasons: [] };
  }

  async sendChat(chatHistory = [], prompt, workspace = {}, rawHistory = []) {
    if (!(await this.isValidChatCompletionModel(this.model)))
      throw new Error(
        `Cohere chat: ${this.model} is not valid for chat completion!`
      );

    // const textResponse = await this.cohere
    //   .createChatCompletion({
    //     model: this.model,
    //     temperature: Number(workspace?.openAiTemp ?? 0.7),
    //     n: 1,
    //     messages: await this.compressMessages(
    //       {
    //         systemPrompt: chatPrompt(workspace),
    //         userPrompt: prompt,
    //         chatHistory,
    //       },
    //       rawHistory
    //     ),
    //   })
    //   .then((json) => {
    //     const res = json.data;
    //     if (!res.hasOwnProperty("choices"))
    //       throw new Error("Cohere chat: No results!");
    //     if (res.choices.length === 0)
    //       throw new Error("Cohere chat: No results length!");
    //     return res.choices[0].message.content;
    //   })
    //   .catch((error) => {
    //     throw new Error(
    //       `Cohere::createChatCompletion failed with: ${error.message}`
    //     );
    //   });

    console.log("CHAT HISTORY", chatHistory);
    const textResponse = await this.cohere
      .chat({
        model: this.model,
        temperature: Number(workspace?.openAiTemp ?? 0.7),
        message: "Say a joke as a pirate",
        chatHistory: await this.compressMessages(
          {
            systemPrompt: chatPrompt(workspace),
            userPrompt: prompt,
            chatHistory,
          },
          rawHistory
        ),
      })
      .then((json) => {
        const res = json.data;
        if (!res.hasOwnProperty("choices"))
          throw new Error("Cohere chat: No results!");
        if (res.choices.length === 0)
          throw new Error("Cohere chat: No results length!");
        return res.choices[0].message.content;
      })
      .catch((error) => {
        throw new Error(
          `Cohere::createChatCompletion failed with: ${error.message}`
        );
      });

    return textResponse;
  }

  async streamChat(chatHistory = [], prompt, workspace = {}, rawHistory = []) {
    if (!(await this.isValidChatCompletionModel(this.model)))
      throw new Error(
        `Cohere chat: ${this.model} is not valid for chat completion!`
      );

    const streamRequest = await this.openai.createChatCompletion(
      {
        model: this.model,
        stream: true,
        temperature: Number(workspace?.openAiTemp ?? 0.7),
        n: 1,
        messages: await this.compressMessages(
          {
            systemPrompt: chatPrompt(workspace),
            userPrompt: prompt,
            chatHistory,
          },
          rawHistory
        ),
      },
      { responseType: "stream" }
    );
    return { type: "togetherAiStream", stream: streamRequest };
  }
  async getChatCompletion(messages = null, { temperature = 0.7 }) {
    if (!(await this.isValidChatCompletionModel(this.model)))
      throw new Error(
        `Cohere chat: ${this.model} is not valid for chat completion!`
      );

    const message = messages[messages.length - 1].content; // Get the last message
    const cohereHistory = this.#convertChatHistoryCohere(messages.slice(0, -1)); // Remove the last message and convert to Cohere

    const chat = await this.cohere.chat({
      model: this.model,
      message: message,
      chatHistory: cohereHistory,
      temperature,
    });

    if (!chat.hasOwnProperty("text")) return null;
    return chat.text;
  }

  async streamGetChatCompletion(messages = null, { temperature = 0.7 }) {
    if (!(await this.isValidChatCompletionModel(this.model)))
      throw new Error(
        `Cohere chat: ${this.model} is not valid for chat completion!`
      );

    const streamRequest = await this.openai.createChatCompletion(
      {
        model: this.model,
        stream: true,
        messages,
        temperature,
      },
      { responseType: "stream" }
    );
    return { type: "togetherAiStream", stream: streamRequest };
  }

  // Simple wrapper for dynamic embedder & normalize interface for all LLM implementations
  async embedTextInput(textInput) {
    return await this.embedder.embedTextInput(textInput);
  }
  async embedChunks(textChunks = []) {
    return await this.embedder.embedChunks(textChunks);
  }

  async compressMessages(promptArgs = {}, rawHistory = []) {
    const { messageArrayCompressor } = require("../../helpers/chat");
    const messageArray = this.constructPrompt(promptArgs);
    return await messageArrayCompressor(this, messageArray, rawHistory);
  }
}

module.exports = {
  CohereLLM,
};
