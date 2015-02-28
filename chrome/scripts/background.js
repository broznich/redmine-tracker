/* globals LStorage, RServer, chrome, credentials */
var lStorage = new LStorage();

var rserver = new RServer({
    url: credentials.apiHost,
    key: credentials.apiKey
});


var timeProceed = function (data) {
    var time = 0;
        
    for (var i = 0,iL = data.length; i < iL;i++) {
        var el = data[i],
            el2 = data[i+1];

        if (el.action === "idle" || el.action === "paused") {
            if (el2 && el2.action === "working") {
                time += el.ts - el2.ts;
                i++;
            } else {
                continue;
            } 
        } else if (el.action === "working") {
            time += Date.now() - el.ts;
        }
    }
    
    return time;
};

rserver.connect(function(){
    rserver.getTimeEntries(function (data) {
        lStorage.syncTimeData(data.time_entries);
    }); 
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "status") {
        lStorage.saveState(request.status, request.task);
        sendResponse();
    } else if (request.action === "timer") {
        var data = lStorage.getState(),
            dataByTask = lStorage.getDataByTask(request.task),
            dataTotal = lStorage.getAllData();
        
        var time = (data.length > 0 && data[0].action === "idle") ? 0 : timeProceed(data),
            allTime = timeProceed(dataByTask),
            totalTime = timeProceed(dataTotal);
        
        sendResponse({"time" : time, "alltime" : allTime, "total": totalTime});
    } else if (request.action === "history") {
        var tasks = lStorage.getAllTasks(),
            history = [];
            
            tasks.forEach(function (task) {
                history.push({"task" : task, "time" : timeProceed(lStorage.getDataByTask(task))});
            }); 
        
        sendResponse({"history" : history});
    }

    return true;
});
