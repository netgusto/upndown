"use strict"

do (
    root = this,
    factory = (htmlparser, jsdom) ->

        #################################################
        class upndown

            @depth
            @buffer
            @prefixstack
            @currentollistack
            @inlineelements
            @tabindent
            @debug
            @textnodetype
            @documentnodetype
            @document

            setupParser: () =>
                @depth = 0
                @buffer = {0: []}
                @prefixstack = {0: ''}
                @currentollistack = []
                @inlineelements = ['_text', 'strong', 'b', 'i', 'em', 'u', 'a', 'img', 'code']   # code is considered inline, as it's converted as backticks in markdown
                @tabindent = '    '
                @debug = false
                @textnodetype = 3
                @documentnodetype = 9

                if jsdom
                    @document = new jsdom()    # injected if nodejs (jsdom object), null otherwise
                else
                    @document = null


            constructor: () ->
                @setupParser()

                @standardmethods = {
                    open: {
                        _default: (node, prefix) =>
                            @prefixstack_push(prefix)
                            @depth++
                            @buffer[@currentdepth()] = []
                    },
                    close: {
                        hx: (node) =>

                            depth = @currentdepth()
                            @depth--
                            prefix = @prefixstack_pop()

                            level = parseInt(node.tagName.toLowerCase().substr(1))
                            html = prefix + Array(level + 1).join('#') + ' ' + @buffer[depth].join('').split('\n').join('\n' + prefix)

                            nl = ''

                            if !@isFirstNodeNonText(node) && !@isFirstChildNonText(node)
                                nl = '\n'
                                nl += '\n'


                            @buffer[depth-1].push(nl + html)
                    }
                }

                @methods = {}
                @methods['_text'] = (node) =>

                    text = node.data
                    console.log('TAG:TEXT', "'" + text + "'") if @debug

                    text = @unescape(text)

                    if !(@hasParentOfType(node, 'code') && @isFirstChild(node)) && (!@isPreviousSiblingInline(node) || (@isFirstChild(node) && @hasParentOfType(node, 'li')))

                        if text.match(/^[\n\s\t]+$/)
                            return  # previous sibling is a block level element, and the text to be added is only whitespace, so we discard it

                        text = text.replace(/^[\s\t]*/, '') # left-trimming the text

                    if(!@hasParentOfType(node, 'pre') && !@hasParentOfType(node, 'code'))
                        text = text.replace(/\n/g, ' ')
                        text = text.replace(/[\s\t]+/g, ' ')

                    prefix = ''

                    @buffer[@currentdepth()].push(@escapeTextForMarkdown(node, text))
                    console.log('TEMPORARY', @buffer) if @debug

                    #if text.match(/\s\s$/) && !text.match(/^\s+$/)
                    #    @buffer[@currentdepth()].push('<br/>')

                @methods['open'] = {}
                @methods['open']['_html'] = (node) =>
                    if(@isWrappingRootNode(node))
                        return

                    tag = node.tagName.toLowerCase()
                    console.log('OPEN:HTML', tag) if @debug
                    console.dir(node) if @debug

                    htmltag = '<' + tag

                    i = 0
                    while i < node.attributes.length
                        htmltag += " " + node.attributes[i].name + '="' + node.attributes[i].nodeValue + '"'
                        i++

                    htmltag += '>'

                    @buffer[@currentdepth()].push(htmltag)

                    @prefixstack_push('')
                    @depth++

                    @buffer[@currentdepth()] = []


                @methods['open']['p'] = (node) =>
                    console.log('OPEN:P') if @debug
                    @standardmethods.open._default(node, '')

                @methods['open']['br'] = (node) =>
                    console.log('OPEN:BR') if @debug
                    @standardmethods.open._default(node, '')

                @methods['open']['blockquote'] = (node) =>
                    console.log('OPEN:BLOCKQUOTE') if @debug
                    @standardmethods.open._default(node, '> ')
                
                @methods['open']['pre'] = (node) =>
                    console.log('OPEN:PRE') if @debug
                    @standardmethods.open._default(node, @tabindent)

                @methods['open']['code'] = (node) =>
                    console.log('OPEN:CODE') if @debug
                    @standardmethods.open._default(node, '')

                @methods['open']['hr'] = (node) =>
                    console.log('OPEN:HR') if @debug
                    @standardmethods.open._default(node, '')

                @methods['open']['ul'] = (node) =>
                    console.log('OPEN:UL') if @debug
                    @standardmethods.open._default(node, '')

                @methods['open']['ol'] = (node) =>
                    console.log('OPEN:OL') if @debug
                    @currentollistack.push(1)
                    @standardmethods.open._default(node, '')
                
                @methods['open']['li'] = (node) =>
                    console.log('OPEN:LI') if @debug
                    @standardmethods.open._default(node, @tabindent)
                
                @methods['open']['h1'] = (node) =>
                    console.log('OPEN:H1') if @debug
                    @standardmethods.open._default(node, '')

                @methods['open']['h2'] = (node) =>
                    console.log('OPEN:H2') if @debug
                    @standardmethods.open._default(node, '')

                @methods['open']['h3'] = (node) =>
                    console.log('OPEN:H3') if @debug
                    @standardmethods.open._default(node, '')

                @methods['open']['h4'] = (node) =>
                    console.log('OPEN:H4') if @debug
                    @standardmethods.open._default(node, '')

                @methods['open']['h5'] = (node) =>
                    console.log('OPEN:H5') if @debug
                    @standardmethods.open._default(node, '')

                @methods['open']['h6'] = (node) =>
                    console.log('OPEN:H6') if @debug
                    @standardmethods.open._default(node, '')

                @methods['open']['strong'] = (node) =>
                    console.log('OPEN:STRONG') if @debug
                    @standardmethods.open._default(node, '')

                @methods['open']['b'] = (node) =>
                    console.log('OPEN:B') if @debug
                    @standardmethods.open._default(node, '')

                @methods['open']['em'] = (node) =>
                    console.log('OPEN:EM') if @debug
                    @standardmethods.open._default(node, '')

                @methods['open']['i'] = (node) =>
                    console.log('OPEN:i') if @debug
                    @standardmethods.open._default(node, '')

                @methods['open']['a'] = (node) =>
                    console.log('OPEN:A') if @debug
                    @standardmethods.open._default(node, '')

                @methods['open']['img'] = (node) =>
                    console.log('OPEN:IMG') if @debug
                    @standardmethods.open._default(node, '')

                @methods['open']['br'] = (node) =>
                    console.log('OPEN:BR') if @debug
                    @standardmethods.open._default(node, '')

                @methods['close'] = {}

                @methods['close']['_html'] = (node) =>
                    if(@isWrappingRootNode(node))
                        return
                    console.log('CLOSE:HTML', node.tagName.toLowerCase()) if @debug

                    depth = @currentdepth()
                    @depth--
                    prefix = @prefixstack_pop()

                    html = prefix + @buffer[depth].join('')

                    @buffer[depth-1].push(html + '</' + node.tagName.toLowerCase() + '>')

                @methods['close']['p'] = (node) =>
                    console.log('CLOSE:P') if @debug

                    depth = @currentdepth()
                    @depth--
                    prefix = @prefixstack_pop()

                    nl = ''
                    if !@isFirstNodeNonText(node) && !@isFirstChildNonTextOfParentType(node, 'blockquote') && !(@hasParentOfType(node, 'li') && @isFirstChildNonText(node)) 
                        nl += '\n'
                        nl += '\n'

                    html = prefix + @buffer[depth].join('').split('\n').join('\n' + prefix)

                    @buffer[depth-1].push(nl + html)

                @methods['close']['hr'] = (node) =>
                    console.log('CLOSE:HR') if @debug

                    depth = @currentdepth()
                    @depth--
                    prefix = @prefixstack_pop()

                    nl = ''
                    if !@isFirstNodeNonText(node)
                        nl = '\n\n'

                    html = prefix + nl + '* * *\n' + @buffer[depth].join('').split('\n').join('\n' + prefix)

                    @buffer[depth-1].push(html)

                @methods['close']['blockquote'] = (node) =>
                    console.log('CLOSE:BLOCKQUOTE') if @debug

                    depth = @currentdepth()
                    @depth--
                    prefix = @prefixstack_pop()

                    html = prefix + @buffer[depth].join('').split('\n').join('\n' + prefix)

                    nl = ''
                    if !@isFirstNodeNonText(node) && !@isFirstChildNonText(node)
                        nl += '\n'
                        nl += '\n'
                            

                    @buffer[depth-1].push(nl + html)

                @methods['close']['pre'] = (node) =>
                    console.log('CLOSE:PRE') if @debug

                    depth = @currentdepth()
                    @depth--
                    prefix = @prefixstack_pop()

                    html = prefix + @buffer[depth].join('').split('\n').join('\n' + prefix)


                    beforenl = ''
                    superextrapadding = ''

                    if !@isFirstNodeNonText(node)
                        beforenl = '\n\n'

                    prevsibling = @previoussiblingnontext(node)
                    
                    if (prevsibling and (prevsibling.tagName.toLowerCase() == 'ul' or prevsibling.tagName.toLowerCase() == 'li')) || (@hasParentOfType(node, 'li'))
                        # We add another \n because markdown tends to nest a pre next to (or in) an li in the li
                        superextrapadding = '\n'
                    else
                        superextrapadding = ''

                    @buffer[depth-1].push(superextrapadding + beforenl + html)

                @methods['close']['code'] = (node) =>
                    console.log('CLOSE:CODE') if @debug

                    depth = @currentdepth()
                    @depth--
                    prefix = @prefixstack_pop()

                    if !@hasAncestorOfType(node, 'pre')
                        begin = '`'
                        end = '`'
                    else
                        begin = ''
                        end = ''

                    html = prefix + unescape(begin + @buffer[depth].join('') + end).split('\n').join('\n' + prefix)

                    @buffer[depth-1].push(html)

                @methods['close']['ul'] = (node) =>
                    console.log('CLOSE:UL') if @debug

                    depth = @currentdepth()
                    @depth--
                    prefix = @prefixstack_pop()

                    nl = ''

                    if !@isFirstNodeNonText(node)
                        nl = '\n'

                        if (!@hasParentOfType(node, 'li') || @hasPreviousSiblingNonTextOfType(node, 'p')) && (!@hasParentOfType(node, 'blockquote') || !@isFirstChildNonText(node))
                            nl += '\n'

                    html = nl + prefix + @buffer[depth].join('').split('\n').join('\n' + prefix)

                    @buffer[depth-1].push(html)

                @methods['close']['ol'] = (node) =>
                    console.log('CLOSE:OL') if @debug
                    @currentollistack.pop()
                    @methods.close.ul(node)

                @methods['close']['li'] = (node) =>
                    console.log('CLOSE:LI') if @debug

                    depth = @currentdepth()
                    @depth--
                    prefix = @prefixstack_pop()

                    if @hasParentOfType(node, 'ol')
                        currentolli = @currentollistack[@currentollistack.length-1]
                        puce = currentolli + '.'
                        puce += Array((4 - puce.length) + 1).join(' ')
                        @currentollistack[@currentollistack.length-1]++
                    else
                        puce = '*   '

                    if !(@isFirstNodeNonText(node.parentNode) && @isFirstChildNonText(node)) && @hasPreviousSiblingNonTextOfType(node, 'li')
                        nl = '\n'
                    else
                        nl = ''

                    if !@isFirstChildNonText(node) && @hasFirstChildNonTextOfType(node, 'p')
                        nl += '\n'

                    html = nl + puce + @buffer[depth].join('').split('\n').join('\n' + prefix)

                    @buffer[depth-1].push(html)

                @methods['close']['h1'] = (node) =>
                    console.log('CLOSE:H1') if @debug
                    @standardmethods.close.hx(node)

                @methods['close']['h2'] = (node) =>
                    console.log('CLOSE:H2') if @debug
                    @standardmethods.close.hx(node)

                @methods['close']['h3'] = (node) =>
                    console.log('CLOSE:H3') if @debug
                    @standardmethods.close.hx(node)

                @methods['close']['h4'] = (node) =>
                    console.log('CLOSE:H4') if @debug
                    @standardmethods.close.hx(node)

                @methods['close']['h5'] = (node) =>
                    console.log('CLOSE:H5') if @debug
                    @standardmethods.close.hx(node)

                @methods['close']['h6'] = (node) =>
                    console.log('CLOSE:H6') if @debug
                    @standardmethods.close.hx(node)

                @methods['close']['strong'] = (node) =>
                    console.log('CLOSE:STRONG') if @debug

                    depth = @currentdepth()
                    @depth--
                    prefix = @prefixstack_pop()

                    html = prefix + '**' + @buffer[depth].join('').split('\n').join('\n' + prefix)

                    @buffer[depth-1].push(html + '**')

                @methods['close']['b'] = (node) =>
                    console.log('CLOSE:B') if @debug
                    @methods.close.strong(node)

                @methods['close']['em'] = (node) =>
                    console.log('CLOSE:EM') if @debug

                    depth = @currentdepth()
                    @depth--
                    prefix = @prefixstack_pop()

                    html = prefix + '*' + @buffer[depth].join('').split('\n').join('\n' + prefix) + '*'

                    @buffer[depth-1].push(html)

                @methods['close']['i'] = (node) =>
                    console.log('CLOSE:I') if @debug
                    @methods.close.em(node)

                @methods['close']['a'] = (node) =>
                    console.log('CLOSE:A') if @debug

                    depth = @currentdepth()
                    @depth--
                    prefix = @prefixstack_pop()

                    url = this.attrOrFalse('href', node)
                    title = this.attrOrFalse('title', node)
                    label = @buffer[depth].join('')

                    unescapedurl = @unescape(url)
                    if url && url == label && (!title || title == '')
                        # la forme 'autolink'
                        @buffer[depth-1].push('<' + url + '>')
                    else if (unescapedurl == label || unescapedurl.replace(/^mailto:/, '') == label) && (!title || title == '')
                        @buffer[depth-1].push('<' + unescapedurl.replace(/^mailto:/, '') + '>')
                    else
                        # la forme développée
                        @buffer[depth-1].push('[' + label + '](' + (if url then @unescape(url) else '') + (if title then (' "' + @unescape(title) + '"') else '') + ')')

                @methods['close']['img'] = (node) =>
                    console.log('CLOSE:IMG') if @debug

                    depth = @currentdepth()
                    @depth--
                    prefix = @prefixstack_pop()

                    alt = this.attrOrFalse('alt', node)
                    src = this.attrOrFalse('src', node)
                    title = this.attrOrFalse('title', node)
                    html = prefix + '![' + (if alt then alt else '') + '](' + (if src then src else '') + (if title then ' "' + title + '"' else '') + ')'

                    @buffer[depth-1].push(html)

                @methods['close']['br'] = (node) =>
                    console.log('CLOSE:BR') if @debug

                    depth = @currentdepth()
                    @depth--
                    prefix = @prefixstack_pop()

                    html = prefix + @buffer[depth].join('').split('\n').join('\n' + prefix)

                    @buffer[depth-1].push(html + '  \n')

            currentdepth: () =>
                @depth

            parentTag: (node) =>
                if node && node.parentNode && node.parentNode.nodeType != @documentnodetype
                    node.parentNode
                else
                    null

            getPrefix: () =>
                @prefixstack[@currentdepth()] if @prefixstack[@currentdepth()]
                ''

            prefixstack_push: (prefix) =>
                console.log('PREFIX:PUSH:', @currentdepth(), "'" + prefix + "'") if @debug
                @prefixstack[@currentdepth()] = prefix

            prefixstack_pop: (prefix) =>
                console.log('PREFIX:POP:', @currentdepth()) if @debug
                before = @prefixstack[@currentdepth()]
                @prefixstack[@currentdepth()] = ''
                before

            hasParentOfType: (node, tagname) =>
                parent = @parentTag(node)
                (parent && parent.tagName.toLowerCase() == tagname)

            hasAncestorOfType: (node, tagname) =>

                parent = @parentTag(node)
                while parent
                    return true if parent.tagName.toLowerCase() == tagname
                    parent = @parentTag(parent)

                false

            escapeTextForMarkdown: (node, text) =>

                if @hasAncestorOfType(node, 'code') || @hasAncestorOfType(node, 'pre')
                    return text

                escapeChar = '\\'

                text
                    .replace(/\\/g, escapeChar + escapeChar)    # backslash
                    .replace(/`/g, escapeChar + '`')            # backtick
                #   .replace(/\*/g, escapeChar + '*')           # asterisk
                #   .replace(/_/g, escapeChar + '_')            # underscore
                #   .replace(/\{/g, escapeChar + '{')           # left curly brace
                #   .replace(/\}/g, escapeChar + '}')           # right curly brace
                #   .replace(/\[/g, escapeChar + '[')           # left square bracket
                #   .replace(/\]/g, escapeChar + ']')           # right square bracket
                #   .replace(/\(/g, escapeChar + '(')           # left parenthese
                #   .replace(/\)/g, escapeChar + ')')           # right parenthese
                    .replace(/\#/g, escapeChar + '#')           # hash mark
                #   .replace(/\+/g, escapeChar + '+')           # plus sign
                #   .replace(/\-/g, escapeChar + '-')           # minus mark (hyphen)
                #   .replace(/\./g, escapeChar + '.')           # dot
                #   .replace(/\!/g, escapeChar + '!')           # exclamation mark

            convert: (html) =>
                @setupParser()

                getNodeName = (node) ->
                    if node.nodeType is 3
                        "_text"
                    else
                        node.tagName.toLowerCase()

                walkDOM = (node, cbktext, cbkopen, cbkexplore, cbkclose) ->
                    
                    if node.nodeType is 3
                        cbktext(node)
                    else
                        orignode = node
                        cbkopen(orignode)
                        cbkexplore(orignode)

                        node = node.firstChild
                        while node
                            
                            walkDOM node, cbktext, cbkopen, cbkexplore, cbkclose

                            node = node.nextSibling

                        cbkclose(orignode)

                    return

                if @document
                    dom = HTMLtoDOM('<div id="hello">' + html + '</div>', @document)
                else
                    dom = HTMLtoDOM('<div id="hello">' + html + '</div>')

                walkDOM(
                    dom.getElementById("hello")
                    , (node) =>
                        # text
                        console.log "'" + node.data + "'" if @debug
                        @methods['_text'](node)

                    , (node) =>
                        # open
                        console.log "open:" + node.tagName.toLowerCase() if @debug

                        if @methods.open[node.tagName.toLowerCase()]
                            @methods.open[node.tagName.toLowerCase()](node)
                        else
                            @methods.open['_html'](node)

                    , (node) =>
                        # explore
                        console.log "explore:" + node.tagName.toLowerCase() if @debug
                    , (node) =>
                        # close
                        console.log "close:" + node.tagName.toLowerCase() if @debug

                        if @methods.close[node.tagName.toLowerCase()]
                            @methods.close[node.tagName.toLowerCase()](node)
                        else
                            @methods.close['_html'](node)

                )
                
                #console.dir(@buffer[0].join('').split('\n'))
                @buffer[0]
                    .join('')
                    #.replace(/^\s*/, '')
                    .replace(/\s*$/, '')
                    #.split('\n').slice(1,-1).join('\n')    # get rid of wrapping div
                    #.replace(/^\s*/, '')
                    #.replace(/\s*$/, '')
                    .replace(/^[ \t]+$/gm, '')
                    .replace(/\n{3,}/gm, '\n\n\n')  # 3 max for extra-padded pre next to li

            isInline: (tag) =>
                tag in @inlineelements

            isPreviousSiblingInline: (node) =>
                node && node.previousSibling && @isInline(node.previousSibling.tagName.toLowerCase())

            previoussiblingnontext: (node) =>

                prevsibling = node
                loop
                    prevsibling = prevsibling.previousSibling if prevsibling
                    return prevsibling if prevsibling and prevsibling.nodeType isnt @textnodetype
                    break unless prevsibling and not @isFirstChildNonText(prevsibling)

                return null

            nextsiblingnontext: (node) =>

                nextsibling = node
                loop
                    nextsibling = nextsibling.nextSibling if nextsibling
                    return nextsibling if nextsibling and nextsibling.nodeType isnt @textnodetype
                    break unless nextsibling and not @isLastChildNonText(nextsibling)

                return null

            hasPreviousSiblingNonTextOfType: (node, tagname) =>
                previoussiblingnontext = @previoussiblingnontext(node)
                previoussiblingnontext && previoussiblingnontext.tagName.toLowerCase() == tagname

            hasNextSiblingNonTextOfType: (node, tagname) =>
                nextsiblingnontext = @nextsiblingnontext(node)
                nextsiblingnontext && nextsiblingnontext.tagName.toLowerCase() == tagname

            firstChildNonText: (node) =>

                i = 0
                while i < node.childNodes.length
                    return node.childNodes[i] if node.childNodes[i].nodeType isnt @textnodetype
                    i++

                return null


            isFirstChild: (node) =>
                return !(!!node && !!node.previousSibling)

            isFirstChildNonText: (node) =>
                return node.parentNode && (@firstChildNonText(node.parentNode) == node)

            hasFirstChildNonTextOfType: (node, childtype) =>
                if !node || !node.firstChild
                    return null

                return node.firstChild.tagName.toLowerCase() == childtype if node.firstChild.nodeType isnt @textnodetype
                
                return @hasNextSiblingNonTextOfType(node.firstChild, childtype)

            isFirstChildNonTextOfParentType: (node, parenttype) =>
                return @hasParentOfType(node, parenttype) && @firstChildNonText(node.parentNode) == node

            isLastChild: (node) =>
                return !(!!node.nextSibling)

            isLastChildNonText: (node) =>
                return @isLastChild(node) || @lastChildNonText(node.parentNode) == node

            isLastChildNonTextUntilDepth0: (node) =>
                
                if !!!node
                    return false

                if (node.parentNode && @isFirstNodeNonText(node.parentNode)) || @isFirstNodeNonText(node)
                    return true

                if !@isLastChildNonText(node)
                    return false

                return @isLastChildNonTextUntilDepth0(node.parentNode)

            isFirstNode: (node) =>
                return !!node && @isFirstChild(node) && @isWrappingRootNode(node.parentNode)

            isFirstNodeNonText: (node) =>
                return !!node && @isFirstChildNonText(node) && @isWrappingRootNode(node.parentNode)

            isWrappingRootNode: (node) =>
                return node && node.nodeType != @textnodetype && node.tagName.toLowerCase() == 'div' && @attrOrFalse('id', node) == 'hello'

            hasLastChildOfType: (node, lastchildtype) =>
                return node && node.lastChild && node.lastChild.tagName.toLowerCase() == lastchildtype

            hasLastChildNonTextOfType: (node, lastchildtype) =>
                if !node || !node.lastChild
                    return null

                return node.lastChild.tagName.toLowerCase() == lastchildtype if node.lastChild.nodeType isnt @textnodetype
                
                return @hasPreviousSiblingNonTextOfType(node.lastChild, lastchildtype)

            lastChildNonText: (node) =>

                return null if !node || !node.lastChild
                
                return node.lastChild if node.lastChild.nodeType isnt @textnodetype

                return @previoussiblingnontext(node.lastChild)

            unescape: (html) =>
                e = @document.createElement('div')
                e.innerHTML = html
                if e.childNodes.length == 0
                    return ''
                else
                    return e.childNodes[0].nodeValue

            ### Static methods under this line ###

            attrOrFalse: (attr, node) ->
                i = 0
                while i < node.attributes.length
                    return node.attributes[i].nodeValue if node.attributes[i].name is attr
                    i++

                false
        #################################################

        upndown
) ->
    if "object" is typeof exports
        htmlparser = require 'htmlparser-jresig'
        jsdom = require("jsdom").jsdom

        module.exports = factory htmlparser, jsdom
    else if define?.amd
        define ['htmlparser'], factory
    else
        root.upndown = factory htmlparser
    return
