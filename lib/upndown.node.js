'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _htmlparser = require('htmlparser2');

var _htmlparser2 = _interopRequireDefault(_htmlparser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function () {
    function upndown() {
        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            _ref$decodeEntities = _ref.decodeEntities,
            decodeEntities = _ref$decodeEntities === undefined ? true : _ref$decodeEntities;

        _classCallCheck(this, upndown);

        this.decodeEntities = decodeEntities;
    }

    _createClass(upndown, [{
        key: 'init',
        value: function init() {
            this.olstack = [];
            this.inlineelements = ['strong', 'b', 'i', 'em', 'u', 'a', 'img', 'code'];
            this.htmlblocklevelelement = ['div', 'iframe', 'script'];
            this.tabindent = '    ';
            this.nbsp = '\0';
        }
    }, {
        key: 'parse',
        value: function parse(html, cbk) {
            var handler = new _htmlparser2.default.DomHandler(function (err, dom) {
                if (err) {
                    return cbk(err, null);
                }
                return cbk(null, dom);
            }, { withDomLvl1: false, withStartIndices: false });

            var p = new _htmlparser2.default.Parser(handler, { decodeEntities: this.decodeEntities });
            p.write(html);
            p.end();
        }
    }, {
        key: 'convert',
        value: function convert(html, cbk, options) {
            this.parse(html, function (err, dom) {
                if (err) {
                    return cbk(err, null);
                }
                return this.convertDom(dom, function (err2, markdown) {
                    if (err2) {
                        return cbk(err2, null);
                    }
                    return cbk(null, markdown);
                }, options);
            }.bind(this));
        }
    }, {
        key: 'convertDom',
        value: function convertDom(dom, cbk) {
            var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
                _ref2$keepHtml = _ref2.keepHtml,
                keepHtml = _ref2$keepHtml === undefined ? false : _ref2$keepHtml;

            this.init();

            this.walkNodes(dom, { keepHtml: keepHtml }).then(function (markdown) {
                if (!markdown) {
                    markdown = '';
                }
                var regx = new RegExp(this.nbsp, 'g');
                cbk(null, markdown.trim().replace(regx, ' '));
            }.bind(this)).catch(function (err) {
                cbk(err, null);
            });
        }
    }, {
        key: 'walkNodes',
        value: function walkNodes(nodes, options) {

            var self = this;

            return new Promise(function (topres, toprej) {
                var promises = [];

                var _loop = function _loop(nodekey) {
                    promises.push(new Promise(function (resolve, reject) {
                        self.walkNode(resolve, reject, options, nodes[nodekey]);
                    }));
                };

                for (var nodekey in nodes) {
                    _loop(nodekey);
                }

                Promise.all(promises).then(function (results) {
                    topres(results.join(''));
                }).catch(function (err) {
                    toprej(err);
                });
            }).catch(function (err) {
                throw err;
            });
        }
    }, {
        key: 'walkNode',
        value: function walkNode(resolve, reject, options, lenode) {
            if (this.isText(lenode)) {
                resolve(this.text(lenode));
            } else {
                this.walkNodes(lenode.children, options).then(function (innerMarkdown) {
                    this.wrapNode(resolve, reject, options, lenode, innerMarkdown);
                }.bind(this)).catch(function (err) {
                    reject(err);
                });
            }
        }
    }, {
        key: 'wrapNode',
        value: function wrapNode(resolve, reject, options, lenode, innerMarkdown) {

            var markdown = '';
            var method = 'wrap_' + lenode.name;

            if (method in this) {
                markdown = this[method](lenode, innerMarkdown);
            } else {
                if (options.keepHtml) {
                    markdown = this.wrap_generic(lenode, innerMarkdown);
                } else {
                    markdown = innerMarkdown;
                }
            }

            // Collapsing margins between block elements into a single line.
            // Pre-margins between an inline element and it's next sibling block are handled here also
            // Block-level elements handle themselves their post-margin
            // This is so because we're *descending* the dom tree :)

            var prevNonBlankText = this.getPreviousSiblingNonBlankText(lenode);
            if (prevNonBlankText) {
                var isPrevNonBlankTextBlock = this.isBlock(prevNonBlankText);
                if (this.isInline(lenode)) {
                    // current node is inline, previous was block : adding an extra new line
                    if (isPrevNonBlankTextBlock) {
                        markdown = '\n' + markdown;
                    }
                } else if (lenode.name !== 'br' && !this.isList(lenode) && this.isBlock(lenode)) {
                    // current node is block, previous was inline or text : adding an extra new line
                    if (!isPrevNonBlankTextBlock) {
                        markdown = '\n' + markdown;
                    }
                }
            }

            resolve(markdown);
        }

        // handlers

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
            node.prev && this.isBlock(node.prev) ||

            // if current node is block, this node is not displayed on the same line either, so left-trim
            node.parent && this.isBlock(node.parent) && this.isFirstChild(node)) {
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
            for (var attrnamekey in attrs) {
                htmlattribs += " " + attrs[attrnamekey] + '="' + node.attribs[attrs[attrnamekey]] + '"';
            }

            return '<' + node.name + htmlattribs + '>' + markdown.replace(/\s+/gm, ' ') + '</' + node.name + '>' + (this.isHtmlBlockLevelElement(node.name) ? '\n' : '');
            //return markdown;
        }

        // Block level elements

    }, {
        key: 'wrap_h1',
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
            return '\n' + markdown.trim().replace(/^/gm, this.tabindent).replace(/ /g, this.nbsp) + '\n';
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
        value: function wrap_ul(node, markdown) {
            return '\n' + markdown.trim() + '\n';
        }
    }, {
        key: 'wrap_ol',
        value: function wrap_ol(node, markdown) {
            return this.wrap_ul(node, markdown);
        }
    }, {
        key: 'wrap_li',
        value: function wrap_li(node, markdown) {

            var bullet = '* ';

            if (node.parent && node.parent.type === 'tag' && node.parent.name === 'ol') {
                var k = 1;
                var n = node;
                while (n.prev) {
                    if (n.prev.type === 'tag' && n.prev.name === 'li') {
                        k++;
                    }
                    n = n.prev;
                }

                bullet = k + '. ';
            }

            var firstChildNonBlankText = this.getFirstChildNonBlankText(node);
            if (firstChildNonBlankText) {
                if (this.isList(firstChildNonBlankText)) {
                    bullet = this.tabindent;
                } else if (this.isBlock(firstChildNonBlankText)) {
                    // p in li: add newline before
                    bullet = '\n' + bullet;
                } else {
                    var prevsibling = this.getPreviousSiblingNonBlankText(node);
                    if (prevsibling && prevsibling.type === 'tag' && prevsibling.name === 'li' && this.isBlock(this.getFirstChildNonBlankText(prevsibling))) {
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
        value: function wrap_br() /*node, markdown*/{
            return '  \n';
        }
    }, {
        key: 'wrap_hr',
        value: function wrap_hr() /*node, markdown*/{
            return '\n* * *\n';
        }

        // Inline elements

    }, {
        key: 'wrap_strong',
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

            var url = this.getAttrOrFalse('href', node);
            var title = this.getAttrOrFalse('title', node);

            if (!url) {
                return markdown;
            } else if (url && url === markdown && (!title || title === '')) {
                return '<' + url + '>';
            } else if ((url === markdown || url.replace(/^mailto:/, '') === markdown) && (!title || title === '')) {
                return '<' + url.replace(/^mailto:/, '') + '>';
            }

            return '[' + markdown + '](' + (url ? url : '') + (title ? ' "' + title + '"' : '') + ')';
        }
    }, {
        key: 'wrap_img',
        value: function wrap_img(node /*, markdown*/) {
            var alt = this.getAttrOrFalse('alt', node);
            var src = this.getAttrOrFalse('src', node);
            var title = this.getAttrOrFalse('title', node);
            return '![' + (alt ? alt : '') + '](' + (src ? src : '') + (title ? ' "' + title + '"' : '') + ')';
        }

        // helpers

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
        key: 'getPreviousSiblingNonBlankText',
        value: function getPreviousSiblingNonBlankText(node) {

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
        key: 'getFirstChildNonText',
        value: function getFirstChildNonText(node) {
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
        key: 'getFirstChildNonBlankText',
        value: function getFirstChildNonBlankText(node) {
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
            return node.parent && this.getFirstChildNonText(node.parent) === node;
        }
    }, {
        key: 'isLastChild',
        value: function isLastChild(node) {
            return !node.next;
        }
    }, {
        key: 'getAttrOrFalse',
        value: function getAttrOrFalse(attr, node) {
            if (attr in node.attribs) {
                return node.attribs[attr];
            }

            return false;
        }
    }]);

    return upndown;
}();

