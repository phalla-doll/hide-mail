export function walkTextNodes(root: Node, callback: (node: Text) => void): void {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node: Node): number {
        const nodeValue = node.nodeValue;
        if (!nodeValue?.trim()) return NodeFilter.FILTER_REJECT;

        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const tag = parent.tagName.toLowerCase();

        if (
          tag === "script" ||
          tag === "style" ||
          tag === "noscript" ||
          parent.isContentEditable
        ) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let current: Node | null;
  while ((current = walker.nextNode())) {
    callback(current as Text);
  }
}
