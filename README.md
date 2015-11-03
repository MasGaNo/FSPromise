# FSPromise 0.1.9
==============

This project could be used in production. I wrote this for another project I'm working on right now. Testing, fixes and comments are welcome.

## FSPromise project details
* ~~Extend ES6Promise until full implementation of Promise in all browser.~~
* Use native Promise support
* If you want to use ES6Promise polyfill, you have to do this directly to your application.

--------------------------

It offers the same methods and usage as native Promise, but add a method abort() to stop all Promise chain execution.

It's an UMD module, so you can include it in your CommonJS/AMD project.

## Exemple of usage: 

```
import FSPromise = require('fspromise');
import Promise = FSPromise.FSPromise; // Create an alias

FSPromise.Async = true; // Force async mode for Promise resolver.

let promise = new Promise((resolve, reject) => {
	// do something
});

promise.catch((error) => {
	console.log(error); //FSPromiseCancelError
});

promise.abort();
```
