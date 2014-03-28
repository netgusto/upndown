'use strict';

var fs = require('fs');
var upndown = require(__dirname + '/../lib/upndown.js');

var fixturesbasedir = __dirname + '/fixtures/';
var und = new upndown();

var fixturesjson = fs.readFileSync(fixturesbasedir + 'fixtures.json', 'utf8');
var fixturesindex = JSON.parse(fixturesjson.toString());

var fixturesectionkey;
var fixturekey;

for(fixturesectionkey in fixturesindex) {
    var fixturesection = fixturesindex[fixturesectionkey];

    describe(fixturesection.section, function () {
        for(fixturekey in fixturesection['fixtures']) {
            var fixture = fixturesection['fixtures'][fixturekey];

            var input = fs.readFileSync(fixturesbasedir + fixture.input, 'utf8');
            var expected = fs.readFileSync(fixturesbasedir + fixture.expected, 'utf8');

            var results = und.convert(input);

            var fixturetitle = fixture.input.split('/').pop().replace(/\.html$/, '');

            it(fixturetitle, function () {
                results.should.equal(expected);
            });
        }
    });
}