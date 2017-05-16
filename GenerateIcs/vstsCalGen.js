var http = require("https");
var rp = require('request-promise');
var ical = require('ical-generator');

var vstsToken = process.env['vsts_token'];
var vstsQueryPath = process.env['vsts_query_path'];
var vstsSiteName = process.env['vsts_site_name'];

module.exports = function() {
    var options = {
        method: 'GET',
        url: vstsQueryPath,
        json: true,
        headers: 
        {
            authorization: 'Basic ' + vstsToken
        }
    };

    console.log('Querying the work item ids');
    
    return rp(options)
        .then(retrieveWorkItems)
        .then(function(rawWorkItems) {
            var workItems = cleanRawWorkItems(rawWorkItems);
            var calendar = getICal(workItems);

            //console.log(calendar);

            return calendar;
        })
        .catch(function (err) {
            console.log('Error!' + err);
        });
}

function retrieveWorkItems(workItemQueryResults) {
        console.log('Querying the work item details');

        var ids = [];
        for(var i=0; i<workItemQueryResults.workItems.length; i++){
            ids.push(workItemQueryResults.workItems[i].id);
        }
    
        var options = { method: 'GET',
            url: 'https://' + vstsSiteName + '.visualstudio.com/DefaultCollection/_apis/wit/workitems',
            qs: { ids: ids.join(','), 'api-version': '1.0' },
            json: true,
            headers: 
            {
                authorization: 'Basic ' + vstsToken
            }
        }
    
    return rp(options)
        .then(function (parsedBody) {
            //The actual array is in the value field
            return parsedBody.value;
        })
        .catch(function (err) {
            // POST failed... 
        });
}

function cleanRawWorkItems(rawWorkItems) {
    var workItems = [];

    for(var i=0; i<rawWorkItems.length; i++) {
        var wi = {};

        wi.title = rawWorkItems[i].fields['System.Title'];
        wi.who = rawWorkItems[i].fields['System.AssignedTo'];
        wi.start = new Date(rawWorkItems[i].fields['TEDCOM.ACTIVITYSTART']);
        wi.duration = rawWorkItems[i].fields['TEDCOM.ACTIVITYDURATIONINDAYSFLOAT'];
        wi.end = new Date(wi.start);
        wi.end.setDate(wi.start.getDate() + wi.duration + 1);

        workItems.push(wi);
    }
    return workItems;
}

function getICal(workItems) {
    var cal = ical({ name: 'Team Calendar'});

    for(var i=0; i<workItems.length; i++) {
        cal.createEvent({
            start: workItems[i].start,
            end: workItems[i].end,
            summary: workItems[i].title,
            description: '',
            location: workItems[i].who
        });
    }

    var calString = cal.toString();
    console.log('Calendar generated successfully with ' + workItems.length + ' entries');

    return calString;
}