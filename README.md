Application State Binder
===================

Javascript library to reveal the application state in the hash of the url.
There are flags, options, json data and custom state entries
([view demo sources](https://github.com/stefandollase/app-state-binder-js/tree/gh-pages/demos/) | 
[view demo](https://stefandollase.github.io/app-state-binder-js/)).

### Example

Imagine an application that draws something on a canvas. Such an application can offer the user an option to choose between a dark theme and a light theme. Another option may be whether to show or hide a grid on the canvas. You can implement it like this:

```js
var binder = new AppStateBinder({
  theme : {
    type : "option",
    options : [ "light", "dark" ],
    changed : function(dataValue) {
      var theme = "light";
      if (dataValue === false) { 
        // no theme was set, use default theme
      } else {
        theme = dataValue;
      }
      console.log("refresh canvas with " + theme + " theme");
    }
  },
  showGrid : {
    type : "flag",
    changed : function() {
      if (dataValue) {
        console.log("drawing grid");
      } else {
        console.log("not drawing grid");
      }
    }
  }
});
```

To offer the user a way to change the application state you can put these links like these on your website:

```html
<a href="#light|showGrid">Select Light Theme with Grid</a>
<a href="#dark">Select Dark Theme without Grid</a>
```

To change the application state via the code you can use these functions. The changed state is immediately reflected in the url hash.

```js
binder.set("theme", "light");
binder.set("theme", "dark");

binder.unset("theme"); // causes theme state entry to be set to false

binder.set("showGrid", true);
binder.set("showGrid", false);

binder.toggle("showGrid");
```

To read the application state, use these functions.

```js
binder.get("theme");
binder.isSet("showGrid");
```

### Use it on your website

```html
<script src="https://stefandollase.github.io/app-state-binder-js/cdn/1.1/app-state-binder-js.min.js"></script>
```

### License

The library is licensed under the MIT License.
