# upndown

Javascript HTML to Markdown converter, for Node.js and the browser.

[![](https://travis-ci.org/netgusto/upndown.svg?branch=master)](https://travis-ci.org/netgusto/upndown)

[Live demo here](http://upndown.netgusto.com/).

## About

**upndown** converts HTML documents to Markdown documents.

**upndown** is designed to offer a fast, reliable and whitespace perfect conversion for HTML documents.

## Install / Usage

### Browser

**Standard loading**

Download the zip archive on github, unzip, copy in your web folder, and in your HTML:

```html
<script type="text/javascript" src="/assets/upndown/lib/upndown.bundle.min.js"></script>
<script type="text/javascript">

    var und = new upndown();
    und.convert('<h1>Hello, World !</h1>', function(err, markdown) {
        if(err) { console.err(err); }
        else { console.log(markdown); } // Outputs: # Hello, World !
    });

</script>
```

**Using RequireJS**

Download the zip archive on github, unzip, copy in your web folder, and in your HTML:

```html
<script type="text/javascript" src="http://requirejs.org/docs/release/2.1.11/minified/require.js"></script>
<script type="text/javascript">

require.config({
    paths: {
        'upndown': '/assets/upndown/lib/upndown.bundle.min'
    }
});

require(['upndown'], function(upndown) {
    var und = new upndown();
    und.convert('<h1>Hello, World !</h1>', function(err, markdown) {
        if(err) { console.err(err);
        else { console.log(markdown); } // Outputs: # Hello, World !
    });
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
und.convert('<h1>Hello, World !</h1>', function(err, markdown) {
    if(err) { console.err(err);
    else { console.log(markdown); } // Outputs: # Hello, World !
});
```
**Warning: With Node < 0.12.8, you'll have to require a polyfill for the `Promise` functionnality (like https://www.npmjs.com/package/bluebird); see #10 on how to do that.**

## Options

### `decodeEntities`

By default Updown will decode all html entities, so source HTML like this:

```html
<p>I'm an escaped &lt;em&gt;code sample&lt;/em&gt;.</p>
```

Will become:

```
I'm an escaped *code sample*.
```

If your use case does not call for that behavior and you wish HTML entities to
stay encoded, you can pass an option to the constructor:

```js
var und = new upndown({decodeEntities: false})
```

Then just use as normal.

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
