var vstsCalGen = require('./vstsCalGen.js');

module.exports = function (context, req) {
    vstsCalGen(req.query).then(function(calendar) {
        context.res = {
            status: 200,
            body: calendar,
            headers: {
                'Content-Type': 'text/plain'
            }
        };
        context.done();
    }).catch(function (err) {
        console.log('Error: ' + JSON.stringify(err));

        context.res = {
            status: 400,
            body: err.toString(),
            headers: {
                'Content-Type': 'text/plain'
            }
        };
        context.done();
    });;
};