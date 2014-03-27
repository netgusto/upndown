"use strict"

define ['upndown'], (upndown) ->

    und = new upndown()

    module("UpnDown Tests")

    test "basics", ->
        equal und.convert(""), ""
        equal und.convert("<h1>Heading 1</h1>"), "# Heading 1"
        equal und.convert("<h2>Heading 2</h2>"), "## Heading 2"
        equal und.convert("<h3>Heading 3</h3>"), "### Heading 3"
        equal und.convert("<h4>Heading 4</h4>"), "#### Heading 4"
        equal und.convert("<h5>Heading 5</h5>"), "##### Heading 5"
        equal und.convert("<h6>Heading 6</h6>"), "###### Heading 6"
        equal und.convert("<p>Paragraph.</p>"), "Paragraph."
        equal und.convert("<p><strong>Strong</strong> text.</p>"), "**Strong** text."
        equal und.convert("<p><b>Bold</b> text.</p>"), "**Bold** text."
        equal und.convert("<p><em>Emphasized</em> text.</p>"), "*Emphasized* text."
        equal und.convert("<p><code>Coded</code> text.</p>"), "`Coded` text."
        equal und.convert("<pre>Pre-formatted text.</pre>"), "    Pre-formatted text."
        equal und.convert("<blockquote><p>Blockquoted text.</p></blockquote>"), "> Blockquoted text."
        equal und.convert("<ul><li>One</li><li>Two</li></ul>"), "*   One\n*   Two"
        equal und.convert("<ol><li>One</li><li>Two</li></ol>"), "1.  One\n2.  Two"
        equal und.convert("<img src=\"http://netgusto.com/img/logo-netgusto.com\" alt=\"Net Gusto\" />"), "![Net Gusto](http://netgusto.com/img/logo-netgusto.com)"
        equal und.convert("<a href=\"http://netgusto.com/\">Net Gusto</a>"), "[Net Gusto](http://netgusto.com/)"
        equal und.convert("<hr />"), "* * *"
        equal und.convert("<div>Hello</div>"), "<div>Hello</div>"

        equal und.convert('''
        <p>First line of text.</p>
        <h1>Heading 1</h1>
        <ul>
            <li>List item 1.</li>
            <li>List item 2.</li>
            <li>List item 3.</li>
        </ul>
        <p>Second line of text.</p>
        <h2>Heading 2</h2>
        <blockquote>blockquoted text</blockquote>
        <ul>
            <li>List item 1.</li>
        </ul>
        '''), '''
        First line of text.

        # Heading 1

        *   List item 1.
        *   List item 2.
        *   List item 3.

        Second line of text.

        ## Heading 2

        > blockquoted text

        *   List item 1.
        '''

    test "heading", ->
        equal und.convert("<h1>Heading 1\nWith a newline</h1>"), "# Heading 1 With a newline"
        equal und.convert("<h2>Heading 2\nWith a newline and   several  \n\t  whitespaces</h2>"), "## Heading 2 With a newline and several whitespaces"
        equal und.convert("<h1>A header with <em>italics</em> in it</h1>"), "# A header with *italics* in it"
        equal und.convert("<h1>A header with a <a href=\"http://netgusto.com/\">link</a> in it.</h1>"), "# A header with a [link](http://netgusto.com/) in it."

    test "paragraph", ->
        equal und.convert("Line two."), "Line two."
        equal und.convert("<p>Line two.</p>"), "Line two."
        equal und.convert("<p>Line one.</p><p>Line two.</p>"), "Line one.\n\nLine two."
        equal und.convert("<p>Line one.</p>\n\n\n<p>Line two.</p>"), "Line one.\n\nLine two."
        equal und.convert("<p>Line\none.</p><p>Line\ntwo.</p>"), "Line one.\n\nLine two."
        equal und.convert("    <p>Line one.</p> <p>Line two.</p>      "), "Line one.\n\nLine two."

    test "code", ->
        equal und.convert("<code></code>"), "``"
        equal und.convert("<code>Line one.</code>"), "`Line one.`"
        equal und.convert("<p><code>Line one.</code></p>"), "`Line one.`"
        equal und.convert("<p><code>Line one.      Line two.</code></p>"), "`Line one.      Line two.`"
        equal und.convert("<p><code>Line one.  \n    Line two.</code></p>"), "`Line one.  \n    Line two.`"
        equal und.convert("<strong><code>Line one.  \n    Line two.</code></strong>"), "**`Line one.  \n    Line two.`**"

        equal und.convert('''
        <p>This is a normal paragraph:</p>

        <pre><code>This is a code block.
        </code></pre>
        '''), '''
        This is a normal paragraph:

            This is a code block.
        '''

        equal und.convert('''
        <p>Here is an example of AppleScript:</p>

        <pre><code>tell application "Foo"
            beep
        end tell
        </code></pre>
        '''), '''
        Here is an example of AppleScript:

            tell application "Foo"
                beep
            end tell
        '''

        equal und.convert('''
        <pre><code>&lt;div class="footer"&gt;
            &amp;copy; 2014 Foo Corporation
        &lt;/div&gt;
        </code></pre>
        '''),
        '    <div class="footer">\n        &copy; 2014 Foo Corporation\n    </div>'

        equal und.convert('''
        <pre><code>A code block with *asterisks*.
        And _underlines_.
        </code></pre>
        '''),
        '    A code block with *asterisks*.\n    And _underlines_.'

        equal und.convert('<p>Use the <code>printf()</code> function.</p>'), 'Use the `printf()` function.'
        
        #equal und.convert('<p><code>There is a literal backtick (`) here.</code></p>'), '``There is a literal backtick (`) here.``'
        
        equal und.convert('''<p>Please don't use any <code>&lt;blink&gt;</code> tags.</p>'''), '''Please don't use any `<blink>` tags.'''

        equal und.convert('<p><code>&amp;#8212;</code> is the decimal-encoded equivalent of <code>&amp;mdash;</code>.</p>'), '`&#8212;` is the decimal-encoded equivalent of `&mdash;`.'

        equal und.convert('<p>Markdown treats asterisks (<code>*</code>) and underscores (<code>_</code>) as indicators of emphasis. Text wrapped with one <code>*</code> or <code>_</code> will be wrapped with an</p>'), 'Markdown treats asterisks (`*`) and underscores (`_`) as indicators of emphasis. Text wrapped with one `*` or `_` will be wrapped with an'
        

    test "pre", ->
        equal und.convert("<pre>Pre();</pre><p>Hello</p>"), "    Pre();\n\nHello"
        equal und.convert("<pre><code>Pre();</code></pre><p>Hello</p>"), "    Pre();\n\nHello"
        equal und.convert("<pre>Line one.\nLine two.</pre>"), "    Line one.\n    Line two."

        equal und.convert('''
        <ul>
            <li>One.</li>
            <li>Two.<pre>
$ Pre line 1

$ Pre line 2</pre></li>
        </ul>
        '''), '''
        *   One.
        *   Two.


                $ Pre line 1

                $ Pre line 2
        '''

    test "blockquote", ->
        
        equal und.convert("<blockquote><p>Line one.</p><p>Line two.</p></blockquote>"), "> Line one.\n> \n> Line two."


        equal und.convert('''
        <blockquote>
            <p>This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet,
            consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus.
            Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.</p>

            <p>Donec sit amet nisl. Aliquam semper ipsum sit amet velit. Suspendisse
            id sem consectetuer libero luctus adipiscing.</p>
        </blockquote>
        '''), '''
        > This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus. Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.
        > 
        > Donec sit amet nisl. Aliquam semper ipsum sit amet velit. Suspendisse id sem consectetuer libero luctus adipiscing.
        '''

        equal und.convert('''
        <p>Hello, World !</p>

        <blockquote>
            <p>One</p>
            
            <blockquote>
                <p>Two</p>
            </blockquote>
            
            <p>Three</p>
        </blockquote>
        '''),
        '''
        Hello, World !

        > One
        > 
        > > Two
        > 
        > Three
        '''

        equal und.convert('''        
        <blockquote>
            <h2>This is a header.</h2>
            
            <ol>
                <li>This is the first list item.</li>
                <li>This is the second list item.</li>
            </ol>
            
            <p>Here's some example code:</p>
            
        <pre><code>return shell_exec("echo $input | $markdown_script");</code></pre>
        </blockquote>
        '''),
        '''
        > ## This is a header.
        > 
        > 1.  This is the first list item.
        > 2.  This is the second list item.
        > 
        > Here's some example code:
        > 
        >     return shell_exec("echo $input | $markdown_script");
        '''

    test "lists", ->
        
        # UL
        equal und.convert("<ul><li>Line one.</li></ul>"), "*   Line one."
        equal und.convert("<ul><li>Line one.</li><li>Line two.</li></ul>"), "*   Line one.\n*   Line two."
        equal und.convert("<ul><li>Line one.</li><li><p>Line two.</p></li></ul>"), "*   Line one.\n\n*   Line two."
        equal und.convert("<ul><li><p>Line one.</p></li><li><p>Line two.</p></li></ul>"), "*   Line one.\n\n*   Line two."
        equal und.convert("<ul><li><p>Line one.</p></li><li><p>Line two.</p></li><li><p>Line three.</p></li></ul>"), "*   Line one.\n\n*   Line two.\n\n*   Line three."
        
        #equal(und.convert('<ul><li><p>Line one.</p></li><li>Line two.</li><li><p>Line three.</p></li></ul>'), "* Line one.\n\n* Line two.\n\n* Line three.");
        
        # OL
        equal und.convert("<ol><li>Line one.</li></ol>"), "1.  Line one."
        equal und.convert("<ol><li>Line one.</li><li>Line two.</li></ol>"), "1.  Line one.\n2.  Line two."
        equal und.convert("<ol><li>Line one.</li><li><p>Line two.</p></li></ol>"), "1.  Line one.\n\n2.  Line two."
        equal und.convert("<ol><li><p>Line one.</p></li><li><p>Line two.</p></li></ol>"), "1.  Line one.\n\n2.  Line two."
        equal und.convert("<ol><li><p>Line one.</p></li><li><p>Line two.</p></li><li><p>Line three.</p></li></ol>"), "1.  Line one.\n\n2.  Line two.\n\n3.  Line three."
        
        # Nesting UL
        equal und.convert("<ul><li>Line one.<ul><li>Line two.</li></ul></li></ul>"), "*   Line one.\n    *   Line two."
        equal und.convert("<ul><li><p>Line one.</p><ul><li>Line two.</li></ul></li></ul>"), "*   Line one.\n\n    *   Line two."
        equal und.convert("<ul><li><p>Line one.</p><ul><li>Line two.</li><li>Line three.</li></ul></li></ul>"), "*   Line one.\n\n    *   Line two.\n    *   Line three."
        
        # Nesting OL
        equal und.convert("<ol><li>Line one.<ol><li>Line two.</li></ol></li></ol>"), "1.  Line one.\n    1.  Line two."
        equal und.convert("<ol><li><p>Line one.</p><ol><li>Line two.</li></ol></li></ol>"), "1.  Line one.\n\n    1.  Line two."
        equal und.convert("<ol><li><p>Line one.</p><ol><li>Line two.</li><li>Line three.</li></ol></li></ol>"), "1.  Line one.\n\n    1.  Line two.\n    2.  Line three."

        equal und.convert('''
        <ol>
            <li><p>This is a list item with two paragraphs. Lorem ipsum dolor
            sit amet, consectetuer adipiscing elit. Aliquam hendrerit
            mi posuere lectus.</p>

           <p>Vestibulum enim wisi, viverra nec, fringilla in, laoreet
            vitae, risus. Donec sit amet nisl. Aliquam semper ipsum
            sit amet velit.</p></li>

            <li><p>Suspendisse id sem consectetuer libero luctus adipiscing.</p></li>
        </ol>
        '''),
        '''
        1.  This is a list item with two paragraphs. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus.

            Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus. Donec sit amet nisl. Aliquam semper ipsum sit amet velit.

        2.  Suspendisse id sem consectetuer libero luctus adipiscing.
        '''


        equal und.convert('''
        <ul>
            <li><p>This is a list item with two paragraphs.</p>

            <p>This is the second paragraph in the list item. You're
        only required to indent the first line. Lorem ipsum dolor
        sit amet, consectetuer adipiscing elit.</p></li>

            <li><p>Another item in the same list.</p></li>
        </ul>'''),
        '''
        *   This is a list item with two paragraphs.

            This is the second paragraph in the list item. You're only required to indent the first line. Lorem ipsum dolor sit amet, consectetuer adipiscing elit.

        *   Another item in the same list.
        '''
        
        equal und.convert('''
        <ul>
            <li><p>A list item with a blockquote:</p>
            
            <blockquote>
                <p>This is a blockquote
                inside a list item.</p>
            </blockquote></li>
        </ul>'''),
        '''
        *   A list item with a blockquote:

            > This is a blockquote inside a list item.
        '''


        equal und.convert('''
        <ul>
            <li><p>A list item with a code block:</p>

        <pre><code>&lt;code goes here&gt;
        </code></pre></li>
        </ul>'''),
        '''
        *   A list item with a code block:


                <code goes here>
        '''

        equal und.convert('''
        <p>Unordered tight:</p>

        <ul>
        <li>asterisk 1</li>
        <li>asterisk 2</li>
        <li>asterisk 3</li>
        </ul>
        '''), '''
        Unordered tight:

        *   asterisk 1
        *   asterisk 2
        *   asterisk 3
        '''

        equal und.convert('''
        <p>Unordered loose:</p>

        <ul>
        <li><p>asterisk 1</p></li>
        <li><p>asterisk 2</p></li>
        <li><p>asterisk 3</p></li>
        </ul>
        '''), '''
        Unordered loose:

        *   asterisk 1

        *   asterisk 2

        *   asterisk 3
        '''

        equal und.convert('''
        <p>Ordered tight:</p>

        <ol>
        <li>First</li>
        <li>Second</li>
        <li>Third</li>
        </ol>
        '''), '''
        Ordered tight:

        1.  First
        2.  Second
        3.  Third
        '''

        equal und.convert('''
        <p>Ordered loose:</p>

        <ol>
        <li><p>First</p></li>
        <li><p>Second</p></li>
        <li><p>Third</p></li>
        </ol>
        '''), '''
        Ordered loose:

        1.  First

        2.  Second

        3.  Third
        '''

        equal und.convert('''
        <p>Multiple paragraphs:</p>

        <ol>
        <li><p>Item 1, graf one.</p>

        <p>Item 2. graf two. The quick brown fox jumped over the lazy dog's
        back.</p></li>
        <li><p>Item 2.</p></li>
        <li><p>Item 3.</p></li>
        </ol>
        '''), '''
        Multiple paragraphs:
        
        1.  Item 1, graf one.
        
            Item 2. graf two. The quick brown fox jumped over the lazy dog's back.
        
        2.  Item 2.
        
        3.  Item 3.
        '''

        equal und.convert('''
        <h2>Nested</h2>

        <ul>
        <li>Tab
        <ul>
        <li>Tab
        <ul>
        <li>Tab</li>
        </ul></li>
        </ul></li>
        </ul>
        '''), '''
        ## Nested

        *   Tab 
            *   Tab 
                *   Tab
        '''

        equal und.convert('''
        <p>Another nested:</p>

        <ol>
        <li>First</li>
        <li>Second:
        <ul>
        <li>Fee</li>
        <li>Fie</li>
        <li>Foe</li>
        </ul></li>
        <li>Third</li>
        </ol>
        '''), '''
        Another nested:

        1.  First
        2.  Second: 
            *   Fee
            *   Fie
            *   Foe
        3.  Third
        '''

        equal und.convert('''
        <p>Same thing but with paragraphs:</p>

        <ol>
        <li><p>First</p></li>
        <li><p>Second:</p>

        <ul>
        <li>Fee</li>
        <li>Fie</li>
        <li>Foe</li>
        </ul></li>
        <li><p>Third</p></li>
        </ol>
        '''), '''
        Same thing but with paragraphs:

        1.  First

        2.  Second:
        
            *   Fee
            *   Fie
            *   Foe

        3.  Third
        '''

    test "links", () ->

        equal und.convert('<p>This is <a href="http://netgusto.com/" title="Title">Net Gusto</a> inline link.</p>'), 'This is [Net Gusto](http://netgusto.com/ "Title") inline link.'
        equal und.convert('<p><a href="http://netgusto.com/">This link</a> has no title attribute.</p>'), '[This link](http://netgusto.com/) has no title attribute.'
        equal und.convert('<p>See my <a href="/about/">About</a> page for details.</p>'), 'See my [About](/about/) page for details.'
        equal und.convert('<p>This is an autolink: <a href="http://netgusto.com">http://netgusto.com</a>.</p>'), 'This is an autolink: <http://netgusto.com>.'

        equal und.convert('<p>Mail links <a href="&#x6d;&#97;&#x69;&#108;&#x74;&#111;&#x3a;n&#105;&#x6b;&#108;&#x61;&#115;&#x40;&#102;&#x72;y&#107;&#x68;&#111;&#x6c;&#109;&#x2e;&#115;&#x65;">&#x6e;&#105;&#x6b;&#108;&#x61;&#115;&#x40;f&#114;&#x79;&#107;&#x68;&#111;&#x6c;&#109;&#x2e;s&#101;</a> and <a href="&#x6d;&#97;&#x69;&#108;&#x74;&#111;&#x3a;n&#105;&#x6b;&#108;&#x61;&#115;&#x40;&#102;&#x72;y&#107;&#x68;&#111;&#x6c;&#109;&#x2e;&#115;&#x65;">&#x6e;&#105;&#x6b;&#108;&#x61;&#115;&#x40;f&#114;&#x79;&#107;&#x68;&#111;&#x6c;&#109;&#x2e;s&#101;</a>.</p>'), 'Mail links <niklas@frykholm.se> and <niklas@frykholm.se>.'

    test "emphasis", () ->

        equal und.convert('<p>This is <a href="http://netgusto.com/" title="Title">Net Gusto</a> inline link.</p>'), 'This is [Net Gusto](http://netgusto.com/ "Title") inline link.'
        
        equal und.convert('<p>Test <em>single asterisks</em> test.</p>'), 'Test *single asterisks* test.'

        equal und.convert('<p>Test <strong>double asterisks</strong> test.</p>'), 'Test **double asterisks** test.'

        equal und.convert('<p>net<em>gust</em>o</p>'), 'net*gust*o'

        equal und.convert('<p>*this text is surrounded by literal asterisks*</p>'), '\*this text is surrounded by literal asterisks\*'

        equal und.convert('<p>Test with <em>two</em> different <em>words</em>.</p>'), 'Test with *two* different *words*.'

    test "images", () ->

        equal und.convert('<p><img src="/path/to/img.jpg" alt="Alt text"/></p>'), '![Alt text](/path/to/img.jpg)'
        equal und.convert('<p><img src="/path/to/img.jpg" alt="Alt text" title="Optional title"/></p>'), '![Alt text](/path/to/img.jpg "Optional title")'

    test "escapes", () ->

        equal und.convert('<p>*literal asterisks*</p>'), '\*literal asterisks\*'
        equal und.convert('<p>*literal asterisks*</p>'), '\*literal asterisks\*'

    test "linebreaks", () ->

        equal und.convert('<p>Poetry<br/>in<br/>motion</p>'), '''
        Poetry  
        in  
        motion
        '''

    test "amps", () ->
        equal und.convert('<p>&copy;</p>'), '©'
        equal und.convert('<p>AT&amp;T</p>'), 'AT&T'
        equal und.convert('<p>4 &lt; 5</p>'), '4 < 5'

    test "markdown_nested_blockquotes", () ->

        equal und.convert('''
        <blockquote>
          <p>foo</p>
          
          <blockquote>
            <p>bar</p>
          </blockquote>
          
          <p>foo</p>
        </blockquote>
        '''), '''
        > foo
        > 
        > > bar
        > 
        > foo
        '''

    test "markdown_documentation_amps_and_angles", () ->

        equal und.convert('''
        <p>AT&T has an ampersand in their name.</p>

        <p>AT&amp;T is another way to write it.</p>

        <p>This &amp; that.</p>

        <p>4 &lt; 5.</p>

        <p>6 > 5.</p>

        <p>Here's a <a href="http://example.com/?foo=1&amp;bar=2">link</a> with an ampersand in the URL.</p>

        <p>Here's a link with an ampersand in the link text: <a href="http://att.com/" title="AT&amp;T">AT&amp;T</a>.</p>

        <p>Here's an inline <a href="/script?foo=1&amp;bar=2">link</a>.</p>
        '''), '''
        AT&T has an ampersand in their name.

        AT&T is another way to write it.

        This & that.

        4 < 5.

        6 > 5.

        Here's a [link](http://example.com/?foo=1&bar=2) with an ampersand in the URL.

        Here's a link with an ampersand in the link text: [AT&T](http://att.com/ "AT&T").

        Here's an inline [link](/script?foo=1&bar=2).
        '''

    test "markdown_documentation_auto_links", () ->

        equal und.convert('''
        <p>Link: <a href="http://example.com/">http://example.com/</a>.</p>

        <p>With an ampersand: <a href="http://example.com/?foo=1&bar=2">http://example.com/?foo=1&amp;bar=2</a></p>

        <ul>
        <li>In a list?</li>
        <li><a href="http://example.com/">http://example.com/</a></li>
        <li>It should.</li>
        </ul>

        <blockquote>
          <p>Blockquoted: <a href="http://example.com/">http://example.com/</a></p>
        </blockquote>

        <p>Auto-links should not occur here: <code>&lt;http://example.com/&gt;</code></p>

        <pre><code>or here: &lt;http://example.com/&gt;
        </code></pre>
        '''), '''
        Link: <http://example.com/>.

        With an ampersand: <http://example.com/?foo=1&bar=2>

        *   In a list?
        *   <http://example.com/>
        *   It should.

        > Blockquoted: <http://example.com/>

        Auto-links should not occur here: `<http://example.com/>`

            or here: <http://example.com/>
        '''

    test "markdown_documentation_blockquotes_with_codeblocks", () ->

        equal und.convert('''
        <blockquote>
          <p>Example:</p>

        <pre><code>sub status {
            print "working";
        }</code></pre>
          
          <p>Or:</p>

        <pre><code>sub status {
            return "working";
        }</code></pre>
        </blockquote>
        '''), '''
        > Example:
        > 
        >     sub status {
        >         print "working";
        >     }
        > 
        > Or:
        > 
        >     sub status {
        >         return "working";
        >     }
        '''

    test "markdown_documentation_literal_quotes_in_text", () ->

        equal und.convert('<p>Foo <a href="/url/" title="Title with &quot;quotes&quot; inside">bar</a>.</p>'), 'Foo [bar](/url/ "Title with "quotes" inside").'
        equal und.convert('<p>Hello, "World" !</p>'), 'Hello, "World" !'
        equal und.convert('<p>Hello, &quot;World&quot; !</p>'), 'Hello, "World" !'
    
    test "markdown_documentation_basics", () ->

        equal und.convert('''
        <h1>Markdown: Basics</h1>

        <h2>Getting the Gist of Markdown's Formatting Syntax</h2>

        <p>This page offers a brief overview of what it's like to use Markdown.
        The <a href="/projects/markdown/syntax" title="Markdown Syntax">syntax page</a> provides complete, detailed documentation for
        every feature, but Markdown should be very easy to pick up simply by
        looking at a few examples of it in action. The examples on this page
        are written in a before/after style, showing example syntax and the
        HTML output produced by Markdown.</p>

        <p>It's also helpful to simply try Markdown out; the <a href="/projects/markdown/dingus" title="Markdown Dingus">Dingus</a> is a
        web application that allows you type your own Markdown-formatted text
        and translate it to XHTML.</p>

        <p><strong>Note:</strong> This document is itself written using Markdown; you
        can <a href="/projects/markdown/basics.text">see the source for it by adding '.text' to the URL</a>.</p>

        <h2>Paragraphs, Headers, Blockquotes</h2>

        <p>A paragraph is simply one or more consecutive lines of text, separated
        by one or more blank lines. (A blank line is any line that looks like a
        blank line -- a line containing nothing spaces or tabs is considered
        blank.) Normal paragraphs should not be intended with spaces or tabs.</p>

        <p>Markdown offers two styles of headers: <em>Setext</em> and <em>atx</em>.
        Setext-style headers for <code>&lt;h1&gt;</code> and <code>&lt;h2&gt;</code> are created by
        "underlining" with equal signs (<code>=</code>) and hyphens (<code>-</code>), respectively.
        To create an atx-style header, you put 1-6 hash marks (<code>#</code>) at the
        beginning of the line -- the number of hashes equals the resulting
        HTML header level.</p>

        <p>Blockquotes are indicated using email-style '<code>&gt;</code>' angle brackets.</p>

        <p>Markdown:</p>

        <pre><code>A First Level Header
        ====================

        A Second Level Header
        ---------------------

        Now is the time for all good men to come to
        the aid of their country. This is just a
        regular paragraph.

        The quick brown fox jumped over the lazy
        dog's back.

        ### Header 3

        &gt; This is a blockquote.
        &gt; 
        &gt; This is the second paragraph in the blockquote.
        &gt;
        &gt; ## This is an H2 in a blockquote</code></pre>

        <p>Output:</p>

        <pre><code>&lt;h1&gt;A First Level Header&lt;/h1&gt;

        &lt;h2&gt;A Second Level Header&lt;/h2&gt;

        &lt;p&gt;Now is the time for all good men to come to
        the aid of their country. This is just a
        regular paragraph.&lt;/p&gt;

        &lt;p&gt;The quick brown fox jumped over the lazy
        dog's back.&lt;/p&gt;

        &lt;h3&gt;Header 3&lt;/h3&gt;

        &lt;blockquote&gt;
            &lt;p&gt;This is a blockquote.&lt;/p&gt;

            &lt;p&gt;This is the second paragraph in the blockquote.&lt;/p&gt;

            &lt;h2&gt;This is an H2 in a blockquote&lt;/h2&gt;
        &lt;/blockquote&gt;</code></pre>

        <h3>Phrase Emphasis</h3>

        <p>Markdown uses asterisks and underscores to indicate spans of emphasis.</p>

        <p>Markdown:</p>

        <pre><code>Some of these words *are emphasized*.
        Some of these words _are emphasized also_.

        Use two asterisks for **strong emphasis**.
        Or, if you prefer, __use two underscores instead__.</code></pre>

        <p>Output:</p>

        <pre><code>&lt;p&gt;Some of these words &lt;em&gt;are emphasized&lt;/em&gt;.
        Some of these words &lt;em&gt;are emphasized also&lt;/em&gt;.&lt;/p&gt;

        &lt;p&gt;Use two asterisks for &lt;strong&gt;strong emphasis&lt;/strong&gt;.
        Or, if you prefer, &lt;strong&gt;use two underscores instead&lt;/strong&gt;.&lt;/p&gt;</code></pre>

        <h2>Lists</h2>

        <p>Unordered (bulleted) lists use asterisks, pluses, and hyphens (<code>*</code>,
        <code>+</code>, and <code>-</code>) as list markers. These three markers are
        interchangable; this:</p>

        <pre><code>*   Candy.
        *   Gum.
        *   Booze.</code></pre>

        <p>this:</p>

        <pre><code>+   Candy.
        +   Gum.
        +   Booze.</code></pre>

        <p>and this:</p>

        <pre><code>-   Candy.
        -   Gum.
        -   Booze.</code></pre>

        <p>all produce the same output:</p>

        <pre><code>&lt;ul&gt;
        &lt;li&gt;Candy.&lt;/li&gt;
        &lt;li&gt;Gum.&lt;/li&gt;
        &lt;li&gt;Booze.&lt;/li&gt;
        &lt;/ul&gt;</code></pre>

        <p>Ordered (numbered) lists use regular numbers, followed by periods, as
        list markers:</p>

        <pre><code>1.  Red
        2.  Green
        3.  Blue</code></pre>

        <p>Output:</p>

        <pre><code>&lt;ol&gt;
        &lt;li&gt;Red&lt;/li&gt;
        &lt;li&gt;Green&lt;/li&gt;
        &lt;li&gt;Blue&lt;/li&gt;
        &lt;/ol&gt;</code></pre>

        <p>If you put blank lines between items, you'll get <code>&lt;p&gt;</code> tags for the
        list item text. You can create multi-paragraph list items by indenting
        the paragraphs by 4 spaces or 1 tab:</p>

        <pre><code>*   A list item.

            With multiple paragraphs.

        *   Another item in the list.</code></pre>

        <p>Output:</p>

        <pre><code>&lt;ul&gt;
        &lt;li&gt;&lt;p&gt;A list item.&lt;/p&gt;
        &lt;p&gt;With multiple paragraphs.&lt;/p&gt;&lt;/li&gt;
        &lt;li&gt;&lt;p&gt;Another item in the list.&lt;/p&gt;&lt;/li&gt;
        &lt;/ul&gt;</code></pre>

        <h3>Links</h3>

        <p>Markdown supports two styles for creating links: <em>inline</em> and
        <em>reference</em>. With both styles, you use square brackets to delimit the
        text you want to turn into a link.</p>

        <p>Inline-style links use parentheses immediately after the link text.
        For example:</p>

        <pre><code>This is an [example link](http://example.com/).</code></pre>

        <p>Output:</p>

        <pre><code>&lt;p&gt;This is an &lt;a href="http://example.com/"&gt;
        example link&lt;/a&gt;.&lt;/p&gt;</code></pre>

        <p>Optionally, you may include a title attribute in the parentheses:</p>

        <pre><code>This is an [example link](http://example.com/ "With a Title").</code></pre>

        <p>Output:</p>

        <pre><code>&lt;p&gt;This is an &lt;a href="http://example.com/" title="With a Title"&gt;
        example link&lt;/a&gt;.&lt;/p&gt;</code></pre>

        <p>Reference-style links allow you to refer to your links by names, which
        you define elsewhere in your document:</p>

        <pre><code>I get 10 times more traffic from [Google][1] than from
        [Yahoo][2] or [MSN][3].

        [1]: http://google.com/        "Google"
        [2]: http://search.yahoo.com/  "Yahoo Search"
        [3]: http://search.msn.com/    "MSN Search"</code></pre>

        <p>Output:</p>

        <pre><code>&lt;p&gt;I get 10 times more traffic from &lt;a href="http://google.com/"
        title="Google"&gt;Google&lt;/a&gt; than from &lt;a href="http://search.yahoo.com/"
        title="Yahoo Search"&gt;Yahoo&lt;/a&gt; or &lt;a href="http://search.msn.com/"
        title="MSN Search"&gt;MSN&lt;/a&gt;.&lt;/p&gt;</code></pre>

        <p>The title attribute is optional. Link names may contain letters,
        numbers and spaces, but are <em>not</em> case sensitive:</p>

        <pre><code>I start my morning with a cup of coffee and
        [The New York Times][NY Times].

        [ny times]: http://www.nytimes.com/</code></pre>

        <p>Output:</p>

        <pre><code>&lt;p&gt;I start my morning with a cup of coffee and
        &lt;a href="http://www.nytimes.com/"&gt;The New York Times&lt;/a&gt;.&lt;/p&gt;</code></pre>

        <h3>Images</h3>

        <p>Image syntax is very much like link syntax.</p>

        <p>Inline (titles are optional):</p>

        <pre><code>![alt text](/path/to/img.jpg "Title")</code></pre>

        <p>Reference-style:</p>

        <pre><code>![alt text][id]

        [id]: /path/to/img.jpg "Title"</code></pre>

        <p>Both of the above examples produce the same output:</p>

        <pre><code>&lt;img src="/path/to/img.jpg" alt="alt text" title="Title" /&gt;</code></pre>

        <h3>Code</h3>

        <p>In a regular paragraph, you can create code span by wrapping text in
        backtick quotes. Any ampersands (<code>&amp;</code>) and angle brackets (<code>&lt;</code> or
        <code>&gt;</code>) will automatically be translated into HTML entities. This makes
        it easy to use Markdown to write about HTML example code:</p>

        <pre><code>I strongly recommend against using any `&lt;blink&gt;` tags.

        I wish SmartyPants used named entities like `&amp;mdash;`
        instead of decimal-encoded entites like `&amp;#8212;`.</code></pre>

        <p>Output:</p>

        <pre><code>&lt;p&gt;I strongly recommend against using any
        &lt;code&gt;&amp;lt;blink&amp;gt;&lt;/code&gt; tags.&lt;/p&gt;

        &lt;p&gt;I wish SmartyPants used named entities like
        &lt;code&gt;&amp;amp;mdash;&lt;/code&gt; instead of decimal-encoded
        entites like &lt;code&gt;&amp;amp;#8212;&lt;/code&gt;.&lt;/p&gt;</code></pre>

        <p>To specify an entire block of pre-formatted code, indent every line of
        the block by 4 spaces or 1 tab. Just like with code spans, <code>&amp;</code>, <code>&lt;</code>,
        and <code>&gt;</code> characters will be escaped automatically.</p>

        <p>Markdown:</p>

        <pre><code>If you want your page to validate under XHTML 1.0 Strict,
        you've got to put paragraph tags in your blockquotes:

            &lt;blockquote&gt;
                &lt;p&gt;For example.&lt;/p&gt;
            &lt;/blockquote&gt;</code></pre>

        <p>Output:</p>

        <pre><code>&lt;p&gt;If you want your page to validate under XHTML 1.0 Strict,
        you've got to put paragraph tags in your blockquotes:&lt;/p&gt;

        &lt;pre&gt;&lt;code&gt;&amp;lt;blockquote&amp;gt;
            &amp;lt;p&amp;gt;For example.&amp;lt;/p&amp;gt;
        &amp;lt;/blockquote&amp;gt;
        &lt;/code&gt;&lt;/pre&gt;</code></pre>
        '''), '''
        .# Markdown: Basics
        .
        .## Getting the Gist of Markdown's Formatting Syntax
        .
        .This page offers a brief overview of what it's like to use Markdown. The [syntax page](/projects/markdown/syntax "Markdown Syntax") provides complete, detailed documentation for every feature, but Markdown should be very easy to pick up simply by looking at a few examples of it in action. The examples on this page are written in a before/after style, showing example syntax and the HTML output produced by Markdown.
        .
        .It's also helpful to simply try Markdown out; the [Dingus](/projects/markdown/dingus "Markdown Dingus") is a web application that allows you type your own Markdown-formatted text and translate it to XHTML.
        .
        .**Note:** This document is itself written using Markdown; you can [see the source for it by adding '.text' to the URL](/projects/markdown/basics.text).
        .
        .## Paragraphs, Headers, Blockquotes
        .
        .A paragraph is simply one or more consecutive lines of text, separated by one or more blank lines. (A blank line is any line that looks like a blank line -- a line containing nothing spaces or tabs is considered blank.) Normal paragraphs should not be intended with spaces or tabs.
        .
        .Markdown offers two styles of headers: *Setext* and *atx*. Setext-style headers for `<h1>` and `<h2>` are created by "underlining" with equal signs (`=`) and hyphens (`-`), respectively. To create an atx-style header, you put 1-6 hash marks (`#`) at the beginning of the line -- the number of hashes equals the resulting HTML header level.
        .
        .Blockquotes are indicated using email-style '`>`' angle brackets.
        .
        .Markdown:
        .
        .    A First Level Header
        .    ====================
        .
        .    A Second Level Header
        .    ---------------------
        .
        .    Now is the time for all good men to come to
        .    the aid of their country. This is just a
        .    regular paragraph.
        .
        .    The quick brown fox jumped over the lazy
        .    dog's back.
        .
        .    ### Header 3
        .
        .    > This is a blockquote.
        .    > 
        .    > This is the second paragraph in the blockquote.
        .    >
        .    > ## This is an H2 in a blockquote
        .
        .Output:
        .
        .    <h1>A First Level Header</h1>
        .
        .    <h2>A Second Level Header</h2>
        .
        .    <p>Now is the time for all good men to come to
        .    the aid of their country. This is just a
        .    regular paragraph.</p>
        .
        .    <p>The quick brown fox jumped over the lazy
        .    dog's back.</p>
        .
        .    <h3>Header 3</h3>
        .
        .    <blockquote>
        .        <p>This is a blockquote.</p>
        .
        .        <p>This is the second paragraph in the blockquote.</p>
        .
        .        <h2>This is an H2 in a blockquote</h2>
        .    </blockquote>
        .
        .### Phrase Emphasis
        .
        .Markdown uses asterisks and underscores to indicate spans of emphasis.
        .
        .Markdown:
        .
        .    Some of these words *are emphasized*.
        .    Some of these words _are emphasized also_.
        .
        .    Use two asterisks for **strong emphasis**.
        .    Or, if you prefer, __use two underscores instead__.
        .
        .Output:
        .
        .    <p>Some of these words <em>are emphasized</em>.
        .    Some of these words <em>are emphasized also</em>.</p>
        .
        .    <p>Use two asterisks for <strong>strong emphasis</strong>.
        .    Or, if you prefer, <strong>use two underscores instead</strong>.</p>
        .
        .## Lists
        .
        .Unordered (bulleted) lists use asterisks, pluses, and hyphens (`*`, `+`, and `-`) as list markers. These three markers are interchangable; this:
        .
        .    *   Candy.
        .    *   Gum.
        .    *   Booze.
        .
        .this:
        .
        .    +   Candy.
        .    +   Gum.
        .    +   Booze.
        .
        .and this:
        .
        .    -   Candy.
        .    -   Gum.
        .    -   Booze.
        .
        .all produce the same output:
        .
        .    <ul>
        .    <li>Candy.</li>
        .    <li>Gum.</li>
        .    <li>Booze.</li>
        .    </ul>
        .
        .Ordered (numbered) lists use regular numbers, followed by periods, as list markers:
        .
        .    1.  Red
        .    2.  Green
        .    3.  Blue
        .
        .Output:
        .
        .    <ol>
        .    <li>Red</li>
        .    <li>Green</li>
        .    <li>Blue</li>
        .    </ol>
        .
        .If you put blank lines between items, you'll get `<p>` tags for the list item text. You can create multi-paragraph list items by indenting the paragraphs by 4 spaces or 1 tab:
        .
        .    *   A list item.
        .
        .        With multiple paragraphs.
        .
        .    *   Another item in the list.
        .
        .Output:
        .
        .    <ul>
        .    <li><p>A list item.</p>
        .    <p>With multiple paragraphs.</p></li>
        .    <li><p>Another item in the list.</p></li>
        .    </ul>
        .
        .### Links
        .
        .Markdown supports two styles for creating links: *inline* and *reference*. With both styles, you use square brackets to delimit the text you want to turn into a link.
        .
        .Inline-style links use parentheses immediately after the link text. For example:

        .    This is an [example link](http://example.com/).
        .
        .Output:
        .
        .    <p>This is an <a href="http://example.com/">
        .    example link</a>.</p>
        .
        .Optionally, you may include a title attribute in the parentheses:
        .
        .    This is an [example link](http://example.com/ "With a Title").
        .
        .Output:
        .
        .    <p>This is an <a href="http://example.com/" title="With a Title">
        .    example link</a>.</p>
        .
        .Reference-style links allow you to refer to your links by names, which you define elsewhere in your document:
        .
        .    I get 10 times more traffic from [Google][1] than from
        .    [Yahoo][2] or [MSN][3].
        .
        .    [1]: http://google.com/        "Google"
        .    [2]: http://search.yahoo.com/  "Yahoo Search"
        .    [3]: http://search.msn.com/    "MSN Search"
        .
        .Output:
        .
        .    <p>I get 10 times more traffic from <a href="http://google.com/"
        .    title="Google">Google</a> than from <a href="http://search.yahoo.com/"
        .    title="Yahoo Search">Yahoo</a> or <a href="http://search.msn.com/"
        .    title="MSN Search">MSN</a>.</p>
        .
        .The title attribute is optional. Link names may contain letters, numbers and spaces, but are *not* case sensitive:
        .
        .    I start my morning with a cup of coffee and
        .    [The New York Times][NY Times].
        .
        .    [ny times]: http://www.nytimes.com/
        .
        .Output:
        .
        .    <p>I start my morning with a cup of coffee and
        .    <a href="http://www.nytimes.com/">The New York Times</a>.</p>
        .
        .### Images
        .
        .Image syntax is very much like link syntax.
        .
        .Inline (titles are optional):
        .
        .    ![alt text](/path/to/img.jpg "Title")
        .
        .Reference-style:
        .
        .    ![alt text][id]
        .
        .    [id]: /path/to/img.jpg "Title"
        .
        .Both of the above examples produce the same output:
        .
        .    <img src="/path/to/img.jpg" alt="alt text" title="Title" />
        .
        .### Code
        .
        .In a regular paragraph, you can create code span by wrapping text in backtick quotes. Any ampersands (`&`) and angle brackets (`<` or `>`) will automatically be translated into HTML entities. This makes it easy to use Markdown to write about HTML example code:
        .
        .    I strongly recommend against using any `<blink>` tags.
        .
        .    I wish SmartyPants used named entities like `&mdash;`
        .    instead of decimal-encoded entites like `&#8212;`.
        .
        .Output:
        .
        .    <p>I strongly recommend against using any
        .    <code>&lt;blink&gt;</code> tags.</p>
        .
        .    <p>I wish SmartyPants used named entities like
        .    <code>&amp;mdash;</code> instead of decimal-encoded
        .    entites like <code>&amp;#8212;</code>.</p>
        .
        .To specify an entire block of pre-formatted code, indent every line of the block by 4 spaces or 1 tab. Just like with code spans, `&`, `<`, and `>` characters will be escaped automatically.
        .
        .Markdown:
        .
        .    If you want your page to validate under XHTML 1.0 Strict,
        .    you've got to put paragraph tags in your blockquotes:
        .
        .        <blockquote>
        .            <p>For example.</p>
        .        </blockquote>
        .
        .Output:
        .
        .    <p>If you want your page to validate under XHTML 1.0 Strict,
        .    you've got to put paragraph tags in your blockquotes:</p>
        .
        .    <pre><code>&lt;blockquote&gt;
        .        &lt;p&gt;For example.&lt;/p&gt;
        .    &lt;/blockquote&gt;
        .    </code></pre>
        '''.replace(/^\./gm, '')

    ###
    test "raw", () ->

        equal und.convert('''
        <div>
            This should not be disturbed by Markdown.
        </div>
        '''), '''
        <div>
            This should not be disturbed by Markdown.
        </div>
        '''
    ###