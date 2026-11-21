type OpenHandler = () => void;

let openHandler: OpenHandler | null = null;

/** Sync registration so hero CTA never races the window event listener. */
export function registerAiSearchOpenHandler(handler: OpenHandler): () => void {
  openHandler = handler;
  return () => {
    if (openHandler === handler) openHandler = null;
  };
}

export function requestOpenAiSearch(): void {
  if (openHandler) {
    openHandler();
    return;
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('turta:open-ai-search'));
  }
}
