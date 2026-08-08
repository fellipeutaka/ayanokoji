import { createElement } from "react";
import type { ComponentType, ReactElement } from "react";

export function resolveIcon(
  icon: string | undefined,
  icons: Record<string, ComponentType>
): ReactElement | undefined {
  return icon !== undefined && icon !== "" && Object.hasOwn(icons, icon)
    ? createElement(icons[icon])
    : undefined;
}
