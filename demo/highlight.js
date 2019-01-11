const hljs = require('highlight.js/lib/highlight');
const javascript = require('highlight.js/lib/languages/javascript');

hljs.registerLanguage('javascript', javascript);
hljs.initHighlightingOnLoad();
