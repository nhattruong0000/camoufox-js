import type { Browser, BrowserContext, BrowserType } from "playwright-core";
import { firefox } from "playwright-core";

import type { LaunchOptions } from "./utils.js";
import { launchOptions as getLaunchOptions, syncAttachVD } from "./utils.js";
import { VirtualDisplay } from "./virtdisplay.js";

export async function Camoufox(
  launch_options: LaunchOptions | { headless?: boolean | "virtual" },
) {
  const { headless, ...rest } = launch_options;
  return NewBrowser(firefox, headless, {}, false, false, rest);
}

export async function NewBrowser(
  playwright: BrowserType<Browser>,
  headless: boolean | "virtual" = false,
  fromOptions: Record<string, any> = {},
  persistentContext = false,
  debug = false,
  launch_options: LaunchOptions = {},
): Promise<Browser | BrowserContext> {
  let virtualDisplay: VirtualDisplay | null = null;

  const launchOptions = { ...launch_options };

  if (headless === "virtual") {
    virtualDisplay = new VirtualDisplay(debug);
    launchOptions.virtual_display = virtualDisplay.get();
    launchOptions.headless = false;
  } else {
    launchOptions.headless ||= headless;
  }

  if (!fromOptions || Object.keys(fromOptions).length === 0) {
    fromOptions = await getLaunchOptions({ debug, ...launchOptions });
  }

  if (persistentContext) {
    const context = await playwright.launchPersistentContext(
      "~/.crawlee/persistent-user-data-dir",
      fromOptions,
    );
    return syncAttachVD(context, virtualDisplay);
  }

  const browser = await playwright.launch(fromOptions);
  return syncAttachVD(browser, virtualDisplay);
}
