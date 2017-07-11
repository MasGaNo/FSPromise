var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    var FSPromiseCancelError = (function (_super) {
        __extends(FSPromiseCancelError, _super);
        function FSPromiseCancelError(message) {
            var _this = _super.call(this, message) || this;
            _this.name = 'FSPromiseCancelError';
            return _this;
        }
        return FSPromiseCancelError;
    }(Error));
    exports.FSPromiseCancelError = FSPromiseCancelError;
    exports.Async = false;
    var FSPromise = (function () {
        /**
         * If you call resolve in the body of the callback passed to the constructor,
         * your promise is fulfilled with result object passed to resolve.
         * If you call reject your promise is rejected with the object passed to resolve.
         * For consistency and debugging (eg stack traces), obj should be an instanceof Error.
         * Any errors thrown in the constructor callback will be implicitly passed to reject().
         */
        function FSPromise(callback) {
            var _this = this;
            this.isAbort = false;
            this.internalPromise = new Promise(function (resolve, reject) {
                var doCallback = function () {
                    try {
                        callback(function (value) {
                            if (_this.isAbort) {
                                reject(new FSPromiseCancelError('Cancel'));
                            }
                            resolve(value);
                        }, function (value) {
                            reject(value);
                        });
                    }
                    catch (e) {
                        reject(e);
                    }
                };
                if (exports.Async) {
                    if (typeof (global) === 'object') {
                        process.nextTick(doCallback);
                    }
                    else {
                        setTimeout(doCallback, 0);
                    }
                }
                else {
                    doCallback();
                }
            });
        }
        /**
         * onFulfilled is called when/if "promise" resolves. onRejected is called when/if "promise" rejects.
         * Both are optional, if either/both are omitted the next onFulfilled/onRejected in the chain is called.
         * Both callbacks have a single parameter , the fulfillment value or rejection reason.
         * "then" returns a new promise equivalent to the value you return from onFulfilled/onRejected after being passed through Promise.resolve.
         * If an error is thrown in the callback, the returned promise rejects with that error.
         *
         * @param onFulfilled called when/if "promise" resolves
         * @param onRejected called when/if "promise" rejects
         */
        FSPromise.prototype.then = function (onFulfilled, onRejected) {
            var _this = this;
            var promise = new FSPromise(function (resolve, reject) {
                var doCallback = function () {
                    _this.internalPromise.then(function (value) {
                        if (_this.isAbort) {
                            reject(new FSPromiseCancelError('Cancel'));
                        }
                        if (!onFulfilled) {
                            resolve(value);
                            return;
                        }
                        try {
                            var returnValue = onFulfilled(value);
                            resolve(returnValue);
                        }
                        catch (e) {
                            reject(e);
                        }
                    }, function (error) {
                        if (_this.isAbort) {
                            reject(new FSPromiseCancelError('Cancel'));
                        }
                        if (!onRejected) {
                            reject(error);
                            return;
                        }
                        try {
                            var returnValue = onRejected(error);
                            resolve(returnValue);
                        }
                        catch (e) {
                            reject(e);
                        }
                    });
                };
                if (exports.Async) {
                    if (typeof (global) === 'object') {
                        process.nextTick(doCallback);
                    }
                    else {
                        setTimeout(doCallback, 0);
                    }
                }
                else {
                    doCallback();
                }
            });
            promise.parentPromise = this;
            return promise;
        };
        /**
         * Sugar for promise.then(undefined, onRejected)
         *
         * @param onRejected called when/if "promise" rejects
         */
        FSPromise.prototype.catch = function (onRejected) {
            return this.then(null, onRejected);
        };
        /**
         * Trigger an catchable FSPromiseCancelError and stop execution of Promise
         */
        FSPromise.prototype.abort = function () {
            this.isAbort = true;
            if (!!this.parentPromise) {
                this.parentPromise.abort();
            }
        };
        /**
         * Make a new promise from the PromiseLike.
         * A PromiseLike is promise-like in as far as it has a "then" method.
         */
        FSPromise.resolve = function (value) {
            return new FSPromise(function (resolve, reject) {
                resolve(value);
            });
        };
        /**
         * Make a promise that rejects to obj. For consistency and debugging (eg stack traces), obj should be an instanceof Error
         */
        FSPromise.reject = function (error) {
            return new FSPromise(function (resolve, reject) {
                reject(error);
            });
        };
        /**
         * Make a promise that fulfills when every item in the array fulfills, and rejects if (and when) any item rejects.
         * the array passed to all can be a mixture of promise-like objects and other objects.
         * The fulfillment value is an array (in order) of fulfillment values. The rejection value is the first rejection value.
         */
        FSPromise.all = function (promises) {
            var promise = new FSPromise(function (resolve, reject) {
                var doCallback = function () {
                    Promise.all(promises).then(function (value) {
                        if (promise.isAbort) {
                            reject(new FSPromiseCancelError('Cancel'));
                            return;
                        }
                        resolve(value);
                    }, function (error) {
                        if (promise.isAbort) {
                            reject(new FSPromiseCancelError('Cancel'));
                            return;
                        }
                        reject(error);
                    });
                };
                if (exports.Async) {
                    if (typeof (global) === 'object') {
                        process.nextTick(doCallback);
                    }
                    else {
                        setTimeout(doCallback, 0);
                    }
                }
                else {
                    doCallback();
                }
            });
            return promise;
        };
        /**
         * Make a Promise that fulfills when any item fulfills, and rejects if any item rejects.
         */
        FSPromise.race = function (promises) {
            var promise = new FSPromise(function (resolve, reject) {
                var doCallback = function () {
                    Promise.race(promises).then(function (value) {
                        if (promise.isAbort) {
                            reject(new FSPromiseCancelError('Cancel'));
                            return;
                        }
                        resolve(value);
                    }, function (error) {
                        if (promise.isAbort) {
                            reject(new FSPromiseCancelError('Cancel'));
                            return;
                        }
                        reject(error);
                    });
                };
                if (exports.Async) {
                    if (typeof (global) === 'object') {
                        process.nextTick(doCallback);
                    }
                    else {
                        setTimeout(doCallback, 0);
                    }
                }
                else {
                    doCallback();
                }
            });
            return promise;
        };
        return FSPromise;
    }());
    exports.FSPromise = FSPromise;
});
//# sourceMappingURL=FSPromise.js.map