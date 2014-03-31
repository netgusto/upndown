# upndown

Javascript HTML to Markdown converter, for Node.js and the browser.

[Live demo here](http://upndown.netgusto.com/).

## About

This library converts HTML documents to Markdown documents.

The Markdown syntax does not offer a syntactic equivalent for every HTML tag, so this conversion is lossy.

**upndown** is designed to offer a fast, reliable and whitespace perfect conversion for HTML documents that are made up of elements that have an equivalent in the Markdown syntax, making it suited for Markdown WYSIWYG editors.

## Install / Usage

### Browser

**Standard loading**

Download the zip archive on github, unzip, copy in your web folder, and in your HTML:

```html
<script type="text/javascript" src="/assets/upndown/lib/htmlparser.min.js"></script>
<script type="text/javascript" src="/assets/upndown/lib/upndown.min.js"></script>
<script type="text/javascript">

    var und = new upndown();
    var markdown = und.convert('<h1>Hello, World !</h1>');
    
    console.log(markdown); // Outputs: # Hello, World !
    
</script>
```

**Using RequireJS**

Download the zip archive on github, unzip, copy in your web folder, and in your HTML:

```html
<script type="text/javascript" src="http://requirejs.org/docs/release/2.1.11/minified/require.js"></script>
<script type="text/javascript">

require.config({
    paths: {
        'upndown': '/assets/upndown/lib/upndown.min'
        'htmlparser': '/assets/upndown/lib/htmlparser.min'
    }
});
 
require(['upndown'], function(upndown) {
    var und = new upndown();
    var markdown = und.convert('<h1>Hello, World !</h1>');
    
    console.log(markdown); // Outputs: # Hello, World !
});
</script>
```


### Nodejs

**Install**

```bash
npm install upndown
```

**Use**

```js
var upndown = require('upndown');

var und = new upndown();
var markdown = und.convert('<h1>Hello, World !</h1>');

console.log(markdown); // Outputs: # Hello, World !
```

## Test

### In the browser

Navigate to `test/browser/` inside the **upndown** folder. Browser tests are executed by QUnit.

### Nodejs

To run the tests, simply execute:

```sh
npm test
```

Nodejs tests are executed using mocha.


## Maintainer

**upndown** is produced by [Net Gusto](http://netgusto.com). Drop us a line at <contact@netgusto.com>
