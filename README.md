# FSPromise 0.1.0
==============

This project is not ready for use in production. It's still under heavy development. I wrote this for another project I work on right now, but its still far from being stable. Testing are fixes and comments are welcome.

## FSPromise project details
* Extend ES6Promise until full implementation of Promise in all browser.

future:
* Add a native Promise support

--------------------------

It offers the same methods and usage, but add a method abort() to stop all Promise chain execution.

It's an UMD module, so you can include it in your CommonJS/AMD project.

## Exemple of usage: 

```
import FSPromise = require('fspromise');
import Promise = FSPromise.FSPromise; // Create an alias

let promise = new Promise((resolve, reject) => {
	// do something
});

promise.catch((error) => {
	console.log(error); //FSPromiseCancelError
});

promise.abort();
```