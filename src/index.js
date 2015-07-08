'use strict';

import upndown from './upndownrec';

var html = `
<h1>h1</h1><h2>h2</h2><h3>h3</h3><h4>h4</h4><h5>h5</h5><h6>h6</h6><p>super</p><h1>Nested</h1><p>Le paragraphe <a href="http://google.com">contenant un lien</a>.</p><blockquote>
    <p>Hello, World !</p>
    <p>Hello, World !</p>
    <p>Hello, World !</p>
    <ul>
        <li><a href="http://netgusto.com" title="Super !">http://netgusto.com</a></li>
        <li><p>world</p></li>
        <li>
            <img src="http://netgusto.com/martin" />
            <blockquote>
                bof<br />
                bof 2<br />
                bof 3</blockquote>
            <ul>
                <li>super bien</li>
                <li>list item 2</li>
            </ul>
        </li>
    </ul>
    <ul>
        <li>super bien</li>
        <li>list item 2</li>
    </ul>
</blockquote>
<p><strong>Ce texte en gras</strong>. Ce texte <i>en
italique</i> !</p>


<ul>
    <li>hello</li>
    <li>world</li>
    <li>
        <ul>
            <li>nested</li>
            <li>nested two</li>
        </ul>
    </li>
</ul>

<p>Fin.</p>`;
var und = new upndown();
und.convert(html, function(err, markdown) {
    if(err) { console.log(err.stack); }
    else { console.log(markdown); } // Outputs: # Hello, World !
});
