'use strict';

import htmlparser from 'htmlparser2';

export default class upndown {

    init() {
        this.depth = 0;
        this.buffer = {0: []};
        this.prefixstack = {0: ''};
        this.currentollistack = [];

        this.inlineelements = ['strong', 'b', 'i', 'em', 'u', 'a', 'img', 'code'];
        this.nonmarkdownblocklevelelement = ['div', 'iframe', 'script'];
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
            var markdown = this.walk(dom, { keepHtml });
        } catch(err) {
            return cbk(err, null);
        }

        return cbk(null, markdown);
    }

    walk(nodes, options) {

        for(let node of nodes) {
            if(node.type === 'tag' || node.type === 'script') {
                let openmethod = 'open_' + node.name;
                if(openmethod in this) { this[openmethod](node); }
                else { if(options.keepHtml) { this.open_html(node); } }

                this.walk(node.children, options);

                let closemethod = 'close_' + node.name;
                if(closemethod in this) { this[closemethod](node); }
                else { if(options.keepHtml) { this.close_html(node); } }
            } else {
                this.text(node);
            }
        }

        return this.buffer[0].join('').replace(/\s*$/, '').replace(/^[ \t]+$/gm, '').replace(/\n{3,}/gm, '\n\n\n').replace(/[\n| ]+$/, '').replace(/^\n+/, '');
    }

    // handlers

    text(node) {
        var text = this.unescape(node.data);
        if (text) {
            if (!(this.hasParentOfType(node, 'code') && this.isFirstChild(node)) && (!this.isPreviousSiblingInline(node) || (this.isFirstChild(node) && this.hasParentOfType(node, 'li')))) {
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

    open_html(node) {

        var htmltag, tag;

        if (this.isWrappingRootNode(node)) {
            return;
        }

        tag = node.name;

        htmltag = '<' + tag;

        if (this.isNonMarkdownBlockLevelElement(tag) && !this.isFirstChildNonText(node)) {
            htmltag = '\n' + htmltag;
            if(this.isPreviousSiblingBlock()) { htmltag = '\n' + htmltag; }
        }

        var attrs = Object.keys(node.attribs);
        for(var attrname of attrs) {
            htmltag += " " + attrname + '="' + node.attribs[attrname] + '"';
        }

        htmltag += '>';
        this.buffer[this.depth].push(htmltag);
        this.prefixstack_push('');
        this.depth++;

        this.buffer[this.depth] = [];
    }

    open_generic(node, prefix = '') {
        this.prefixstack_push(prefix);
        this.depth++;
        this.buffer[this.depth] = [];
    }

    open_blockquote(node) { this.open_generic(node, '> '); }

    open_pre(node) { this.open_generic(node, this.tabindent); }

    open_ol(node) {
        this.currentollistack.push(1);
        this.open_generic(node);
    }

    open_li(node) { this.open_generic(node, this.tabindent); }

    open_h1(node) { this.open_generic(node); }
    open_h2(node) { this.open_generic(node); }
    open_h3(node) { this.open_generic(node); }
    open_h4(node) { this.open_generic(node); }
    open_h5(node) { this.open_generic(node); }
    open_h6(node) { this.open_generic(node); }

    open_strong(node) { this.open_generic(node); }
    open_b(node) { this.open_generic(node); }
    open_em(node) { this.open_generic(node); }
    open_i(node) { this.open_generic(node); }
    open_a(node) { this.open_generic(node); }
    open_img(node) { this.open_generic(node); }
    open_br(node) { this.open_generic(node); }

    open_p(node) { this.open_generic(node); }
    open_br(node) { this.open_generic(node); }
    open_code(node) { this.open_generic(node); }
    open_hr(node) { this.open_generic(node); }
    open_ul(node) { this.open_generic(node); }

    close_html(node) {
        var depth, html, prefix;
        if (this.isWrappingRootNode(node)) { return; }
        depth = this.depth;
        this.depth--;
        prefix = this.prefixstack_pop();
        html = prefix + this.buffer[depth].join('');

        this.buffer[depth - 1].push(html + '</' + node.name + '>');
    }

    close_hx(node) {
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

    close_h1(node) { this.close_hx(node); }
    close_h2(node) { this.close_hx(node); }
    close_h3(node) { this.close_hx(node); }
    close_h4(node) { this.close_hx(node); }
    close_h5(node) { this.close_hx(node); }
    close_h6(node) { this.close_hx(node); }

    close_p(node) {
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

    close_hr(node) {
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

    close_blockquote(node) {
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

    close_pre(node) {
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
        if ((prevsibling && (prevsibling.name === 'ul' || prevsibling.name === 'li')) || (this.hasParentOfType(node, 'li'))) {
            superextrapadding = '\n';
        } else {
            superextrapadding = '';
        }
        this.buffer[depth - 1].push(superextrapadding + beforenl + html);
    }

    close_code(node) {
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

    close_ul(node) {
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

    close_ol(node) {
        this.currentollistack.pop();
        this.close_ul(node);
    }

    close_li(node) {
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

    close_strong(/*node*/) {
        var depth, html, prefix;
        depth = this.depth;
        this.depth--;
        prefix = this.prefixstack_pop();
        html = prefix + '**' + this.buffer[depth].join('').split('\n').join('\n' + prefix);
        return this.buffer[depth - 1].push(html + '**');
    }

    close_b(node) { this.close_strong(node); }

    close_em(/*node*/) {
        var depth, html, prefix;
        depth = this.depth;
        this.depth--;
        prefix = this.prefixstack_pop();
        html = prefix + '*' + this.buffer[depth].join('').split('\n').join('\n' + prefix) + '*';
        return this.buffer[depth - 1].push(html);
    }

    close_i(node) { this.close_em(node); }

    close_a(node) {
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

    close_img(node) {
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

    close_br(/*node*/) {
        var depth, html, prefix;
        depth = this.depth;
        this.depth--;
        prefix = this.prefixstack_pop();
        html = prefix + this.buffer[depth].join('').split('\n').join('\n' + prefix);
        return this.buffer[depth - 1].push(html + '  \n');
    }

    // helpers

    getPrefix() {
        if(this.depth in this.prefixstack) { return this.prefixstack[this.depth]; }
        return '';
    }

    prefixstack_push(prefix) {
        this.prefixstack[this.depth] = prefix;
    }

    prefixstack_pop(/*prefix*/) {
        var before;
        before = this.prefixstack[this.depth];
        this.prefixstack[this.depth] = '';
        return before;
    }

    hasParentOfType(node, tagname) {
        return node.parent && node.parent.name === tagname;
    }

    hasAncestorOfType(node, tagname) {

        let parent = node.parent;
        while (parent) {
            if (parent.name === tagname) { return true; }
            parent = parent.parent;
        }

        return false;
    }

    escapeTextForMarkdown(node, text) {

        var escapeChar;
        if (this.hasAncestorOfType(node, 'code') || this.hasAncestorOfType(node, 'pre')) {
            return text;
        }

        escapeChar = '\\';
        return text.replace(/\\/g, escapeChar + escapeChar).replace(/`/g, escapeChar + '`').replace(/\#/g, escapeChar + '#');
    }

    isInline(tag) {
        return this.inlineelements.indexOf(tag) >= 0;
    }

    isNonMarkdownBlockLevelElement(tag) {
        return this.nonmarkdownblocklevelelement.indexOf(tag) >= 0;
    }

    isPreviousSiblingInline(node) {
        return node && node.prev && node.prev.name && this.isInline(node.prev.name);
    }

    isPreviousSiblingBlock(node) {
        return node && node.prev && node.prev.name && !this.isInline(node.prev.name);
    }

    isPreviousSiblingNonTextInline(node) {
        var previous;

        if (node) {
            previous = this.previoussiblingnontext(node);
        }

        return node && previous && this.isInline(previous.name);
    }

    isPreviousSiblingNonTextBlock(node) {
        var previous;
        if (node) {
            previous = this.previoussiblingnontext(node);
        }

        return node && previous && !this.isInline(previous.name);
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

    isNextSiblingInline(node) {
        return node && node.next && node.next.name && this.isInline(node.next.name);
    }

    isNextSiblingBlock(node) {
        return node && node.next && node.next.name && !this.isInline(node.next.name);
    }

    isNextSiblingNonTextInline(node) {
        var next;

        if (node) { next = this.nextsiblingnontext(node); }

        return node && next && this.isInline(next.name);
    }

    isNextSiblingNonTextBlock(node) {
        var next;
        if (node) { next = this.previoussiblingnontext(node); }
        return node && next && !this.isInline(next.name);
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
            if (node.children[i].type !== 'text') {
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

    unescape(html) { return '' + html; }

    attrOrFalse(attr, node) {
        if(attr in node.attribs) {
            return node.attribs[attr];
        }

        return false;
    }
}
