fs = require 'fs'
sys = require 'sys'
util = require 'util'
PEG = require 'pegjs'
#PegHtmlParser = require '../lib/html.pegjsparser'
DomNodes = require('../lib/domnodes');
upndown = require '../lib/upndown'

attachSiblings = (tree, parent) ->

    prevsibling = null

    for node in tree

        prevsibling.setNextSibling(node) if prevsibling != null
        node.setPreviousSibling(prevsibling)
        
        attachSiblings(node.getChildNodes()) if node.hasChilds()

        prevsibling = node

fs.readFile 'src/html.pegjs', (err, pegdata) ->
    
    throw err if err
    PegHtmlParser = PEG.buildParser(pegdata.toString());

    fs.readFile 'src/sample.medium.html', (err, html) ->

        htmlstring = html.toString()

        for k in [0..10]
            console.log k
            try
                DOM = PegHtmlParser.parse(htmlstring)
            catch e
                console.log(e)

        #console.log DOM.toString()

        #und = new upndown()
        #markdown = und.convert(DOM)
        #console.log(markdown)