var vstsCalGen = require('./vstsCalGen.js');

module.exports = function (context, req) {
    vstsCalGen().then(function(calendar) {
        context.res = {
            status: 200,
            body: calendar,
            headers: {
                'Content-Type': 'text/plain'
            }
        };
        context.done();
    });
};