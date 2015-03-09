/* globals chrome, window, credentials, LStorage, RServer, Logger, TrackerUtils */
var BackgroundService = function (credentials) {
    var self    = this,
        start   = Date.now();
    
    this.access = credentials;
    this.data = {};
    
    this.logger = new Logger({
        name: "rmtt-log",
        diff: 600000,
        leaveErrors: true,
        isProd: credentials.isProd
    });
    
    this.ls = new LStorage();
    this.utils = new TrackerUtils();
    this.rmService = new RServer(credentials);

    this.attachEvents();
    this.log("Background service started");
    
    this.syncData(function(){
        self.log("Background service is ready", { time: Date.now() - start });
        self.ready = true;
        
        self.changeBaseIcon(self.getStatusData());
        self.startUpdateWatcher();
    });
};

BackgroundService.prototype = {
    log: function (message, data) {
        this.logger.info(message, data);
    },
    
    attachEvents: function () {
        var self    = this,
            message = '';
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            if (!self.ready) {
                message = 'Background service isn\'t ready';
                sendResponse({ error: true, message: message });
                self.logger.error({ message: message });
            } else {
                var method = self.generateMethod(request.action);

                if (method) {
                    method = self[method];
                    if (method && method instanceof Function) {
                        method.call(self, request.data, sendResponse);
                        return true; //need for async requests (https://developer.chrome.com/extensions/runtime#event-onMessage);
                    } else {
                        message = 'Method "' + method + '"isn\'t allowed';
                        sendResponse({ error: true, message: message });
                        self.logger.error({ message: message });
                    }
                }
            }
        });
    },
    
    generateMethod: function (text) {
        var data = text.split('-'),
            method = '';
        
        method = (data.map(function (elem) { return (elem.charAt(0).toUpperCase() + elem.substr(1)); })).join('');        
        return "request" + method + "Action";
    },
    
    prepareHistory: function (data) {
        var newData     = [], 
            self        = this,
            tempData    = {},
            tempItem, 
            item,
            hours,
            time,
            id;

        if (data instanceof Array) {
            for (var i = 0, iLen = data.length; i < iLen; i++) { 
                item        = data[i];
                id          = item.issue.id;
                tempItem    = tempData[id];
                hours       = +item.hours;
                time        = Date.parse(item.updated_on);
                
                if (tempItem) {
                    tempItem.hours += hours;
                    tempItem.last = time > tempItem.last ? time : tempItem.last;
                } else {
                    tempItem = {
                        last    : time,
                        task    : id,
                        hours   : hours
                    };
                    
                    tempData[id] = tempItem;
                    newData.push(tempItem);
                }
            }
            
            newData = newData.sort(function (a, b) { return a > b ? 1 : -1; });
        }
        
        return newData;
    },
    
    parseDate: function (date) {
        return Date.parse(date);
    },
    
    syncData: function (callback) {
        var self = this;
        this.rmService.connect(function () {
            self.requestHistoryData(function (error, data) {
                if (error) {
                    throw Error("Error sync data");
                } else {
                    //prepare and save
                    self.ls.setHistoryValue(self.prepareHistory(data.time_entries));
                    self.log("History data synced");
                    callback();
                }
            });
        });
    },
    
    requestAllDataAction: function (data, response) {
        this.logger.info("requestAllData", data);
        var respData = {
            task    : this.getTaskData(),
            status  : this.getStatusData(),
            history : this.getHistoryData(),
        };
        
        response(respData);
    },
    
    requestStatusAction: function(data, response) {
        var self = this;
        this.logger.info("requestStatus", data);
        var failResponse = function () {
            var message = "Incorrect status request";
            self.logger.error({ message: message, data: data });
            response({ error: true, message: message });
        };
        
        if (!data.status) {
            failResponse();
        } else {
            var status  = this.getStatusData() || "idle",
                task    = this.getTaskData();
            
            var afterChange = function () {
                self.setStatusData(data.status);
                self.setTaskData(task);
                
                self.log("status request is ok", { task: task, status: data.status });
                self.changeBaseIcon(data.status);
                response({ task: task, status: data.status });   
            };

            switch (data.status) {
                case "idle":
                    if (status !== "idle" && task && task.id) {
                        var hours   = task.hours + (task.ts ? this.utils.getHours(task.ts) : 0),
                            id      = task.id;
                        
                        this.resetTaskData(task);
                        this.saveTask(id, hours, afterChange);
                    } else {
                        failResponse();   
                    }
                    break;
                case "paused":
                    if (status === "works" && task && task.ts) {
                        task.hours += this.utils.getHours(task.ts);
                        task.ts = null;
                        afterChange();
                    } else {
                        failResponse();   
                    }
                    break;
                case "works":
                    if (status !== "works" && data.task) {
                        task.ts = Date.now();
                        task.id = data.task;
                        afterChange();
                    } else {
                        failResponse();   
                    }
                    break;
            }
        }
    },
    
    changeBaseIcon: function (status) {
        var icon;
        
        switch (status) {
            case "paused":
                icon = 'icons/base/38_paused.png'; break;
            case "works":
                icon = 'icons/base/38_works.png';break;
            case "idle":
            default:
                icon = 'icons/base/38_idle.png';break;
        }
        chrome.browserAction.setIcon({path: icon});
    },
    
    saveTask: function (task, hours, callback) {
        var self = this;
        if (hours > 0.01) {
            var params = {
                task    : task,
                hours   : hours                
            };
            
            this.rmService.setTimeEntry(params, function () {
                self.log("time entry saved successfully", params);
                callback();
            });
        } else {
            callback();
        }
    },
    
    resetTaskData: function (task) {
        task.ts     = 0;
        task.hours  = 0;
        task.id     = null;
        
        return task;
    },
    
    setTaskData: function (task) {
        this.ls.setTaskValue(task);
    },
    
    getTaskData: function () {
        var task = this.ls.getTaskValue();
        return task || this.resetTaskData({});
    },
    
    setStatusData: function (status) {
        this.ls.setStatusValue(status);  
    },
    
    getStatusData: function () {
        return this.ls.getStatusValue();   
    },
    
    getHistoryData: function () {
        return this.ls.getHistoryValue();   
    },
    
    requestHistoryData: function (callback) {
        this.rmService.getTimeEntries(callback);   
    },
    
    startUpdateWatcher: function () {
        this.startHistoryUpdater();
    },
    
    startHistoryUpdater: function () {
        var self = this;
        this.historyUpdateIntervalLock = false;
        this.historyUpdateInterval = window.setInterval(function () {
            if (self.historyUpdateIntervalLock) {
                return false;
            }            
            self.log("Start history update by watcher");
            
            self.historyUpdateIntervalLock = true;
        
            self.requestHistoryData(function (error, data) {
                if (error) {
                    self.logger.error(error);
                } else {
                    self.ls.setHistoryValue(self.prepareHistory(data.time_entries));
                }
                
                self.historyUpdateIntervalLock = false;
            });
            self.log("History is updated");
        }, 120000);   
    }
};

var bgService = new BackgroundService(credentials);