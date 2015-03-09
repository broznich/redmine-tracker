var TrackerUtils = function () {};

TrackerUtils.prototype = {
    formatTime: function (ts, nosecond, splitter) {
        var timeInSec = Math.round(ts/1000);
        splitter = splitter || ':'; 
        
        var hours = Math.floor(timeInSec/3600);
        var othersSec = timeInSec % 3600;
        var mins = Math.floor(othersSec/60);
        var secs = othersSec % 60;
            
        var time = hours + splitter + (mins >= 10 ? mins : '0' + mins);
        
        if (!nosecond) {
            time += splitter + (secs >= 10 ? secs : '0' + secs);
        }
        
        return time;
    },
    
    getHours: function (ts) {
        var now = Date.now(),
            diff = now - ts;
        
        if (diff < 0) {
            return 0;
        }
        
        var timeInSec = Math.round(diff/1000);
        
        return +((timeInSec/3600).toFixed(2));
    }
};