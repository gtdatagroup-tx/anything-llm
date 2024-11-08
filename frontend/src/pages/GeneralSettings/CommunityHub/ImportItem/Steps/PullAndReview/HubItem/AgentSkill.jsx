import CTAButton from "@/components/lib/CTAButton";
import CommunityHubImportItemSteps from "../..";
import showToast from "@/utils/toast";
import paths from "@/utils/paths";
import {
  CaretLeft,
  CaretRight,
  CircleNotch,
  Warning,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import renderMarkdown from "@/utils/chat/markdown";
import DOMPurify from "dompurify";
import CommunityHub from "@/models/communityHub";

export default function AgentSkill({ item, settings, setStep }) {
  const [loading, setLoading] = useState(false);
  async function importAgentSkill() {
    try {
      setLoading(true);
      const { error } = await CommunityHub.importBundleItem(settings.itemId);
      if (error) throw new Error(error);
      showToast(`Agent skill imported successfully!`, "success");
      setStep(CommunityHubImportItemSteps.completed.key);
    } catch (e) {
      console.error(e);
      showToast("Failed to import agent skill.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col mt-4 gap-y-4">
      <div className="border border-white/10 my-2 flex flex-col md:flex-row md:items-center gap-x-2 text-white mb-4 bg-orange-800/30 rounded-lg px-4 py-2">
        <div className="flex flex-col gap-y-2">
          <div className="gap-x-2 flex items-center">
            <Warning size={25} />
            <h1 className="text-lg font-semibold">
              {" "}
              Only import agent skills you trust{" "}
            </h1>
          </div>
          <p className="text-sm">
            Agent skills can execute code on your AnythingLLM instance, so only
            import agent skills from sources you trust. You should also review
            the code before importing. If you are unsure about what a skill does
            - don't import it! Especially if it is not verified by AnythingLLM.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-y-1">
        <h2 className="text-base text-white font-semibold">
          Review Agent Skill "{item.name}"
        </h2>
        {item.creatorUsername && (
          <p className="text-white/60 text-xs font-mono">
            Created by{" "}
            <a
              href={paths.communityHub.profile(item.creatorUsername)}
              target="_blank"
              className="hover:text-blue-500 hover:underline"
            >
              @{item.creatorUsername}
            </a>
          </p>
        )}
        <div className="flex gap-x-1">
          {item.verified ? (
            <p className="text-green-500 text-xs font-mono">Verified code</p>
          ) : (
            <p className="text-red-500 text-xs font-mono">
              This skill is not verified.
            </p>
          )}
          <a
            href="https://docs.anythingllm.com/docs/community-hub/verification"
            target="_blank"
            className="text-xs font-mono text-blue-500 hover:underline"
          >
            Learn more &rarr;
          </a>
        </div>
      </div>
      <div className="flex flex-col gap-y-[25px] text-white/80 text-sm">
        <p>
          Agent skills unlock new capabilities for your AnythingLLM workspace
          via{" "}
          <code className="font-mono bg-zinc-900 px-1 py-0.5 rounded-md text-sm">
            @agent
          </code>{" "}
          skills that can do specific tasks when invoked.
        </p>
      </div>
      <FileReview item={item} />
      <CTAButton
        disabled={loading}
        className="text-dark-text w-full mt-[18px] h-[34px] hover:bg-accent"
        onClick={importAgentSkill}
      >
        {loading ? <CircleNotch size={16} className="animate-spin" /> : null}
        {loading ? "Importing..." : "Import agent skill"}
      </CTAButton>
    </div>
  );
}

function FileReview({ item }) {
  const files = item.manifest.files || [];
  const [index, setIndex] = useState(0);
  const [file, setFile] = useState(files[index]);

  useEffect(() => {
    if (files.length > 0) setFile(files?.[index] || files[0]);
  }, [index]);

  function handlePrevious() {
    if (index > 0) setIndex(index - 1);
  }

  function handleNext() {
    if (index < files.length - 1) setIndex(index + 1);
  }

  if (!file) return null;
  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex flex-col gap-y-2">
        <div className="flex justify-between items-center">
          <button
            type="button"
            className={`bg-black-900 rounded-md p-1 text-white/60 text-xs font-mono ${index === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={handlePrevious}
          >
            <CaretLeft size={16} />
          </button>
          <p className="text-white/60 text-xs font-mono">
            {file.name} ({index + 1} of {files.length} files)
          </p>
          <button
            type="button"
            className={`bg-black-900 rounded-md p-1 text-white/60 text-xs font-mono ${index === files.length - 1 ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={handleNext}
          >
            <CaretRight size={16} />
          </button>
        </div>
        <span
          className="whitespace-pre-line flex flex-col gap-y-1 text-sm leading-[20px] max-h-[500px] overflow-y-auto"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              renderMarkdown(`\`\`\`javascript\n${file.content}\n\`\`\``)
            ),
          }}
        />
      </div>
    </div>
  );
}
