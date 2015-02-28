/* globals window */
var LStorage = function () {
    this.key = "3e6dc3c2a1ee99159417c1e47642ff3f0294f2af";
    this.storage = this.initStorage();
    
    this.tempDataName = 'ttracker';
    this.historyName = 'tracker-history';
    this.statusName = 'tracker-status';
    this.taskName = 'tracker-task';
    
    this.data = [];
    this.syncData = [];
    
    var stored = this.storage.getItem(this.tempDataName);
    
    if (stored) {
        try {
            stored = JSON.parse(stored);
        } catch (e) {
            stored = null;
        }
        
        if (stored) {
            this.data = stored.sort(function (a, b) { return (a.ts > b.ts) ? 1 : -1; });
        }
    } else {
        this.storage.setItem(this.tempDataName, JSON.stringify(this.data));
    }
};

LStorage.prototype = {
    initStorage: function () {
        var storage = this._storage = window.localStorage;
        
        return {
            setItem: function (key, value) {
                if (key) {
                    if (value) {
                        storage.setItem(key, value);   
                    } else {
                        storage.removeItem(key);
                    }
                }
            },
            
            getItem: function (key) {
                return storage.getItem(key);   
            }
        };
    },
    
    syncTimeData: function (times) { //syn
        var data = [],
            today = this.getToday();

        if (times && times.length > 0) {
            times.forEach(function (time) {
                if (time.spent_on === today && time.issue && time.issue.id) {
                    data.push({
                        issue: time.issue.id,
                        time: time.hours
                    });
                }
            });
            
            this.setHistoryValue(data);
        }
    },
    
    _sync: function () {
        this.storage.setItem(this.tempDataName, JSON.stringify(this.data));
    },
    
    _set: function (data) {
        this.data.push(data);
        this._sync();
    },
    
    getLength: function () {
        return this.data.length;
    },
    
    _get: function () {
        var newData = [];
        for (var i = this.getLength(); i > 0;i--) {
            var el = this.data[i-1];
            newData.push(el);
            
            if (el.action === "idle") {
                break;
            }
        }
        
        return newData;
    },
            
    getToday: function () {
        var date    = new Date(),
            year    = date.getFullYear(),
            day     = date.getDate(),
            month   = date.getMonth() + 1;
    
        if (month < 10) {
            month = "0" + month;
        }
        
        if (day < 10) {
            day = "0" + day;
        }
        
        //return (year + '-' + month + '-' + day);
        return (year + '-' + month + '-27');
    },
    
    getNewDateTs: function () {
        var date = new Date(),
            newDate = new Date(date.toDateString());
    
        return newDate.valueOf();
    },
    
    getDataByTask: function(taskId) {
        var tData = [],
            minTs = this.getNewDateTs();
        
        for (var i = this.getLength(); i > 0;i--) {
            var el = this.data[i-1];
            
            if (el.task === taskId && el.ts > minTs) {
                tData.push(el);
            }
        }
        
        return tData;
    },
    
    getAllData: function () {
        var aData = [],
            minTs = this.getNewDateTs();
        
        for (var i = this.getLength(); i > 0;i--) {
            var el = this.data[i-1];
            
            if (el.ts > minTs) {
                aData.push(el);
            }
        }
        
        return aData;
    },
    
    getAllTasks: function () {
        //@todo переходный период (оставленный таймер или работа всю ночь)
        var tasks = [],
            minTs = this.getNewDateTs();
    
        for (var i = this.getLength(); i > 0;i--) {
            var el = this.data[i-1];
            
            if (el.action === "idle" && el.ts > minTs && !~tasks.indexOf(el.task)) {
                tasks.push(el.task);
            }
        }
        
        return tasks;
    },
    
    getState: function () {
        return this._get();
    },
    
    saveState: function (action, task) {
        this._set({"ts": Date.now(), "action": action, "task": task });
    },
    
    
    
    //simple interface
    
    setTaskValue: function (value) {
        this.storage.setItem(this.taskName, value);
    },
    
    getTaskValue: function () {
        return this.storage.getItem(this.taskName);
    },
    
    setHistoryValue: function (value) {
        this.storage.setItem(this.historyName, value);
    },
    
    getHistoryValue: function () {
        return this.storage.getItem(this.historyName);
    },
    
    setStatusValue: function (value) {
        this.storage.setItem(this.statusName, value);
    },
    
    getStatusValue: function () {
        return this.storage.getItem(this.statusName);   
    },
    
    setTempDataValue: function (value) {
        this.storage.setItem(this.tempDataName, value);   
    },
    
    getTempDataValue: function () {
        return this.storage.getItem(this.tempDataName);
    }
};