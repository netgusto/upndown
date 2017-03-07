'use strict';

import htmlparser from 'htmlparser2';

module.exports = class upndown {

    constructor({ decodeEntities = true } = {}) {
        this.decodeEntities = decodeEntities;
    }

    init() {
        this.olstack = [];
        this.inlineelements = ['strong', 'b', 'i', 'em', 'u', 'a', 'img', 'code'];
        this.htmlblocklevelelement = ['div', 'iframe', 'script'];
        this.tabindent = '    ';
        this.nbsp = '\u0000';
    }

    parse(html, cbk) {
        let handler = new htmlparser.DomHandler(function(err, dom) {
            if(err) { return cbk(err, null); }
            return cbk(null, dom);
        }, { withDomLvl1: false, withStartIndices: false });

        let p = new htmlparser.Parser(handler, { decodeEntities: this.decodeEntities });
        p.write(html);
        p.end();
    }

    convert(html, cbk, options) {
        this.parse(html, function(err, dom) {
            if(err) { return cbk(err, null); }
            return this.convertDom(dom, function(err2, markdown) {
                if(err2) { return cbk(err2, null); }
                return cbk(null, markdown);
            }, options);
        }.bind(this));
    }

    convertDom(dom, cbk, { keepHtml = false } = {}) {
        this.init();

        this.walkNodes(dom, { keepHtml })
            .then(function(markdown) {
                if(!markdown) { markdown = ''; }
                let regx = new RegExp(this.nbsp, 'g');
                cbk(null, markdown.trim().replace(regx, ' '));
            }.bind(this))
            .catch(function(err) {
                cbk(err, null);
            });
    }

    walkNodes(nodes, options) {

        let self = this;

        return new Promise(function(topres, toprej) {
            let promises = [];
            for(let nodekey in nodes) {
                promises.push(new Promise(function(resolve, reject) { self.walkNode(resolve, reject, options, nodes[nodekey]); }));
            }

            Promise.all(promises)
                .then(function(results) { topres(results.join('')); })
                .catch(function(err) { toprej(err); });
        }).catch(function(err) { throw err; });
    }

    walkNode(resolve, reject, options, lenode) {
        if(this.isText(lenode)) {
            resolve(this.text(lenode));
        } else {
            this.walkNodes(lenode.children, options)
                .then(function(innerMarkdown) { this.wrapNode(resolve, reject, options, lenode, innerMarkdown); }.bind(this))
                .catch(function(err) { reject(err); });
        }
    }

    wrapNode(resolve, reject, options, lenode, innerMarkdown) {

        let markdown = '';
        let method = 'wrap_' + lenode.name;

        if(method in this) {
            markdown = this[method](lenode, innerMarkdown);
        } else {
            if(options.keepHtml) {
                markdown = this.wrap_generic(lenode, innerMarkdown);
            } else {
                markdown = innerMarkdown;
            }
        }

        // Collapsing margins between block elements into a single line.
        // Pre-margins between an inline element and it's next sibling block are handled here also
        // Block-level elements handle themselves their post-margin
        // This is so because we're *descending* the dom tree :)

        let prevNonBlankText = this.getPreviousSiblingNonBlankText(lenode);
        if(prevNonBlankText) {
            let isPrevNonBlankTextBlock = this.isBlock(prevNonBlankText);
            if(this.isInline(lenode)) {
                // current node is inline, previous was block : adding an extra new line
                if(isPrevNonBlankTextBlock) { markdown = '\n' + markdown; }
            } else if(lenode.name !== 'br' && !this.isList(lenode) && this.isBlock(lenode)) {
                // current node is block, previous was inline or text : adding an extra new line
                if(!isPrevNonBlankTextBlock) { markdown = '\n' + markdown; }
            }
        }

        resolve(markdown);
    }

    // handlers

    text(node) {
        let text = node.data;

        if(!text) { return ''; }

        if(this.hasAncestorOfType(node, ['code', 'pre'])) { return text; }

        // normalize whitespace

        if(node.prev) {
            if(this.isInline(node.prev)) {
                text = text.replace(/^\n+/, ' ');    // trimming newlines (would be converted to untrimmed spaces otherwise)
            } else {
                text = text.replace(/^\n+/, '');
            }
        }

        if(node.next) {
            if(this.isInline(node.next)) {
                text = text.replace(/\n+$/, ' ');    // trimming newlines (would be converted to untrimmed spaces otherwise)
            } else {
                text = text.replace(/\n+$/, '');
            }
        }

        text = text
            .replace('\n', ' ')         // converting inner newlines to spaces
            .replace(/\s+/g, ' ');      // converting sequences of whitespace to single spaces

        if(
            // if prev node is block, this node is not displayed on the same line, so left-trim
            (node.prev && this.isBlock(node.prev)) ||

            // if current node is block, this node is not displayed on the same line either, so left-trim
            (node.parent && this.isBlock(node.parent) && this.isFirstChild(node))
        ) {
            text = text.replace(/^\s*/, '');
        }

        if(node.parent && this.isBlock(node.parent) && this.isLastChild(node)) {
            text = text.replace(/\s*$/, '');
        }

        return text;
    }

    wrap_generic(node, markdown) {

        let htmlattribs = '';
        let attrs = Object.keys(node.attribs);
        for(let attrnamekey in attrs) {
            htmlattribs += " " + attrs[attrnamekey] + '="' + node.attribs[attrs[attrnamekey]] + '"';
        }

        return '<' + node.name + htmlattribs + '>' + markdown.replace(/\s+/gm, ' ') + '</' + node.name + '>' + (this.isHtmlBlockLevelElement(node.name) ? '\n' : '');
        //return markdown;
    }

    // Block level elements

    wrap_h1(node, markdown) { return '\n# ' + markdown + '\n'; }
    wrap_h2(node, markdown) { return '\n## ' + markdown + '\n'; }
    wrap_h3(node, markdown) { return '\n### ' + markdown + '\n'; }
    wrap_h4(node, markdown) { return '\n#### ' + markdown + '\n'; }
    wrap_h5(node, markdown) { return '\n##### ' + markdown + '\n'; }
    wrap_h6(node, markdown) { return '\n###### ' + markdown + '\n'; }

    wrap_blockquote(node, markdown) { return '\n' + markdown.trim().replace(/^/gm, '> ') + '\n'; }
    wrap_pre(node, markdown) { return '\n' + markdown.trim().replace(/^/gm, this.tabindent).replace(/ /g, this.nbsp) + '\n'; }

    wrap_code(node, markdown) {
        if(this.hasAncestorOfType(node, ['pre'])) {
            return markdown;
        }

        return '`' + markdown.trim() + '`';
    }

    wrap_ul(node, markdown) { return '\n' + markdown.trim() + '\n'; }
    wrap_ol(node, markdown) { return this.wrap_ul(node, markdown); }
    wrap_li(node, markdown) {

        let bullet = '* ';

        if(node.parent && node.parent.type === 'tag' && node.parent.name === 'ol') {
            let k = 1;
            let n = node;
            while(n.prev) {
                if(n.prev.type === 'tag' && n.prev.name === 'li') { k++; }
                n = n.prev;
            }

            bullet = k + '. ';
        }

        let firstChildNonBlankText = this.getFirstChildNonBlankText(node);
        if(firstChildNonBlankText) {
            if(this.isList(firstChildNonBlankText)) {
                bullet = this.tabindent;
            } else if(this.isBlock(firstChildNonBlankText)) {
                // p in li: add newline before
                bullet = '\n' + bullet;
            } else {
                let prevsibling = this.getPreviousSiblingNonBlankText(node);
                if(
                    prevsibling && prevsibling.type === 'tag' && prevsibling.name === 'li' &&
                    this.isBlock(this.getFirstChildNonBlankText(prevsibling))
                ) {
                    bullet = '\n' + bullet;
                }
            }
        }

        return bullet + markdown.replace(/^/gm, this.tabindent).trim() + '\n';
    }

    wrap_p(node, markdown) { return '\n' + markdown + '\n'; }

    wrap_br(/*node, markdown*/) { return '  \n'; }

    wrap_hr(/*node, markdown*/) { return '\n* * *\n'; }

    // Inline elements

    wrap_strong(node, markdown) { return '**' + markdown + '**'; }
    wrap_b(node, markdown) { return this.wrap_strong(node, markdown); }

    wrap_em(node, markdown) { return '*' + markdown + '*'; }
    wrap_i(node, markdown) { return this.wrap_em(node, markdown); }

    wrap_a(node, markdown) {

        let url = this.getAttrOrFalse('href', node);
        let title = this.getAttrOrFalse('title', node);

        if (!url) {
            return markdown;
        } else if (url && url === markdown && (!title || title === '')) {
            return '<' + url + '>';
        } else if ((url === markdown || url.replace(/^mailto:/, '') === markdown) && (!title || title === '')) {
            return '<' + url.replace(/^mailto:/, '') + '>';
        }

        return '[' + markdown + '](' + (url ? url : '') + (title ? ' "' + title + '"' : '') + ')';
    }

    wrap_img(node/*, markdown*/) {
        let alt = this.getAttrOrFalse('alt', node);
        let src = this.getAttrOrFalse('src', node);
        let title = this.getAttrOrFalse('title', node);
        return '![' + (alt ? alt : '') + '](' + (src ? src : '') + (title ? ' "' + title + '"' : '') + ')';
    }

    // helpers

    hasAncestorOfType(node, tagnames) {

        let parent = node.parent;
        while (parent) {
            if (tagnames.indexOf(parent.name) > -1) { return true; }
            parent = parent.parent;
        }

        return false;
    }

    isInline(node) {
        return node && node.type === 'tag' && this.inlineelements.indexOf(node.name) >= 0;
    }

    isBlock(node) {
        return node && (node.type === 'tag' || node.type === 'script') && !this.isInline(node);
    }

    isText(node) {
        return node && node.type === 'text';
    }

    isList(node) {
        return node && node.type === 'tag' && (node.name === 'ul' || node.name === 'ol');
    }

    isHtmlBlockLevelElement(tag) {
        return this.htmlblocklevelelement.indexOf(tag) >= 0;
    }

    getPreviousSiblingNonBlankText(node) {

        let prevsibling = node;
        let go = true;

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

    getFirstChildNonText(node) {
        let i = 0;

        while (i < node.children.length) {
            if (node.children[i] && node.children[i].type !== 'text') {
                return node.children[i];
            }
            i++;
        }

        return null;
    }

    getFirstChildNonBlankText(node) {
        let i = 0;

        while (i < node.children.length) {
            if (node.children[i] && node.children[i].type !== 'text' || node.children[i].data.trim() !== '') {
                return node.children[i];
            }
            i++;
        }

        return null;
    }


    isFirstChild(node) {
        return !(!!node && !!node.prev);
    }

    isFirstChildNonText(node) {
        return node.parent && (this.getFirstChildNonText(node.parent) === node);
    }

    isLastChild(node) {
        return !(node.next);
    }

    getAttrOrFalse(attr, node) {
        if(attr in node.attribs) {
            return node.attribs[attr];
        }

        return false;
    }
}
