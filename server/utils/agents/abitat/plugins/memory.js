const { v4 } = require("uuid");
const { getVectorDbClass, getLLMProvider } = require("../../../helpers");
const { Deduplicator } = require("../utils/dedupe");

const memory = {
  name: "rag-memory",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: this.name,
      setup(aibitat) {
        // List and summarize the contents of files that are embedded in the workspace
        aibitat.function({
          super: aibitat,
          tracker: new Deduplicator(),
          name: this.name,
          description:
            "Search against local documents for context that is relevant to the query or store a snippet of text into memory for retrieval later. You should use this tool before search the internet for information.",
          parameters: {
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["search", "store"],
                description:
                  "The action we want to take to search for existing similar context or storage of new context.",
              },
              content: {
                type: "string",
                description:
                  "The plain text to search our local documents with or to store in our vector database.",
              },
            },
            additionalProperties: false,
          },
          handler: async function ({ action = "", content = "" }) {
            try {
              if (this.tracker.isDuplicate(this.name, { action, content }))
                return `This was a duplicated call and it's output will be ignored.`;

              let response = "There was nothing to do.";
              if (action === "search") response = await this.search(content);
              if (action === "store") response = await this.store(content);

              this.tracker.trackRun(this.name, { action, content });
              return response;
            } catch (error) {
              console.log(error);
              return `There was an error while calling the function. ${error.message}`;
            }
          },
          search: async function (query = "") {
            const workspace = this.super.handlerProps.invocation.workspace;
            const LLMConnector = getLLMProvider({
              provider: workspace?.chatProvider,
              model: workspace?.chatModel,
            });
            const vectorDB = getVectorDbClass();
            const { contextTexts = [] } =
              await vectorDB.performSimilaritySearch({
                namespace: workspace.slug,
                input: query,
                LLMConnector,
              });

            if (contextTexts.length === 0)
              return "There was no additional context found for that query. We should search the web for this information.";

            this.super.introspect(
              `${this.caller}: Found ${contextTexts.length} additional piece of context to help answer this question.`
            );

            let combinedText = "Additional context for query:\n";
            for (const text of contextTexts) combinedText += text + "\n\n";
            return combinedText;
          },
          store: async function (content = "") {
            const workspace = this.super.handlerProps.invocation.workspace;
            const vectorDB = getVectorDbClass();
            const { error } = await vectorDB.addDocumentToNamespace(
              workspace.slug,
              {
                docId: v4(),
                id: v4(),
                url: "file://embed-via-agent.txt",
                title: "agent-chat-document.txt",
                docAuthor: "@workspace",
                description: "Unknown",
                docSource: "a text file stored by the workspace agent.",
                chunkSource: "",
                published: new Date().toLocaleString(),
                wordCount: content.split(" ").length,
                pageContent: content,
                token_count_estimate: 0,
              },
              null
            );

            if (!!error)
              return "The content was failed to be embedded properly.";
            this.super.introspect(
              `${this.caller}: I saved the content to long-term memory in this workspaces vector database.`
            );
            return "The content given was successfully embedded. There is nothing else to do.";
          },
        });
      },
    };
  },
};

module.exports = {
  memory,
};
