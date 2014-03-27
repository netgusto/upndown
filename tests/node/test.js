var fs = require('fs');

var upndown = require(__dirname + '/../../lib/upndown.js');
var und = new upndown();

var fixturesbasedir = __dirname + '/../fixtures/';

fs.readFile(fixturesbasedir + 'fixtures.json', function (err, data) {
    var failedcount = 0;
    var successcount = 0;
    var fixturesindex = JSON.parse(data);
    for(fixturesectionkey in fixturesindex) {
        var fixturesection = fixturesindex[fixturesectionkey];

        for(fixturekey in fixturesection['fixtures']) {
            var fixture = fixturesection['fixtures'][fixturekey];

            var input = fs.readFileSync(fixturesbasedir + fixture.input, 'utf8');
            var expected = fs.readFileSync(fixturesbasedir + fixture.expected, 'utf8');

            var results = und.convert(input);
            if(expected !== results) {
                failedcount++;
                console.log('\n################################ FAILED:\nExpected:' + expected + '\n\n----------------------------------------\n\nResults:' + results);
            } else {
                successcount++;
            }
        }
    }

    if(failedcount > 0) {
        console.log(failedcount + ' tests failed on a total of ' (failedcount + successcount) + ' tests.');
    } else {
        console.log(successcount + ' tests all OK.');
    }
});