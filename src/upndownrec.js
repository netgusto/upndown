'use strict';

import htmlparser from 'htmlparser2';

export default class upndown {

    init() {
        this.olstack = [];
        this.inlineelements = ['strong', 'b', 'i', 'em', 'u', 'a', 'img', 'code'];
        this.htmlblocklevelelement = ['div', 'iframe', 'script'];
        this.tabindent = '    ';
    }

    parse(html, cbk) {
        var handler = new htmlparser.DomHandler(function(err, dom) {
            if(err) { return cbk(err, null); }
            return cbk(null, dom);
        }, { withDomLvl1: false, withStartIndices: false });

        var p = new htmlparser.Parser(handler, { decodeEntities: true });
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

        try {
            var markdown = this.walk(dom, { keepHtml }).trim().replace(/•/g, ' ');
        } catch(err) {
            return cbk(err, null);
        }

        return cbk(null, markdown);
    }

    walk(nodes, options) {

        var buffer = [];

        for(let node of nodes) {

            var markdown;

            if(this.isText(node)) {
                markdown = this.text(node);
            } else {
                var innerMarkdown = this.walk(node.children, options);
                var method = 'wrap_' + node.name;

                if(method in this) {
                    markdown = this[method](node, innerMarkdown);
                } else {
                    markdown = this.wrap_generic(node, innerMarkdown);
                }

                // Margins between block elements are collapsed into a single line
                // pre-margins between an inline element and it's next sibling block are handled here also
                // Block-level elements handle themselves their post-margin
                // This is so because we're *descending* the dom tree :)

                var prevNonBlankText = this.previoussiblingnonblanktext(node);
                if(prevNonBlankText) {
                    var isPrevNonBlankTextBlock = this.isBlock(prevNonBlankText);
                    if(this.isInline(node)) {
                        // current node is inline, previous was block : adding an extra new line
                        if(isPrevNonBlankTextBlock) { markdown = '\n' + markdown; }
                    } else if(node.name !== 'br' && !this.isList(node) && this.isBlock(node)) {
                        // current node is block, previous was inline or text : adding an extra new line
                        if(!isPrevNonBlankTextBlock) { markdown = '\n' + markdown; }
                    }
                }
            }

            buffer.push(markdown);
        }

        return buffer.join('');
    }

    // handlers

    isBlankText(text) {
        return text.trim() === '';
    }

