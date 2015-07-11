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
            this.olstack = [];
            this.inlineelements = ['strong', 'b', 'i', 'em', 'u', 'a', 'img', 'code'];
            this.htmlblocklevelelement = ['div', 'iframe', 'script'];
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
                var markdown = this.walk(dom, { keepHtml: keepHtml }).trim().replace(/•/g, ' ');
            } catch (err) {
                return cbk(err, null);
            }

            return cbk(null, markdown);
        }
    }, {
        key: 'walk',
        value: function walk(nodes, options) {

            var buffer = [];

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = nodes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var node = _step.value;

                    var markdown;

                    if (this.isText(node)) {
                        markdown = this.text(node);
                    } else {
                        var innerMarkdown = this.walk(node.children, options);
                        var method = 'wrap_' + node.name;

                        if (method in this) {
                            markdown = this[method](node, innerMarkdown);
                        } else {
                            markdown = this.wrap_generic(node, innerMarkdown);
                        }

                        // Margins between block elements are collapsed into a single line
                        // pre-margins between an inline element and it's next sibling block are handled here also
                        // Block-level elements handle themselves their post-margin
                        // This is so because we're *descending* the dom tree :)

                        var prevNonBlankText = this.previoussiblingnonblanktext(node);
                        if (prevNonBlankText) {
                            var isPrevNonBlankTextBlock = this.isBlock(prevNonBlankText);
                            if (this.isInline(node)) {
                                // current node is inline, previous was block : adding an extra new line
                                if (isPrevNonBlankTextBlock) {
                                    markdown = '\n' + markdown;
                                }
                            } else if (node.name !== 'br' && !this.isList(node) && this.isBlock(node)) {
                                // current node is block, previous was inline or text : adding an extra new line
                                if (!isPrevNonBlankTextBlock) {
                                    markdown = '\n' + markdown;
                                }
                            }
                        }
                    }

                    buffer.push(markdown);
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

            return buffer.join('');
        }
    }, {
        key: 'isBlankText',

        // handlers

        value: function isBlankText(text) {
            return text.trim() === '';
        }
    }, {
        key: 'text',
        value: function text(node) {
            var text = node.data;

            if (!text) {
                return '';
            }

            if (this.hasAncestorOfType(node, ['code', 'pre'])) {
                return text;
            }

            // normalize whitespace

            if (node.prev) {
                if (this.isInline(node.prev)) {
                    text = text.replace(/^\n+/, ' '); // trimming newlines (would be converted to untrimmed spaces otherwise)
                } else {
                    text = text.replace(/^\n+/, '');
                }
            }

            if (node.next) {
                if (this.isInline(node.next)) {
                    text = text.replace(/\n+$/, ' '); // trimming newlines (would be converted to untrimmed spaces otherwise)
                } else {
                    text = text.replace(/\n+$/, '');
                }
            }

            text = text.replace('\n', ' ') // converting inner newlines to spaces
            .replace(/\s+/g, ' '); // converting sequences of whitespace to single spaces

            if (
            // if prev node is block, this node is not displayed on the same line, so left-trim
            node.prev && this.isBlock(node.prev) || node.parent && this.isBlock(node.parent) && this.isFirstChild(node)) {
                text = text.replace(/^\s*/, '');
            }

            if (node.parent && this.isBlock(node.parent) && this.isLastChild(node)) {
                text = text.replace(/\s*$/, '');
            }

            return text;
        }
    }, {
        key: 'wrap_generic',
        value: function wrap_generic(node, markdown) {

            var htmlattribs = '';
            var attrs = Object.keys(node.attribs);
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = attrs[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var attrname = _step2.value;

                    htmlattribs += ' ' + attrname + '="' + node.attribs[attrname] + '"';
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

            return '<' + node.name + htmlattribs + '>' + markdown.replace(/\s+/gm, ' ') + '</' + node.name + '>' + (this.isHtmlBlockLevelElement(node.name) ? '\n' : '');
            //return markdown;
        }
    }, {
        key: 'wrap_h1',

        // Block level elements

        value: function wrap_h1(node, markdown) {
            return '\n# ' + markdown + '\n';
        }
    }, {
        key: 'wrap_h2',
        value: function wrap_h2(node, markdown) {
            return '\n## ' + markdown + '\n';
        }
    }, {
        key: 'wrap_h3',
        value: function wrap_h3(node, markdown) {
            return '\n### ' + markdown + '\n';
        }
    }, {
        key: 'wrap_h4',
        value: function wrap_h4(node, markdown) {
            return '\n#### ' + markdown + '\n';
        }
    }, {
        key: 'wrap_h5',
        value: function wrap_h5(node, markdown) {
            return '\n##### ' + markdown + '\n';
        }
    }, {
        key: 'wrap_h6',
        value: function wrap_h6(node, markdown) {
            return '\n###### ' + markdown + '\n';
        }
    }, {
        key: 'wrap_blockquote',
        value: function wrap_blockquote(node, markdown) {
            return '\n' + markdown.trim().replace(/^/gm, '> ') + '\n';
        }
    }, {
        key: 'wrap_pre',
        value: function wrap_pre(node, markdown) {
            return '\n' + markdown.trim().replace(/^/gm, this.tabindent).replace(/ /g, '•') + '\n';
        }
    }, {
        key: 'wrap_code',
        value: function wrap_code(node, markdown) {
            if (this.hasAncestorOfType(node, ['pre'])) {
                return markdown;
            }

            return '`' + markdown.trim() + '`';
        }
    }, {
        key: 'wrap_ul',

        //wrap_ul(node, markdown) { return markdown.trim().replace(/^/gm, '* ') + '\n\n'; }
        value: function wrap_ul(node, markdown) {
            return '\n' + markdown.trim() + '\n';
        }
    }, {
        key: 'wrap_ol',
        value: function wrap_ol(node, markdown) {
            this.olstack.pop();return '\n' + markdown.trim() + '\n';
        }
    }, {
        key: 'wrap_li',
        value: function wrap_li(node, markdown) {

            var bullet = '* ';

            if (node.parent && node.parent.type === 'tag' && node.parent.name === 'ol') {
                if (this.isFirstChildNonText(node)) {
                    this.olstack.push(0);
                }
                this.olstack[this.olstack.length - 1]++;
                bullet = this.olstack[this.olstack.length - 1] + '. ';
            }

            var firstChildNonBlankText = this.firstChildNonBlankText(node);
            if (firstChildNonBlankText) {
                if (this.isList(firstChildNonBlankText)) {
                    bullet = this.tabindent;
                } else if (this.isBlock(firstChildNonBlankText)) {
                    // p in li: add newline before
                    bullet = '\n' + bullet;
                } else {
                    var prevsibling = this.previoussiblingnonblanktext(node);
                    if (prevsibling && prevsibling.type === 'tag' && prevsibling.name === 'li' && this.isBlock(this.firstChildNonBlankText(prevsibling))) {
                        bullet = '\n' + bullet;
                    }
                }
            }

            return bullet + markdown.replace(/^/gm, this.tabindent).trim() + '\n';
        }
    }, {
        key: 'wrap_p',
        value: function wrap_p(node, markdown) {
            return '\n' + markdown + '\n';
        }
    }, {
        key: 'wrap_br',
        value: function wrap_br(node, markdown) {
            return '  \n';
        }
    }, {
        key: 'wrap_hr',
        value: function wrap_hr(node, markdown) {
            return '\n* * *\n';
        }
    }, {
        key: 'wrap_strong',

        // Inline elements

        value: function wrap_strong(node, markdown) {
            return '**' + markdown + '**';
        }
    }, {
        key: 'wrap_b',
        value: function wrap_b(node, markdown) {
            return this.wrap_strong(node, markdown);
        }
    }, {
        key: 'wrap_em',
        value: function wrap_em(node, markdown) {
            return '*' + markdown + '*';
        }
    }, {
        key: 'wrap_i',
        value: function wrap_i(node, markdown) {
            return this.wrap_em(node, markdown);
        }
    }, {
        key: 'wrap_a',
        value: function wrap_a(node, markdown) {

            var url = this.attrOrFalse('href', node);
            var title = this.attrOrFalse('title', node);

            if (url && url === markdown && (!title || title === '')) {
                return '<' + url + '>';
            } else if ((url === markdown || url.replace(/^mailto:/, '') === markdown) && (!title || title === '')) {
                return '<' + url.replace(/^mailto:/, '') + '>';
            }

            return '[' + markdown + '](' + (url ? url : '') + (title ? ' "' + title + '"' : '') + ')';
        }
    }, {
        key: 'wrap_img',
        value: function wrap_img(node, markdown) {
            var alt = this.attrOrFalse('alt', node);
            var src = this.attrOrFalse('src', node);
            var title = this.attrOrFalse('title', node);
            return '![' + (alt ? alt : '') + '](' + (src ? src : '') + (title ? ' "' + title + '"' : '') + ')';
        }
    }, {
        key: 'hasParentOfType',

        // helpers

        value: function hasParentOfType(node, tagname) {
            return node.parent && node.parent.name === tagname;
        }
    }, {
        key: 'hasAncestorOfType',
        value: function hasAncestorOfType(node, tagnames) {

            var parent = node.parent;
            while (parent) {
                if (tagnames.indexOf(parent.name) > -1) {
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
            if (this.hasAncestorOfType(node, ['code', 'pre'])) {
                return text;
            }

            escapeChar = '\\';
            return text.replace(/\\/g, escapeChar + escapeChar).replace(/`/g, escapeChar + '`').replace(/\#/g, escapeChar + '#');
        }
    }, {
        key: 'isInline',
        value: function isInline(node) {
            return node && node.type === 'tag' && this.inlineelements.indexOf(node.name) >= 0;
        }
    }, {
        key: 'isBlock',
        value: function isBlock(node) {
            return node && (node.type === 'tag' || node.type === 'script') && !this.isInline(node);
        }
    }, {
        key: 'isText',
        value: function isText(node) {
            return node && node.type === 'text';
        }
    }, {
        key: 'isList',
        value: function isList(node) {
            return node && node.type === 'tag' && (node.name === 'ul' || node.name === 'ol');
        }
    }, {
        key: 'isHtmlBlockLevelElement',
        value: function isHtmlBlockLevelElement(tag) {
            return this.htmlblocklevelelement.indexOf(tag) >= 0;
        }
    }, {
        key: 'isPreviousSiblingInline',
        value: function isPreviousSiblingInline(node) {
            return node && node.prev && node.prev.name && this.isInline(node.prev);
        }
    }, {
        key: 'isPreviousSiblingBlock',
        value: function isPreviousSiblingBlock(node) {
            return node && node.prev && node.prev.name && !this.isInline(node.prev);
        }
    }, {
        key: 'isPreviousSiblingNonTextInline',
        value: function isPreviousSiblingNonTextInline(node) {
            var previous;

            if (node) {
                previous = this.previoussiblingnontext(node);
            }

            return node && previous && this.isInline(previous);
        }
    }, {
        key: 'isPreviousSiblingNonTextBlock',
        value: function isPreviousSiblingNonTextBlock(node) {
            var previous;
            if (node) {
                previous = this.previoussiblingnontext(node);
            }

            return node && previous && !this.isInline(previous);
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
        key: 'previoussiblingnonblanktext',
        value: function previoussiblingnonblanktext(node) {

            var prevsibling = node;
            var go = true;

            while (go) {

                if (prevsibling) {
                    prevsibling = prevsibling.prev;
                }

                if (prevsibling && (prevsibling.type !== 'text' || prevsibling.data.trim() !== '')) {
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
            return node && node.next && node.next.name && this.isInline(node.next);
        }
    }, {
        key: 'isNextSiblingBlock',
        value: function isNextSiblingBlock(node) {
            return node && node.next && node.next.name && !this.isInline(node.next);
        }
    }, {
        key: 'isNextSiblingNonTextInline',
        value: function isNextSiblingNonTextInline(node) {
            var next;

            if (node) {
                next = this.nextsiblingnontext(node);
            }

            return node && next && this.isInline(next);
        }
    }, {
        key: 'isNextSiblingNonTextBlock',
        value: function isNextSiblingNonTextBlock(node) {
            var next;
            if (node) {
                next = this.previoussiblingnontext(node);
            }
            return node && next && !this.isInline(next);
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
                if (node.children[i] && node.children[i].type !== 'text') {
                    return node.children[i];
                }
                i++;
            }

            return null;
        }
    }, {
        key: 'firstChildNonBlankText',
        value: function firstChildNonBlankText(node) {
            var i = 0;

            while (i < node.children.length) {
                if (node.children[i] && node.children[i].type !== 'text' || node.children[i].data.trim() !== '') {
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

// if current node is block, this node is not displayed on the same line either, so left-trim

