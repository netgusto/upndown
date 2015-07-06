'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _htmlparser2 = require('htmlparser2');

var _htmlparser22 = _interopRequireDefault(_htmlparser2);

var upndown = (function () {
    function upndown() {
        _classCallCheck(this, upndown);
    }

    _createClass(upndown, [{
        key: 'init',
        value: function init() {
            this.depth = 0;
            this.buffer = { 0: [] };
            this.prefixstack = { 0: '' };
            this.currentollistack = [];

            this.inlineelements = ['strong', 'b', 'i', 'em', 'u', 'a', 'img', 'code'];
            this.nonmarkdownblocklevelelement = ['div', 'iframe', 'script'];
            this.tabindent = '    ';
        }
    }, {
        key: 'parse',
        value: function parse(html, cbk) {
            var handler = new _htmlparser22['default'].DomHandler(function (err, dom) {
                if (err) {
                    return cbk(err, null);
                }
                return cbk(null, dom);
            }, { withDomLvl1: false, withStartIndices: false });

            var p = new _htmlparser22['default'].Parser(handler, { decodeEntities: true });
            p.write(html);
            p.end();
        }
    }, {
        key: 'convert',
        value: function convert(html, cbk, options) {
            this.parse(html, (function (err, dom) {
                if (err) {
                    return cbk(err, null);
                }
                return this.convertDom(dom, function (err2, markdown) {
                    if (err2) {
                        return cbk(err2, null);
                    }
                    return cbk(null, markdown);
                }, options);
            }).bind(this));
        }
    }, {
        key: 'convertDom',
        value: function convertDom(dom, cbk) {
            var _ref = arguments[2] === undefined ? {} : arguments[2];

            var _ref$keepHtml = _ref.keepHtml;
            var keepHtml = _ref$keepHtml === undefined ? false : _ref$keepHtml;

            this.init();

            try {
                var markdown = this.walk(dom, { keepHtml: keepHtml });
            } catch (err) {
                return cbk(err, null);
            }

            return cbk(null, markdown);
        }
    }, {
        key: 'walk',
        value: function walk(nodes, options) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {

                for (var _iterator = nodes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var node = _step.value;

                    if (node.type === 'tag' || node.type === 'script') {
                        var openmethod = 'open_' + node.name;
                        if (openmethod in this) {
                            this[openmethod](node);
                        } else {
                            if (options.keepHtml) {
                                this.open_html(node);
                            }
                        }

                        this.walk(node.children, options);

                        var closemethod = 'close_' + node.name;
                        if (closemethod in this) {
                            this[closemethod](node);
                        } else {
                            if (options.keepHtml) {
                                this.close_html(node);
                            }
                        }
                    } else {
                        this.text(node);
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator['return']) {
                        _iterator['return']();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return this.buffer[0].join('').replace(/\s*$/, '').replace(/^[ \t]+$/gm, '').replace(/\n{3,}/gm, '\n\n\n').replace(/[\n| ]+$/, '').replace(/^\n+/, '');
        }
    }, {
        key: 'text',

        // handlers

        value: function text(node) {
            var text = this.unescape(node.data);
            if (text) {
                if (!(this.hasParentOfType(node, 'code') && this.isFirstChild(node)) && (!this.isPreviousSiblingInline(node) || this.isFirstChild(node) && this.hasParentOfType(node, 'li'))) {
                    if (text.match(/^[\n\s\t]+$/)) {
                        return;
                    }
                    //text = text.replace(/^[\s\t]*/, '');
                }
                if (!this.hasParentOfType(node, 'pre') && !this.hasParentOfType(node, 'code')) {
                    if (this.isNextSiblingBlock(node)) {
                        text = text.replace(/\n+$/, '');
                    }
                    text = text.replace(/\n/g, ' ');
                    text = text.replace(/[\s\t]+/g, ' ');
                }
                this.buffer[this.depth].push(this.escapeTextForMarkdown(node, text));
            } else {
                this.buffer[this.depth].push('');
            }
        }
    }, {
        key: 'open_html',
        value: function open_html(node) {

            var htmltag, tag;

            if (this.isWrappingRootNode(node)) {
                return;
            }

            tag = node.name;

            htmltag = '<' + tag;

            if (this.isNonMarkdownBlockLevelElement(tag) && !this.isFirstChildNonText(node)) {
                htmltag = '\n' + htmltag;
                if (this.isPreviousSiblingBlock()) {
                    htmltag = '\n' + htmltag;
                }
            }

            var attrs = Object.keys(node.attribs);
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = attrs[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var attrname = _step2.value;

                    htmltag += ' ' + attrname + '="' + node.attribs[attrname] + '"';
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                        _iterator2['return']();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            htmltag += '>';
            this.buffer[this.depth].push(htmltag);
            this.prefixstack_push('');
            this.depth++;

            this.buffer[this.depth] = [];
        }
    }, {
        key: 'open_generic',
        value: function open_generic(node) {
            var prefix = arguments[1] === undefined ? '' : arguments[1];

            this.prefixstack_push(prefix);
            this.depth++;
            this.buffer[this.depth] = [];
        }
    }, {
        key: 'open_blockquote',
        value: function open_blockquote(node) {
            this.open_generic(node, '> ');
        }
    }, {
        key: 'open_pre',
        value: function open_pre(node) {
            this.open_generic(node, this.tabindent);
        }
    }, {
        key: 'open_ol',
        value: function open_ol(node) {
            this.currentollistack.push(1);
            this.open_generic(node);
        }
    }, {
        key: 'open_li',
        value: function open_li(node) {
            this.open_generic(node, this.tabindent);
        }
    }, {
        key: 'open_h1',
        value: function open_h1(node) {
            this.open_generic(node);
        }
    }, {
        key: 'open_h2',
        value: function open_h2(node) {
            this.open_generic(node);
        }
    }, {
        key: 'open_h3',
        value: function open_h3(node) {
            this.open_generic(node);
        }
    }, {
        key: 'open_h4',
        value: function open_h4(node) {
            this.open_generic(node);
        }
    }, {
        key: 'open_h5',
        value: function open_h5(node) {
            this.open_generic(node);
        }
    }, {
        key: 'open_h6',
        value: function open_h6(node) {
            this.open_generic(node);
        }
    }, {
        key: 'open_strong',
        value: function open_strong(node) {
            this.open_generic(node);
        }
    }, {
        key: 'open_b',
        value: function open_b(node) {
            this.open_generic(node);
        }
    }, {
        key: 'open_em',
        value: function open_em(node) {
            this.open_generic(node);
        }
    }, {
        key: 'open_i',
        value: function open_i(node) {
            this.open_generic(node);
        }
    }, {
        key: 'open_a',
        value: function open_a(node) {
            this.open_generic(node);
        }
    }, {
        key: 'open_img',
        value: function open_img(node) {
            this.open_generic(node);
        }
    }, {
        key: 'open_br',
        value: function open_br(node) {
            this.open_generic(node);
        }
    }, {
        key: 'open_p',
        value: function open_p(node) {
            this.open_generic(node);
        }
    }, {
        key: 'open_br',
        value: function open_br(node) {
            this.open_generic(node);
        }
    }, {
        key: 'open_code',
        value: function open_code(node) {
            this.open_generic(node);
        }
    }, {
        key: 'open_hr',
        value: function open_hr(node) {
            this.open_generic(node);
        }
    }, {
        key: 'open_ul',
        value: function open_ul(node) {
            this.open_generic(node);
        }
    }, {
        key: 'close_html',
        value: function close_html(node) {
            var depth, html, prefix;
            if (this.isWrappingRootNode(node)) {
                return;
            }
            depth = this.depth;
            this.depth--;
            prefix = this.prefixstack_pop();
            html = prefix + this.buffer[depth].join('');

            this.buffer[depth - 1].push(html + '</' + node.name + '>');
        }
    }, {
        key: 'close_hx',
        value: function close_hx(node) {
            var depth, html, level, nl, prefix;
            depth = this.depth;
            this.depth--;
            prefix = this.prefixstack_pop();
            level = parseInt(node.name.substr(1));
            html = prefix + Array(level + 1).join('#') + ' ' + this.buffer[depth].join('').split('\n').join('\n' + prefix);
            nl = '';
            if (!this.isFirstNodeNonText(node) && !this.isFirstChildNonText(node)) {
                nl = '\n';
                nl += '\n';
            }
            this.buffer[depth - 1].push(nl + html);
        }
    }, {
        key: 'close_h1',
        value: function close_h1(node) {
            this.close_hx(node);
        }
    }, {
        key: 'close_h2',
        value: function close_h2(node) {
            this.close_hx(node);
        }
    }, {
        key: 'close_h3',
        value: function close_h3(node) {
            this.close_hx(node);
        }
    }, {
        key: 'close_h4',
        value: function close_h4(node) {
            this.close_hx(node);
        }
    }, {
        key: 'close_h5',
        value: function close_h5(node) {
            this.close_hx(node);
        }
    }, {
        key: 'close_h6',
        value: function close_h6(node) {
            this.close_hx(node);
        }
    }, {
        key: 'close_p',
        value: function close_p(node) {
            var depth, html, nl, prefix;
            depth = this.depth;
            this.depth--;
            prefix = this.prefixstack_pop();
            nl = '';
            if (!this.isFirstNodeNonText(node) && !this.isFirstChildNonTextOfParentType(node, 'blockquote') && !(this.hasParentOfType(node, 'li') && this.isFirstChildNonText(node))) {
                nl += '\n\n';
            }
            html = prefix + this.buffer[depth].join('').split('\n').join('\n' + prefix);
            this.buffer[depth - 1].push(nl + html);
        }
    }, {
        key: 'close_hr',
        value: function close_hr(node) {
            var depth, html, nl, prefix;
            depth = this.depth;
            this.depth--;
            prefix = this.prefixstack_pop();
            nl = '';
            if (!this.isFirstNodeNonText(node)) {
                nl = '\n\n';
            }
            html = prefix + nl + '* * *\n' + this.buffer[depth].join('').split('\n').join('\n' + prefix);
            this.buffer[depth - 1].push(html);
        }
    }, {
        key: 'close_blockquote',
        value: function close_blockquote(node) {
            var depth, html, nl, postnl, prefix;
            depth = this.depth;
            this.depth--;
            prefix = this.prefixstack_pop();
            html = prefix + this.buffer[depth].join('').split('\n').join('\n' + prefix);
            nl = '';
            if (!this.isFirstNodeNonText(node) && !this.isFirstChildNonText(node)) {
                nl += '\n\n';
            }
            postnl = '';
            if (this.isNextSiblingNonTextInline(node)) {
                postnl = '\n\n';
            }
            this.buffer[depth - 1].push(nl + html + postnl);
        }
    }, {
        key: 'close_pre',
        value: function close_pre(node) {
            var beforenl, depth, html, prefix, prevsibling, superextrapadding;
            depth = this.depth;
            this.depth--;
            prefix = this.prefixstack_pop();
            html = prefix + this.buffer[depth].join('').split('\n').join('\n' + prefix);
            beforenl = '';
            superextrapadding = '';
            if (!this.isFirstNodeNonText(node)) {
                beforenl = '\n\n';
            }
            prevsibling = this.previoussiblingnontext(node);
            if (prevsibling && (prevsibling.name === 'ul' || prevsibling.name === 'li') || this.hasParentOfType(node, 'li')) {
                superextrapadding = '\n';
            } else {
                superextrapadding = '';
            }
            this.buffer[depth - 1].push(superextrapadding + beforenl + html);
        }
    }, {
        key: 'close_code',
        value: function close_code(node) {
            var begin, depth, end, html, prefix;
            depth = this.depth;
            this.depth--;
            prefix = this.prefixstack_pop();
            if (!this.hasAncestorOfType(node, 'pre')) {
                begin = '`';
                end = '`';
            } else {
                begin = '';
                end = '';
            }
            html = prefix + unescape(begin + this.buffer[depth].join('') + end).split('\n').join('\n' + prefix);
            this.buffer[depth - 1].push(html);
        }
    }, {
        key: 'close_ul',
        value: function close_ul(node) {
            var depth, html, nl, prefix;
            depth = this.depth;
            this.depth--;
            prefix = this.prefixstack_pop();
            nl = '';
            if (!this.isFirstNodeNonText(node)) {
                nl = '\n';
                if ((!this.hasParentOfType(node, 'li') || this.hasPreviousSiblingNonTextOfType(node, 'p')) && (!this.hasParentOfType(node, 'blockquote') || !this.isFirstChildNonText(node))) {
                    nl += '\n';
                }
            }
            html = nl + prefix + this.buffer[depth].join('').split('\n').join('\n' + prefix);
            this.buffer[depth - 1].push(html);
        }
    }, {
        key: 'close_ol',
        value: function close_ol(node) {
            this.currentollistack.pop();
            this.close_ul(node);
        }
    }, {
        key: 'close_li',
        value: function close_li(node) {
            var currentolli, depth, html, nl, prefix, puce;
            depth = this.depth;
            this.depth--;
            prefix = this.prefixstack_pop();
            if (this.hasParentOfType(node, 'ol')) {
                currentolli = this.currentollistack[this.currentollistack.length - 1];
                puce = currentolli + '.';
                //puce += Array((4 - puce.length) + 1).join(' ');
                puce += ' ';
                this.currentollistack[this.currentollistack.length - 1]++;
            } else {
                puce = '* ';
            }
            if (!(this.isFirstNodeNonText(node.parent) && this.isFirstChildNonText(node)) && this.hasPreviousSiblingNonTextOfType(node, 'li')) {
                nl = '\n';
            } else {
                nl = '';
            }
            if (!this.isFirstChildNonText(node) && this.hasFirstChildNonTextOfType(node, 'p')) {
                nl += '\n';
            }
            html = nl + puce + this.buffer[depth].join('').split('\n').join('\n' + prefix);
            return this.buffer[depth - 1].push(html);
        }
    }, {
        key: 'close_strong',
        value: function close_strong() {
            var depth, html, prefix;
            depth = this.depth;
            this.depth--;
            prefix = this.prefixstack_pop();
            html = prefix + '**' + this.buffer[depth].join('').split('\n').join('\n' + prefix);
            return this.buffer[depth - 1].push(html + '**');
        }
    }, {
        key: 'close_b',
        value: function close_b(node) {
            this.close_strong(node);
        }
    }, {
        key: 'close_em',
        value: function close_em() {
            var depth, html, prefix;
            depth = this.depth;
            this.depth--;
            prefix = this.prefixstack_pop();
            html = prefix + '*' + this.buffer[depth].join('').split('\n').join('\n' + prefix) + '*';
            return this.buffer[depth - 1].push(html);
        }
    }, {
        key: 'close_i',
        value: function close_i(node) {
            this.close_em(node);
        }
    }, {
        key: 'close_a',
        value: function close_a(node) {
            var depth, label, title, unescapedurl, url;
            depth = this.depth;
            this.depth--;
            /*prefix = */this.prefixstack_pop();
            url = this.attrOrFalse('href', node);
            title = this.attrOrFalse('title', node);
            label = this.buffer[depth].join('');
            unescapedurl = this.unescape(url);
            if (url && url === label && (!title || title === '')) {
                this.buffer[depth - 1].push('<' + url + '>');
            } else if ((unescapedurl === label || unescapedurl.replace(/^mailto:/, '') === label) && (!title || title === '')) {
                this.buffer[depth - 1].push('<' + unescapedurl.replace(/^mailto:/, '') + '>');
            } else {
                this.buffer[depth - 1].push('[' + label + '](' + (url ? this.unescape(url) : '') + (title ? ' "' + this.unescape(title) + '"' : '') + ')');
            }
        }
    }, {
        key: 'close_img',
        value: function close_img(node) {
            var alt, depth, html, prefix, src, title;
            depth = this.depth;
            this.depth--;
            prefix = this.prefixstack_pop();
            alt = this.attrOrFalse('alt', node);
            src = this.attrOrFalse('src', node);
            title = this.attrOrFalse('title', node);
            html = prefix + '![' + (alt ? alt : '') + '](' + (src ? src : '') + (title ? ' "' + title + '"' : '') + ')';
            return this.buffer[depth - 1].push(html);
        }
    }, {
        key: 'close_br',
        value: function close_br() {
            var depth, html, prefix;
            depth = this.depth;
            this.depth--;
            prefix = this.prefixstack_pop();
            html = prefix + this.buffer[depth].join('').split('\n').join('\n' + prefix);
            return this.buffer[depth - 1].push(html + '  \n');
        }
    }, {
        key: 'getPrefix',

        // helpers

        value: function getPrefix() {
            if (this.depth in this.prefixstack) {
                return this.prefixstack[this.depth];
            }
            return '';
        }
    }, {
        key: 'prefixstack_push',
        value: function prefixstack_push(prefix) {
            this.prefixstack[this.depth] = prefix;
        }
    }, {
        key: 'prefixstack_pop',
        value: function prefixstack_pop() {
            var before;
            before = this.prefixstack[this.depth];
            this.prefixstack[this.depth] = '';
            return before;
        }
    }, {
        key: 'hasParentOfType',
        value: function hasParentOfType(node, tagname) {
            return node.parent && node.parent.name === tagname;
        }
    }, {
        key: 'hasAncestorOfType',
        value: function hasAncestorOfType(node, tagname) {

            var parent = node.parent;
            while (parent) {
                if (parent.name === tagname) {
                    return true;
                }
                parent = parent.parent;
            }

            return false;
        }
    }, {
        key: 'escapeTextForMarkdown',
        value: function escapeTextForMarkdown(node, text) {

            var escapeChar;
            if (this.hasAncestorOfType(node, 'code') || this.hasAncestorOfType(node, 'pre')) {
                return text;
            }

            escapeChar = '\\';
            return text.replace(/\\/g, escapeChar + escapeChar).replace(/`/g, escapeChar + '`').replace(/\#/g, escapeChar + '#');
        }
    }, {
        key: 'isInline',
        value: function isInline(tag) {
            return this.inlineelements.indexOf(tag) >= 0;
        }
    }, {
        key: 'isNonMarkdownBlockLevelElement',
        value: function isNonMarkdownBlockLevelElement(tag) {
            return this.nonmarkdownblocklevelelement.indexOf(tag) >= 0;
        }
    }, {
        key: 'isPreviousSiblingInline',
        value: function isPreviousSiblingInline(node) {
            return node && node.prev && node.prev.name && this.isInline(node.prev.name);
        }
    }, {
        key: 'isPreviousSiblingBlock',
        value: function isPreviousSiblingBlock(node) {
            return node && node.prev && node.prev.name && !this.isInline(node.prev.name);
        }
    }, {
        key: 'isPreviousSiblingNonTextInline',
        value: function isPreviousSiblingNonTextInline(node) {
            var previous;

            if (node) {
                previous = this.previoussiblingnontext(node);
            }

            return node && previous && this.isInline(previous.name);
        }
    }, {
        key: 'isPreviousSiblingNonTextBlock',
        value: function isPreviousSiblingNonTextBlock(node) {
            var previous;
            if (node) {
                previous = this.previoussiblingnontext(node);
            }

            return node && previous && !this.isInline(previous.name);
        }
    }, {
        key: 'previoussiblingnontext',
        value: function previoussiblingnontext(node) {

            var prevsibling = node;
            var go = true;

            while (go) {

                if (prevsibling) {
                    prevsibling = prevsibling.prev;
                }

                if (prevsibling && prevsibling.type !== 'text') {
                    return prevsibling;
                }

                if (!(prevsibling && !this.isFirstChildNonText(prevsibling))) {
                    break;
                }
            }

            return null;
        }
    }, {
        key: 'isNextSiblingInline',
        value: function isNextSiblingInline(node) {
            return node && node.next && node.next.name && this.isInline(node.next.name);
        }
    }, {
        key: 'isNextSiblingBlock',
        value: function isNextSiblingBlock(node) {
            return node && node.next && node.next.name && !this.isInline(node.next.name);
        }
    }, {
        key: 'isNextSiblingNonTextInline',
        value: function isNextSiblingNonTextInline(node) {
            var next;

            if (node) {
                next = this.nextsiblingnontext(node);
            }

            return node && next && this.isInline(next.name);
        }
    }, {
        key: 'isNextSiblingNonTextBlock',
        value: function isNextSiblingNonTextBlock(node) {
            var next;
            if (node) {
                next = this.previoussiblingnontext(node);
            }
            return node && next && !this.isInline(next.name);
        }
    }, {
        key: 'nextsiblingnontext',
        value: function nextsiblingnontext(node) {

            var nextsibling = node;
            var go = true;

            while (go) {

                if (nextsibling) {
                    nextsibling = nextsibling.next;
                }

                if (nextsibling && nextsibling.type !== 'text') {
                    return nextsibling;
                }

                if (!(nextsibling && !this.isLastChildNonText(nextsibling))) {
                    break;
                }
            }

            return null;
        }
    }, {
        key: 'hasPreviousSiblingNonTextOfType',
        value: function hasPreviousSiblingNonTextOfType(node, tagname) {
            var previoussiblingnontext = this.previoussiblingnontext(node);
            return previoussiblingnontext && previoussiblingnontext.name === tagname;
        }
    }, {
        key: 'hasNextSiblingNonTextOfType',
        value: function hasNextSiblingNonTextOfType(node, tagname) {
            var nextsiblingnontext = this.nextsiblingnontext(node);
            return nextsiblingnontext && nextsiblingnontext.name === tagname;
        }
    }, {
        key: 'firstChild',
        value: function firstChild(node) {
            if (!node) {
                return null;
            }
            if (!node.children.length) {
                return null;
            }
            return node.children[0];
        }
    }, {
        key: 'lastChild',
        value: function lastChild(node) {
            if (!node) {
                return null;
            }
            if (!node.children.length) {
                return null;
            }
            return node.children[node.children.length - 1];
        }
    }, {
        key: 'firstChildNonText',
        value: function firstChildNonText(node) {
            var i = 0;

            while (i < node.children.length) {
                if (node.children[i].type !== 'text') {
                    return node.children[i];
                }
                i++;
            }

            return null;
        }
    }, {
        key: 'isFirstChild',
        value: function isFirstChild(node) {
            return !(!!node && !!node.prev);
        }
    }, {
        key: 'isFirstChildNonText',
        value: function isFirstChildNonText(node) {
            return node.parent && this.firstChildNonText(node.parent) === node;
        }
    }, {
        key: 'hasFirstChildNonTextOfType',
        value: function hasFirstChildNonTextOfType(node, childtype) {

            var firstChild = this.firstChild(node);

            if (!node || !firstChild) {
                return null;
            }

            if (firstChild.type !== 'text') {
                return firstChild.name === childtype;
            }

            return this.hasNextSiblingNonTextOfType(firstChild, childtype);
        }
    }, {
        key: 'isFirstChildNonTextOfParentType',
        value: function isFirstChildNonTextOfParentType(node, parenttype) {
            return this.hasParentOfType(node, parenttype) && this.firstChildNonText(node.parent) === node;
        }
    }, {
        key: 'isLastChild',
        value: function isLastChild(node) {
            return !node.next;
        }
    }, {
        key: 'isLastChildNonText',
        value: function isLastChildNonText(node) {
            return this.isLastChild(node) || this.lastChildNonText(node.parent) === node;
        }
    }, {
        key: 'isLastChildNonTextUntilDepth0',
        value: function isLastChildNonTextUntilDepth0(node) {
            if (!node) {
                return false;
            }

            if (node.parent && this.isFirstNodeNonText(node.parent) || this.isFirstNodeNonText(node)) {
                return true;
            }

            if (!this.isLastChildNonText(node)) {
                return false;
            }

            return this.isLastChildNonTextUntilDepth0(node.parent);
        }
    }, {
        key: 'isFirstNode',
        value: function isFirstNode(node) {
            return !!node && this.isFirstChild(node) && this.isWrappingRootNode(node.parent);
        }
    }, {
        key: 'isFirstNodeNonText',
        value: function isFirstNodeNonText(node) {
            return !!node && this.isFirstChildNonText(node) && this.isWrappingRootNode(node.parent);
        }
    }, {
        key: 'isWrappingRootNode',
        value: function isWrappingRootNode(node) {
            return node && node.type !== 'text' && node.name === 'div' && this.attrOrFalse('id', node) === 'hello';
        }
    }, {
        key: 'hasLastChildOfType',
        value: function hasLastChildOfType(node, lastchildtype) {
            var lastChild = this.lastChild(node);
            return node && lastChild && lastChild.name === lastchildtype;
        }
    }, {
        key: 'hasLastChildNonTextOfType',
        value: function hasLastChildNonTextOfType(node, lastchildtype) {

            var lastChild = this.lastChild(node);

            if (!node || !lastChild) {
                return null;
            }

            if (lastChild.type !== 'text') {
                return lastChild.name === lastchildtype;
            }

            return this.hasPreviousSiblingNonTextOfType(lastChild, lastchildtype);
        }
    }, {
        key: 'lastChildNonText',
        value: function lastChildNonText(node) {

            var lastChild = this.lastChild(node);

            if (!node || !lastChild) {
                return null;
            }

            if (lastChild.type !== 'text') {
                return lastChild;
            }

            return this.previoussiblingnontext(lastChild);
        }
    }, {
        key: 'unescape',
        value: function unescape(html) {
            return '' + html;
        }
    }, {
        key: 'attrOrFalse',
        value: function attrOrFalse(attr, node) {
            if (attr in node.attribs) {
                return node.attribs[attr];
            }

            return false;
        }
    }]);

    return upndown;
})();

exports['default'] = upndown;
module.exports = exports['default'];
/*node*/ /*node*/ /*node*/ /*prefix*/

