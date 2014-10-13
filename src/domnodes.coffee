class GenericNode

    name: null
    parent: null
    previousSibling: null
    nextSibling: null
    firstChild: null
    lastChild: null
    data: null
    attributes: null
    childNodes: null

    constructor: (params) ->
        
        @name = params.name
        @data = params.data or null
        @attributes = params.attributes or {}
        @childNodes = params.childNodes or []

        if @childNodes.length
            @firstChild = @childNodes[0]
            @lastChild = @childNodes[@childNodes.length-1]
        
            child.setParent(@) for child in @childNodes

    isFirstChild: () => @childNodes.length > 0

    hasChilds: () => @childNodes.length > 0

    getChildNodes: () => @childNodes

    hasParent: (parent) => @parent != null

    getParent: () => @parent

    setParent: (parent) =>

        # Setting parent
        @parent = parent

        if @parent != null

            # Attaching siblings one to another
            prevsibling = null

            for sibling in @parent.childNodes

                prevsibling.setNextSibling(sibling) if prevsibling != null
                sibling.setPreviousSibling(prevsibling)
                prevsibling = sibling

        return @

    setPreviousSibling: (previousSibling) => @previousSibling = previousSibling; return @

    getPreviousSibling: () => @previousSibling

    setNextSibling: (nextSibling) => @nextSibling = nextSibling; return @

    getNextSibling: () => @nextSibling

    getAttributes: () => @attributes

    isTextNode: () => false

    isCommentNode: () => false

    isDocumentNode: () => false

    toString: () =>

        line = '<' + @name
        attributes = @getAttributes()

        for attribute in attributes

            line += ' ' + attribute.name;

            line += '="' + attribute.value + '"' if attribute.value != null

        line += '>'

        line += @data if @data != null

        line += child.toString() for child in @getChildNodes()

        line += '</' + @name + '>'

        line

class Doctype extends GenericNode

    constructor: (params) -> super(params); @name = 'doctype'

    toString: () ->
        '<!doctype' + @data + '>'

class Comment extends GenericNode

    constructor: (params) -> super(params); @name = '_comment'

    toString: () ->
        '<!--' + @data + '-->'

class Text extends GenericNode

    constructor: (params) ->
        @name = '_text'
        @data = params.data

    isTextNode: () => true

    toString: () => @data

class Tag extends GenericNode

class DocumentNode extends GenericNode

    constructor: (params) -> super(params); @name = '_document'

    isDocumentNode: () => true

    toString: () ->
        line = ''
        line += child.toString() for child in @getChildNodes()
        line

module.exports = {
    DocumentNode: DocumentNode
    Doctype: Doctype
    Comment: Comment
    Text: Text
    Tag: Tag
}