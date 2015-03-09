/* globals window */
var LStorage = function () {
    this.cache = {};
    this.storage = this.createStorage();
    
    this.historyName = 'tracker-history';
    this.statusName = 'tracker-status';
    this.taskName = 'tracker-task';
    
    this.initStorages();
};

LStorage.prototype = {
    createStorage: function () {
        var storage = this._storage = window.localStorage,
            self    = this;

        return {
            setItem: function (key, value) {
                var origValue = value;
                if (key) {
                    if (value) {
                        if (value instanceof Object) {
                            try {
                                value = JSON.stringify(value);
                            } catch (e) {
                                value = null;   
                            }
                        }
                        
                        self.cache[key] = origValue;
                        storage.setItem(key, value);   
                    } else {
                        self.cache[key] = null;
                        storage.removeItem(key);
                    }
                }
            },
            
            getItem: function (key) {
                var cachedValue = self.cache[key];
                if (cachedValue) {
                    return cachedValue;   
                }
                
                var data = storage.getItem(key), parsedData;
                
                try {
                    parsedData = JSON.parse(data);
                } catch (e) {
                    parsedData = data;
                }
                
                return parsedData;
            }
        };
    },
    
    //init storages
    
    initStorages: function () {
        this.initHistoryStorage();
        this.initStatusStorage();
        this.initTaskStorage();
    },
    
    initHistoryStorage: function () {
        this.setHistoryValue([]);   //force clear, sync after.
    },
    
    initStatusStorage: function () {
        //do nothing
    },
    
    initTaskStorage: function () {
        //do nothing
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
};