    text(node) {
        var text = node.data;

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

        if(node.next && !this.isInline(node.next)) {
            if(this.isInline(node.prev)) {
                text = text.replace(/^\n+$/, ' ');    // trimming newlines (would be converted to untrimmed spaces otherwise)
            } else {
                text = text.replace(/^\n+$/, '');
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

        var htmlattribs = '';
        var attrs = Object.keys(node.attribs);
        for(var attrname of attrs) {
            htmlattribs += " " + attrname + '="' + node.attribs[attrname] + '"';
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
    wrap_pre(node, markdown) { return '\n' + markdown.trim().replace(/^/gm, this.tabindent).replace(/ /g, '•') + '\n'; }

    wrap_code(node, markdown) {
        if(this.hasAncestorOfType(node, ['pre'])) {
            return markdown;
        }

        return '`' + markdown.trim() + '`';
    }

    //wrap_ul(node, markdown) { return markdown.trim().replace(/^/gm, '* ') + '\n\n'; }
    wrap_ul(node, markdown) { return '\n' + markdown.trim() + '\n'; }
    wrap_ol(node, markdown) { this.olstack.pop(); return '\n' + markdown.trim() + '\n'; }
    wrap_li(node, markdown) {

        var bullet = '* ';

        if(node.parent && node.parent.type === 'tag' && node.parent.name === 'ol') {
            if(this.isFirstChildNonText(node)) { this.olstack.push(0); }
            this.olstack[this.olstack.length - 1]++;
            bullet = this.olstack[this.olstack.length - 1] + '. ';
        }

        var firstChildNonText = this.firstChildNonText(node);
        if(firstChildNonText) {
            if(this.isList(firstChildNonText)) {
                //bullet = bullet;
            } else if(this.isBlock(firstChildNonText)) {
                // p in li: add newline before
                bullet = '\n' + bullet;
            }
        }

        return bullet + markdown.replace(/^/gm, this.tabindent).trim() + '\n';
    }

    wrap_p(node, markdown) { return '\n' + markdown + '\n'; }

    wrap_br(node, markdown) { return '  \n'; }

    wrap_hr(node, markdown) { return '\n* * *\n'; }

    // Inline elements

    wrap_strong(node, markdown) { return '**' + markdown + '**'; }
    wrap_b(node, markdown) { return this.wrap_strong(node, markdown); }

    wrap_em(node, markdown) { return '*' + markdown + '*'; }
    wrap_i(node, markdown) { return this.wrap_em(node, markdown); }

    wrap_a(node, markdown) {

        var url = this.attrOrFalse('href', node);
        var title = this.attrOrFalse('title', node);

        if (url && url === markdown && (!title || title === '')) {
            return '<' + url + '>';
        } else if ((url === markdown || url.replace(/^mailto:/, '') === markdown) && (!title || title === '')) {
            return '<' + url.replace(/^mailto:/, '') + '>';
        }

        return '[' + markdown + '](' + (url ? url : '') + (title ? ' "' + title + '"' : '') + ')';
    }

    wrap_img(node, markdown) {
        var alt = this.attrOrFalse('alt', node);
        var src = this.attrOrFalse('src', node);
        var title = this.attrOrFalse('title', node);
        return '![' + (alt ? alt : '') + '](' + (src ? src : '') + (title ? ' "' + title + '"' : '') + ')';
    }

    // helpers

    hasParentOfType(node, tagname) {
        return node.parent && node.parent.name === tagname;
    }

    hasAncestorOfType(node, tagnames) {

        let parent = node.parent;
        while (parent) {
            if (tagnames.indexOf(parent.name) > -1) { return true; }
            parent = parent.parent;
        }

        return false;
    }

    escapeTextForMarkdown(node, text) {

        var escapeChar;
        if (this.hasAncestorOfType(node, ['code', 'pre'])) {
            return text;
        }

        escapeChar = '\\';
        return text.replace(/\\/g, escapeChar + escapeChar).replace(/`/g, escapeChar + '`').replace(/\#/g, escapeChar + '#');
    }

    isInline(node) {
        return node.type === 'tag' && this.inlineelements.indexOf(node.name) >= 0;
    }

    isBlock(node) {
        return (node && node.type === 'tag' || node.type === 'script') && !this.isInline(node);
    }

    isText(node) {
        return node.type === 'text';
    }

    isList(node) {
        return node.type === 'tag' && (node.name === 'ul' || node.name === 'ol');
    }

    isHtmlBlockLevelElement(tag) {
        return this.htmlblocklevelelement.indexOf(tag) >= 0;
    }

    isPreviousSiblingInline(node) {
        return node && node.prev && node.prev.name && this.isInline(node.prev);
    }

    isPreviousSiblingBlock(node) {
        return node && node.prev && node.prev.name && !this.isInline(node.prev);
    }

    isPreviousSiblingNonTextInline(node) {
        var previous;

        if (node) {
            previous = this.previoussiblingnontext(node);
        }

        return node && previous && this.isInline(previous);
    }

    isPreviousSiblingNonTextBlock(node) {
        var previous;
        if (node) {
            previous = this.previoussiblingnontext(node);
        }

        return node && previous && !this.isInline(previous);
    }

    previoussiblingnontext(node) {

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

    previoussiblingnonblanktext(node) {

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

    isNextSiblingInline(node) {
        return node && node.next && node.next.name && this.isInline(node.next);
    }

    isNextSiblingBlock(node) {
        return node && node.next && node.next.name && !this.isInline(node.next);
    }

    isNextSiblingNonTextInline(node) {
        var next;

        if (node) { next = this.nextsiblingnontext(node); }

        return node && next && this.isInline(next);
    }

    isNextSiblingNonTextBlock(node) {
        var next;
        if (node) { next = this.previoussiblingnontext(node); }
        return node && next && !this.isInline(next);
    }

    nextsiblingnontext(node) {

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

    hasPreviousSiblingNonTextOfType(node, tagname) {
        var previoussiblingnontext = this.previoussiblingnontext(node);
        return previoussiblingnontext && previoussiblingnontext.name === tagname;
    }

    hasNextSiblingNonTextOfType(node, tagname) {
        var nextsiblingnontext = this.nextsiblingnontext(node);
        return nextsiblingnontext && nextsiblingnontext.name === tagname;
    }

    firstChild(node) {
        if(!node) { return null; }
        if(!node.children.length) { return null; }
        return node.children[0];
    }

    lastChild(node) {
        if(!node) { return null; }
        if(!node.children.length) { return null; }
        return node.children[(node.children.length - 1)];
    }

    firstChildNonText(node) {
        var i = 0;

        while (i < node.children.length) {
            if (node.children[i] && node.children[i].type !== 'text') {
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
        return node.parent && (this.firstChildNonText(node.parent) === node);
    }

    hasFirstChildNonTextOfType(node, childtype) {

        var firstChild = this.firstChild(node);

        if (!node || !firstChild) { return null; }

        if (firstChild.type !== 'text') {
            return firstChild.name === childtype;
        }

        return this.hasNextSiblingNonTextOfType(firstChild, childtype);
    }

    isFirstChildNonTextOfParentType(node, parenttype) {
        return this.hasParentOfType(node, parenttype) && this.firstChildNonText(node.parent) === node;
    }

    isLastChild(node) {
        return !(node.next);
    }

    isLastChildNonText(node) {
        return this.isLastChild(node) || this.lastChildNonText(node.parent) === node;
    }

    isLastChildNonTextUntilDepth0(node) {
        if (!node) {
            return false;
        }

        if ((node.parent && this.isFirstNodeNonText(node.parent)) || this.isFirstNodeNonText(node)) {
            return true;
        }

        if (!this.isLastChildNonText(node)) {
            return false;
        }

        return this.isLastChildNonTextUntilDepth0(node.parent);
    }

    isFirstNode(node) {
        return !!node && this.isFirstChild(node) && this.isWrappingRootNode(node.parent);
    }

    isFirstNodeNonText(node) {
        return !!node && this.isFirstChildNonText(node) && this.isWrappingRootNode(node.parent);
    }

    isWrappingRootNode(node) {
        return node && node.type !== 'text' && node.name === 'div' && this.attrOrFalse('id', node) === 'hello';
    }

    hasLastChildOfType(node, lastchildtype) {
        var lastChild = this.lastChild(node);
        return node && lastChild && lastChild.name === lastchildtype;
    }

    hasLastChildNonTextOfType(node, lastchildtype) {

        var lastChild = this.lastChild(node);

        if (!node || !lastChild) { return null; }

        if (lastChild.type !== 'text') {
            return lastChild.name === lastchildtype;
        }

        return this.hasPreviousSiblingNonTextOfType(lastChild, lastchildtype);
    }

    lastChildNonText(node) {

        var lastChild = this.lastChild(node);

        if (!node || !lastChild) { return null; }

        if (lastChild.type !== 'text') { return lastChild; }

        return this.previoussiblingnontext(lastChild);
    }

    attrOrFalse(attr, node) {
        if(attr in node.attribs) {
            return node.attribs[attr];
        }

        return false;
    }
}
