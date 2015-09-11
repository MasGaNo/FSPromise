# FSPromise documentation

FSPromise is based on ES6-Promise polyfill (https://github.com/jakearchibald/es6-promise).

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