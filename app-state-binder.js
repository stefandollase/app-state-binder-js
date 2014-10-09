/*
 * The MIT License (MIT)
 * 
 * Copyright (c) 2014 Stefan Dollase
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

function AppStateBinder(parameters) {
    var _this = this;
    this.ignoreExportCurrentState = false;
    this.ignoreFireChangedCounter = 0;
    this.appState = {};
    this.setupAppState(parameters);
    this.registerHashChanged(function() {
	_this.hashChanged(_this);
    });
    this.ignoreFireChanged(true);
    this.hashChanged();
    this.ignoreFireChanged(false);
}
AppStateBinder.prototype.registerHashChanged = function(callback) {
    if (!('onhashchange' in window)) {
	var oldHref = location.href;
	window.setInterval(function() {
	    var newHref = location.href;
	    if (oldHref !== newHref) {
		var _oldHref = oldHref;
		oldHref = newHref;
		callback.call(window, {
		    'type' : 'hashchange',
		    'newURL' : newHref,
		    'oldURL' : _oldHref
		});
	    }
	}, 100);
    } else if (window.addEventListener) {
	window.addEventListener("hashchange", callback, false);
    } else if (window.attachEvent) {
	window.attachEvent("onhashchange", callback);
    }
}
AppStateBinder.prototype.getHash = function() {
    var hash = window.location.hash;
    if (hash.length > 0) {
	if (hash.substring(0, 1) === "#") {
	    hash = hash.substring(1);
	}
    } else {
	hash = "";
    }
    return hash;
}
AppStateBinder.prototype.hashChanged = function() {
    if (this.ignoreChangeOnce) {
	this.ignoreChangeOnce = false;
	return;
    }
    this.parseHash();
}
AppStateBinder.prototype.parseHash = function() {
    this.ignoreExportCurrentState = true;
    this.ignoreFireChanged(true);
    var hash = this.getHash();
    var hashArray = hash.split("|");
    var toUnset = this.getNames();
    var toSet = {};
    for (var i = 0; i < hashArray.length; i++) {
	if (hashArray[i] === "") {
	} else {
	    var result = this.parseHashEntry(hashArray[i]);
	    if (result !== false) {
		delete toUnset[result];
	    }
	}
    }
    for ( var name in toUnset) {
	this.unset(name);
    }
    this.ignoreFireChanged(false);
    this.ignoreExportCurrentState = false;
    this.fireChangedForCache();
}
AppStateBinder.prototype.getNames = function() {
    var result = {};
    for ( var name in this.appState) {
	result[name] = true;
    }
    return result;
}
AppStateBinder.prototype.parseHashEntry = function(hashEntry) {
    var dataValue;
    for ( var name in this.appState) {
	dataValue = this.appState[name].parse(hashEntry);
	if (dataValue !== false) {
	    this.set(name, dataValue);
	    return name;
	}
    }
    return false;
}
AppStateBinder.prototype.exportCurrentState = function() {
    if (this.ignoreExportCurrentState) {
	return;
    }
    var result = "";
    for ( var name in this.appState) {
	if (this.appState[name].stringValue !== false) {
	    result += "|" + this.appState[name].stringValue;
	}
    }
    var newHash = result.substring(1);
    if (newHash === this.getHash()) {
	this.ignoreChangeOnce = false;
    } else {
	this.ignoreChangeOnce = true;
	window.location.hash = newHash;
    }
}
AppStateBinder.prototype.fireChangedForAll = function() {
    for ( var name in this.appState) {
	this.fireChanged(name);
    }
}
AppStateBinder.prototype.fireChangedForCache = function() {
    for ( var name in this.fireChangedCache) {
	this.fireChanged(name);
    }
}
AppStateBinder.prototype.fireChanged = function(name) {
    if (this.ignoreFireChangedCounter > 0) {
	this.fireChangedCache[name] = true;
    } else {
	this.appState[name].changed(this.get(name));
    }
}
AppStateBinder.prototype.set = function(name, dataValue, fireIfUnchanged) {
    var oldStringValue = this.appState[name].stringValue;
    this.appState[name].dataValue = dataValue;
    this.appState[name].stringValue = this.appState[name].stringify(dataValue);
    if (fireIfUnchanged || (oldStringValue !== this.appState[name].stringValue)) {
	this.exportCurrentState();
	this.fireChanged(name);
    }
}
AppStateBinder.prototype.toggle = function(name) {
    if (this.appState[name].flag !== undefined) {
	this.set(name, !this.isSet(name));
    } else if (this.appState[name].options !== undefined) {
	var options = this.appState[name].options;
	var index = this.indexOf(options, this.get(name));
	var newIndex = (index + 1) % options.length;
	this.set(name, options[newIndex]);
    } else {
	throw "cannot toggle " + name;
    }
}
AppStateBinder.prototype.unset = function(name) {
    var oldStringValue = this.appState[name].stringValue;
    this.appState[name].dataValue = false;
    this.appState[name].stringValue = false;
    if (oldStringValue !== this.appState[name].stringValue) {
	this.fireChanged(name);
	this.exportCurrentState();
    }
}
AppStateBinder.prototype.isSet = function(name) {
    return (this.appState[name].dataValue !== false);
}
AppStateBinder.prototype.get = function(name, defaultValue) {
    if (this.isSet(name)) {
	return this.appState[name].dataValue;
    } else if (defaultValue === undefined) {
	return false;
    } else {
	return defaultValue;
    }
}
AppStateBinder.prototype.setupAppState = function(parameters) {
    for ( var name in parameters) {
	if (parameters[name].flag) {
	    this.appState[name] = this.createFlag(name, parameters[name].flag,
		    parameters[name].changed);
	} else if (parameters[name].option) {
	    this.appState[name] = this.createOption(name,
		    parameters[name].option, parameters[name].changed)
	} else if (parameters[name].json) {
	    this.appState[name] = this.createJSON(name,
		    parameters[name].changed)
	} else {
	    this.appState[name] = {
		name : name,
		dataValue : false,
		stringValue : false,
		changed : parameters[name].changed,
		parse : parameters[name].parse,
		stringify : parameters[name].stringify
	    }
	}
    }
}
AppStateBinder.prototype.createFlag = function(name, flag, changed) {
    return {
	name : name,
	flag : flag,
	dataValue : false,
	stringValue : false,
	changed : changed,
	parse : function(stringValue) {
	    if (stringValue === flag) {
		return true;
	    } else {
		return false;
	    }
	},
	stringify : function(dataValue) {
	    if (dataValue === true) {
		return flag;
	    } else {
		return false;
	    }
	}
    }
}
AppStateBinder.prototype.createOption = function(name, options, changed) {
    return {
	name : name,
	options : options,
	dataValue : false,
	stringValue : false,
	changed : changed,
	parse : function(stringValue) {
	    for (var i = 0; i < options.length; i++) {
		if (stringValue === options[i]) {
		    return stringValue;
		}
	    }
	    return false;
	},
	stringify : function(dataValue) {
	    for (var i = 0; i < options.length; i++) {
		if (dataValue === options[i]) {
		    return dataValue;
		}
	    }
	    return false;
	}
    }
}
AppStateBinder.prototype.createJSON = function(name, changed) {
    return {
	name : name,
	dataValue : false,
	stringValue : false,
	changed : changed,
	parse : function(stringValue) {
	    try {
		return JSON.parse(stringValue);
	    } catch (err) {
		return false;
	    }
	},
	stringify : function(dataValue) {
	    if (dataValue === false) {
		return false;
	    } else {
		return JSON.stringify(dataValue);
	    }
	}
    }
}
AppStateBinder.prototype.indexOf = function(arr, element) {
    for (var i = 0; i < arr.length; i++) {
	if (arr[i] === element) {
	    return i;
	}
    }
    return -1;
}
AppStateBinder.prototype.ignoreFireChanged = function(ignore) {
    if (ignore) {
	if (this.ignoreFireChangedCounter === 0) {
	    this.fireChangedCache = {};
	}
	this.ignoreFireChangedCounter++;
    } else {
	this.ignoreFireChangedCounter--;
    }
}
