'use strict';

var fs = require('fs');
var upndown = require(__dirname + '/../lib/upndown.node.js');
var assert = require("assert")

var fixturesbasedir = __dirname + '/fixtures/';

var fixturesjson = fs.readFileSync(fixturesbasedir + 'fixtures.json', 'utf8');
var fixturesindex = JSON.parse(fixturesjson.toString());

var fixturesectionkey;
var fixturekey;

for(fixturesectionkey in fixturesindex) {
    var fixturesection = fixturesindex[fixturesectionkey];

    describe(fixturesection.section, function () {
        for(fixturekey in fixturesection['fixtures']) {
            var fixture = fixturesection['fixtures'][fixturekey];

            var fixturetitle = fixture.input.split('/').pop().replace(/\.html$/, '');
            var input = fs.readFileSync(fixturesbasedir + fixture.input, 'utf8');
            var expected = fs.readFileSync(fixturesbasedir + fixture.expected, 'utf8');

            it(fixturetitle, (function(input, expected) {

                return function(done) {

                    var und = new upndown();
                    und.convert(input, function(err, markdown) {
                        if(err) { return done(err); }

                        markdown.should.equal(expected);
                        done();
                    }, { keepHtml: true });
                };

            })(input, expected));
        }
    });
}

// Special Tests for Distinct Init Options:
describe("Custom Init Options", function(){
    it("Should allow *not* decoding escaped HTML entities",function(done){
        var und = new upndown({decodeEntities: false});
        var input = "<code>&lt;em&gt;I'm an escaped code sample&lt;/em&gt;</code>"
        var expected = "`&lt;em&gt;I'm an escaped code sample&lt;/em&gt;`"
        und.convert(input,function(err,markdown){
            if(err){ return done(err); }
            markdown.should.equal(expected);
            done()
        });
    });
});
