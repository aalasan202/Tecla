import { describe, expect, it } from "vitest";
import { installOption, isIOSDevice } from "./install";

describe("installOption", () => {
  it("instalada gana a todo", () => {
    expect(installOption({ standalone: true, hasPrompt: true, isIOS: true })).toBe("installed");
    expect(installOption({ standalone: true, hasPrompt: false, isIOS: false })).toBe("installed");
  });

  it("botón si el navegador ofreció instalar", () => {
    expect(installOption({ standalone: false, hasPrompt: true, isIOS: false })).toBe("button");
    expect(installOption({ standalone: false, hasPrompt: true, isIOS: true })).toBe("button");
  });

  it("instrucciones en iPhone/iPad sin diálogo de instalación", () => {
    expect(installOption({ standalone: false, hasPrompt: false, isIOS: true })).toBe("ios-instructions");
  });

  it("sin soporte en el resto", () => {
    expect(installOption({ standalone: false, hasPrompt: false, isIOS: false })).toBe("unsupported");
  });
});

describe("isIOSDevice", () => {
  const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
  const IPAD_OLD = "Mozilla/5.0 (iPad; CPU OS 12_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1";
  const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15";
  const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";
  const WINDOWS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
  const FIREFOX = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0";

  it("reconoce iPhone y iPad", () => {
    expect(isIOSDevice(IPHONE, "iPhone", 5)).toBe(true);
    expect(isIOSDevice(IPAD_OLD, "iPad", 5)).toBe(true);
  });

  it("reconoce iPadOS, que se presenta como Mac con pantalla táctil", () => {
    expect(isIOSDevice(MAC, "MacIntel", 5)).toBe(true);
  });

  it("no confunde un Mac de escritorio ni otros sistemas", () => {
    expect(isIOSDevice(MAC, "MacIntel", 0)).toBe(false);
    expect(isIOSDevice(ANDROID, "Linux armv8l", 5)).toBe(false);
    expect(isIOSDevice(WINDOWS, "Win32", 0)).toBe(false);
    expect(isIOSDevice(FIREFOX, "Win32", 0)).toBe(false);
  });
});
