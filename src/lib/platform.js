/**
 * Returns true if the current platform is macOS.
 * Uses the modern userAgentData API with a fallback to the deprecated navigator.platform.
 */
export function isMac() {
  if (navigator.userAgentData) {
    return navigator.userAgentData.platform.toUpperCase().includes('MAC');
  }
  return navigator.platform.toUpperCase().includes('MAC');
}
