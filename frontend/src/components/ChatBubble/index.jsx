import React from "react";
import Jazzicon from "../UserIcon";
import { userFromStorage } from "../../utils/request";

export default function ChatBubble({ message, type, popMsg }) {
  const isUser = type === "user";

  const userBackgroundColor = "bg-historical-msg-user";
  const aiBackgroundColor = "bg-historical-msg-system";
  const backgroundColor = isUser ? userBackgroundColor : aiBackgroundColor;

  return (
    <div className={`flex justify-center items-end w-full ${backgroundColor}`}>
      <div
        className={`py-10 px-4 w-full flex gap-x-5 md:max-w-[800px] flex-col`}
      >
        <div className="flex gap-x-5">
          <Jazzicon
            size={36}
            user={{ uid: isUser ? userFromStorage()?.username : "system" }}
            role={type}
          />

          <span
            className={`whitespace-pre-line text-white font-normal text-sm md:text-sm flex flex-col gap-y-1 mt-2`}
          >
            {message}
          </span>
        </div>
      </div>
    </div>
  );
}
