var http = require("https");
var rp = require('request-promise');
var ical = require('ical-generator');
var moment = require('moment');

//Query param overridable
var vstsToken;
var vstsSiteName;
var vstsProjectName;
var calName;

module.exports = function(queryParams) {
    var queryId = queryParams.queryid || process.env['vsts_query_id'];
    calName = queryParams.calendarname || 'VSTS Activities';
    vstsToken = queryParams.token || process.env['vsts_token'];
    vstsSiteName = queryParams.sitename || process.env['vsts_site_name'];
    vstsProjectName = queryParams.project || process.env['vsts_project_name'];

    vstsToken = new Buffer(':' + vstsToken).toString('base64');

    console.log('Querying the work item ids using query '+  queryId);
    
    var vstsQueryPath = 'https://' + vstsSiteName + '.visualstudio.com/DefaultCollection/' + vstsProjectName + '/_apis/wit/wiql/' + queryId;

    var options = {
        method: 'GET',
        url: vstsQueryPath,
        json: true,
        headers: 
        {
            authorization: 'Basic ' + vstsToken
        }
    };

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
        wi.start = moment.utc(rawWorkItems[i].fields['TEDCOM.ACTIVITYSTART']).startOf('day').toDate();
        wi.duration = rawWorkItems[i].fields['CSEngineering.ActivityDuration'];
        wi.end = moment.utc(wi.start).add(wi.duration, 'days').toDate();
        wi.url = 'https://' + vstsSiteName + '.visualstudio.com/DefaultCollection/' + encodeURIComponent(vstsProjectName)
            + '/_workItems?id=' + rawWorkItems[i].id;
        wi.shortDescription = rawWorkItems[i].fields['TEDCOM.SHORTDESCRIPTION'];

        workItems.push(wi);
    }
    return workItems;
}

function getICal(workItems) {
    var cal = ical({ name: calName});

    for(var i=0; i<workItems.length; i++) {
        cal.createEvent({
            start: workItems[i].start,
            end: workItems[i].end,
            summary: workItems[i].title,
            description: cleanDescription(workItems[i].shortDescription) +  '\n\nOriginal workitem: ' + workItems[i].url,
            location: workItems[i].who,
            allDay: true
        });
    }

    var calString = cal.toString();
    console.log('Calendar generated successfully with ' + workItems.length + ' entries');

    return calString;
}

function cleanDescription(rawDescription) {
    var clean = rawDescription || '';

    try {
        clean = clean
            .replace(/<(br|\/p|\/br)>/g, "\n\n") //add breaks
            .replace(/<.*?>/g, '') //remove unknown tags
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&');
    } catch(e) {
        return rawDescription;
    }

    return clean;
}