import React from "react";
import Badge from "@/components/Generic/Badges/Badge";
import ToggleButton from "@/components/Generic/Inputs/ToggleSwitch";

export default function ToggleBlock({
  content, // toggle content goes here
  initialChecked,
  label,
  onToggle,
  description,
  name,
  badge = false,
  badgeLabel,
  badgeAnimated,
  badgeBg,
  border,
  Icon,
  contentLocation,
  disabled,
  inline = false,
}) {
  const borderStyle = border ? "border border-gray-600 rounded-2xl p-4" : "";
  const contentPosition = {
    middle: "middle",
    top: "top",
    bottom: "bottom",
  }[contentLocation];

  return (
    <div className={`relative w-full max-h-full ${borderStyle}`}>
      <div className="relative rounded-lg">
        <div className="space-y-6 flex h-full w-full">
          <div className="w-full flex flex-col gap-y-4">
            <div className="flex gap-4">
              {Icon && (
                <Icon className="w-16 h-16  text-white text-opacity-60" />
              )}
              <div>
                <div className="flex flex-row gap-4">
                  {inline && (
                    <div>
                      <ToggleButton
                        initialChecked={initialChecked}
                        onToggle={onToggle}
                        name={name}
                        disabled={disabled}
                      />
                    </div>
                  )}
                  <label className="block input-label mb-4 first-letter:capitalize">
                    {label}
                  </label>
                  {badge && (
                    <Badge
                      showDot
                      animated={badgeAnimated}
                      label={badgeLabel}
                      bg={badgeBg}
                    />
                  )}
                </div>
                {!inline && (
                  <ToggleButton
                    initialChecked={initialChecked}
                    onToggle={onToggle}
                    name={name}
                    disabled={disabled}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between space-x-14">
          <p className="text-white text-opacity-60 text-xs font-medium py-1.5">
            {description}
          </p>
        </div>
        {content}
      </div>
    </div>
  );
}
