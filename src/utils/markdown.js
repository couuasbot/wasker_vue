import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

// Create and configure markdown-it instance
const md = new MarkdownIt({
    html: true,
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return '<pre class="hljs"><code>' +
                    hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                    '</code></pre>';
            } catch (__) { }
        }

        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
    }
});

// Override fence rule to add wrapper and copy button
const defaultFence = md.renderer.rules.fence || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
};

md.renderer.rules.fence = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const info = token.info ? md.utils.escapeHtml(token.info).trim() : '';
    const langName = info ? info.split(/\s+/g)[0] : '';

    if (langName === 'mermaid') {
        return `<pre class="mermaid">${token.content}</pre>`;
    }

    // Render the original code block
    const rawCode = defaultFence(tokens, idx, options, env, self);

    // Wrap it
    return `<div class="code-wrapper">
                <div class="code-header">
                    <span class="lang-tag">${langName}</span>
                    <button class="copy-btn" data-code="${md.utils.escapeHtml(token.content)}">
                        <i class="far fa-copy"></i> Copy
                    </button>
                </div>
                ${rawCode}
            </div>`;
};

// Table styling rule (optional)
md.renderer.rules.table_open = function () {
    return '<div class="table-responsive"><table class="table table-striped">';
};
md.renderer.rules.table_close = function () {
    return '</table></div>';
};

// Anchor ID generation for headings
md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const level = token.tag.slice(1);
    const nextToken = tokens[idx + 1];

    if (nextToken && nextToken.type === 'inline') {
        const title = nextToken.content;
        const slug = title.toLowerCase()
            .trim()
            .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-') // Support Chinese characters + alphanumeric
            .replace(/^-+|-+$/g, '');

        return `<h${level} id="${slug}">`;
    }

    return `<h${level}>`;
};


export default md;
