import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import { useTranslation } from "react-i18next";
import HubItems from "./HubItems";

export default function CommunityHub() {
  const { t } = useTranslation();
  return (
    <div className="w-screen h-screen overflow-hidden bg-sidebar flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-main-gradient w-full h-full overflow-y-scroll"
      >
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[86px] md:py-6 py-16">
          <div className="w-full flex flex-col gap-y-1 pb-6 border-white border-b-2 border-opacity-10">
            <div className="items-center">
              <p className="text-lg leading-6 font-bold text-white">
                {t("community-hub.title")}
              </p>
            </div>
            <p className="text-xs leading-[18px] font-base text-white text-opacity-60">
              {t("community-hub.description")}
            </p>
          </div>
          <HubItems />
        </div>
      </div>
    </div>
  );
}
