/**
 * Utility to convert Lexical JSON format to safe HTML.
 * Used for compatibility with older chapters stored in Lexical format.
 */

export function lexicalToHtml(json: string | any): string {
    if (!json) return "";

    let node: any;
    try {
        node = typeof json === "string" ? JSON.parse(json) : json;
    } catch (e) {
        return typeof json === "string" ? json : "";
    }

    const rootNode = node.root || node.editorState?.root;

    if (rootNode) {
        return convertLexicalNode(rootNode);
    }

    if (Array.isArray(node)) {
        return node.map(convertLexicalNode).join("");
    }

    return typeof json === "string" ? json : "";
}

function convertLexicalNode(node: any): string {
    if (!node) return "";

    switch (node.type) {
        case "root":
            return node.children?.map(convertLexicalNode).join("") || "";

        case "paragraph":
            const pContent = node.children?.map(convertLexicalNode).join("") || "";
            return `<p>${pContent}</p>`;

        case "text":
            let text = node.text || "";
            if (node.format & 1) text = `<strong>${text}</strong>`;
            if (node.format & 2) text = `<em>${text}</em>`;
            if (node.format & 8) text = `<u>${text}</u>`;
            if (node.format & 4) text = `<s>${text}</s>`;
            if (node.format & 16) text = `<code>${text}</code>`;
            return text;

        case "heading":
            const tag = node.tag || "h2";
            const hContent = node.children?.map(convertLexicalNode).join("") || "";
            return `<${tag}>${hContent}</${tag}>`;

        case "list":
            const listTag = node.listType === "number" ? "ol" : "ul";
            const listContent = node.children?.map(convertLexicalNode).join("") || "";
            return `<${listTag}>${listContent}</${listTag}>`;

        case "listitem":
            const liContent = node.children?.map(convertLexicalNode).join("") || "";
            return `<li>${liContent}</li>`;

        case "quote":
            const quoteContent = node.children?.map(convertLexicalNode).join("") || "";
            return `<blockquote>${quoteContent}</blockquote>`;

        case "link":
            const linkContent = node.children?.map(convertLexicalNode).join("") || "";
            return `<a href="${node.url || "#"}">${linkContent}</a>`;

        case "horizontalrule":
            return "<hr />";

        case "image":
            return `<img src="${node.src}" alt="${node.altText || ""}" />`;

        case "youtube":
            return `<div data-lexical-youtube="${node.videoID}"></div>`;

        default:
            if (node.children) {
                return node.children.map(convertLexicalNode).join("");
            }
            return "";
    }
}
