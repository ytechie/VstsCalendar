# VSTS Activities to iCal

This is an [Azure Function](https://azure.microsoft.com/en-us/services/functions/) project to enable Outlook or other calendars to read VSTS activities as an iCal (.ics) feed.

The idea is to take a list of activities in VSTS

![VSTS Activity List](vsts-activities.png)

Add to Outlook:

![](outlook-add-ics.png)

![](outlook-ics-subscription.png)

## Customizing

There are a number of [application settings](https://docs.microsoft.com/en-us/azure/azure-functions/functions-how-to-use-azure-function-app-settings) you'll need to configure within your Auzre Function. [Settings.json](settings.json) will have a list of settings you will need to configure.

Additionally, the code makes a number of assumptions about the configuration of your VSTS instance.

Customize [vstsCalGen.js](GenerateIcs/vstsCalGen.js) to set up the mappings between your fields in the iCal fields.

# URL Parameters

* `calendarname`
* `token`
* `sitename`
* `project`
* `queryid`