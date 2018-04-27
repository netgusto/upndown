var upndown = require('upndown');

var und = new upndown();
und.convert('<h1>Hello, World !</h1>', function(err, markdown) {
    if(err) { console.err(err);}
    else { console.log(markdown); } // Outputs: # Hello, World !
});
