/* globals window, console */
var Logger = function (config) {
    this.name = config.name;
    this.maxDiffTime = config.diff;
    this.leaveErrors = config.leaveErrors;
    this.storage = window.localStorage;
    this.restoreStack();
};

Logger.prototype = {
    info: function (message, data) {
        var now = Date.now();
        
        if (data) {
            try {
                data = JSON.stringify(data);
            } catch (e) {
                data = "" + data;   
            }
        }
        
        this.stack.push({
            type: "info",
            ts: now,
            message: message,
            data: data
        });
        
        if (!this.isProd) {
            console.log("Logger: [" + now + "] " + message + (data ? " LData: [" + data + "]." : ""));
        }
        
        this.filterAndSaveStack();
    },
    
    error: function (error) {
        var data;
        
        if (error.data) {
            try {
                data = JSON.stringify(error.data);
            } catch (e) {
                data = "" + error.data;   
            }
        }
        
        this.stack.push({
            type: "error",
            ts: Date.now(),
            message: error.message,
            stack: error.stack,
            data: data
        });
        
        this.filterAndSaveStack();
    },
    
    restoreStack: function () {
        var stack = this.storage.getItem(this.name);
        
        try {
            stack = JSON.parse(stack);
        } catch (e) {
            stack = [];    
        }
            
        this.stack = stack || [];  
    },
    
    filterAndSaveStack: function () {
        var stack       = this.stack, 
            newStack    = [],
            now         = Date.now(),
            item;
        
        for (var i = 0, iLen = stack.length; i<iLen; i++) {
            item = stack[i];
            
            if ((this.leaveErrors && item.type === "error") || (item.ts + this.maxDiffTime > now)) {
                newStack.push(item);
            }
        }
        
        this.stack = newStack;
        this.storage.setItem(this.name, JSON.stringify(newStack));   
    },
    
    showStackMessages: function () {
        var item, css;
        for (var i=0, iLen = this.stack.length; i<iLen; i++) {
            item = this.stack[i];
            
            if (item.type === "error") {
                css = 'color: red';   
            } else {
                css = 'color: green;';   
            }
            
            console.log("%cLogger[" + item.type + "]: (" + item.ts + ") " + item.message + (item.data ? " LData: [" + item.data + "]." : ""), css);
        }
    }
};