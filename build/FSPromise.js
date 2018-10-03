var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
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
    var FSPromiseError = /** @class */ (function (_super) {
        __extends(FSPromiseError, _super);
        function FSPromiseError(message) {
            var _this = _super.call(this, message) || this;
            _this.name = 'FSPromiseCancelError';
            return _this;
        }
        return FSPromiseError;
    }(Error));
    exports.FSPromiseError = FSPromiseError;
    var FSPromiseCancelError = /** @class */ (function (_super) {
        __extends(FSPromiseCancelError, _super);
        function FSPromiseCancelError(message) {
            return _super.call(this, message) || this;
        }
        return FSPromiseCancelError;
    }(FSPromiseError));
    exports.FSPromiseCancelError = FSPromiseCancelError;
    var Async = false;
    var isNextTick = (typeof (global) === 'object');
    function setAsync(isAsync) {
        Async = isAsync;
    }
    exports.setAsync = setAsync;
    var FSPromise = /** @class */ (function () {
        /**
         * If you call resolve in the body of the callback passed to the constructor,
         * your promise is fulfilled with result object passed to resolve.
         * If you call reject your promise is rejected with the object passed to resolve.
         * For consistency and debugging (eg stack traces), obj should be an instanceof Error.
         * Any errors thrown in the constructor callback will be implicitly passed to reject().
         */
        function FSPromise(callback) {
            var _this = this;
            this._isAbort = false;
            this.internalPromise = new Promise(function (resolve, reject) {
                var doCallback = function () {
                    try {
                        callback(function (value) {
                            if (_this._isAbort) {
                                return reject(_this._abortError);
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
                if (Async) {
                    if (isNextTick) {
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
            this.internalPromise.catch(function (e) {
                /** */
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
                        if (_this._isAbort) {
                            reject(_this._abortError);
                            if (onRejected) {
                                onRejected(_this._abortError);
                            }
                            return;
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
                        if (_this._isAbort) {
                            reject(_this._abortError);
                            if (onRejected) {
                                onRejected(_this._abortError);
                            }
                            return;
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
                if (Async) {
                    if (isNextTick) {
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
            this._abort(new FSPromiseCancelError('Cancel'));
        };
        FSPromise.prototype._abort = function (abortError) {
            this._abortError = abortError;
            this._isAbort = true;
            if (!!this.parentPromise) {
                this.parentPromise._abort(this._abortError);
            }
        };
        Object.defineProperty(FSPromise.prototype, "isAbort", {
            get: function () {
                return this._isAbort;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FSPromise.prototype, "abortError", {
            get: function () {
                return this._abortError;
            },
            enumerable: true,
            configurable: true
        });
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
                        if (promise._isAbort) {
                            reject(promise._abortError);
                            return;
                        }
                        resolve(value);
                    }, function (error) {
                        if (promise._isAbort) {
                            reject(promise._abortError);
                            return;
                        }
                        reject(error);
                    });
                };
                if (Async) {
                    if (isNextTick) {
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
                        if (promise._isAbort) {
                            reject(promise._abortError);
                            return;
                        }
                        resolve(value);
                    }, function (error) {
                        if (promise._isAbort) {
                            reject(promise._abortError);
                            return;
                        }
                        reject(error);
                    });
                };
                if (Async) {
                    if (isNextTick) {
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
    // export module FSPromiseExtended {
    //     export class FSPromiseStream<R> extends FSPromise<R>
    //     {
    //         /**
    //          * Make a Promise that always fulfills when all items complete (by fulfill or rejecting).
    //          */
    //         public static stream<R>(promises: (R | PromiseLike<R[]> | FSPromise<R[]>)[]): FSPromiseStream<R[]> {
    //             let promise = new FSPromiseStream<R>((resolve, reject) => {
    //                 let doCallback = () => {
    //                     const result = []
    //                     let count = 0;
    //                     const max = promises.length;
    //                     function complete(value, index) {
    //                         result[index] = value;
    //                         if (++count >= max) {
    //                             resolve(result);
    //                         }
    //                     }
    //                     promises.forEach((promise, index) => {
    //                         if (!(promise instanceof FSPromise)) {
    //                             throw new FSPromiseError(`FSPromiseRaceExtended.raceResolve accept only PromiseLike`);
    //                         }
    //                         promise.then((value) => {
    //                             if ((promise as FSPromiseStream<R>).isAbort) {
    //                                 reject((promise as FSPromiseStream<R>).abortError);
    //                                 return;
    //                             }
    //                             resolve(value);
    //                         }, (error) => {
    //                             if ((promise as FSPromiseStream<R>).isAbort) {
    //                                 reject((promise as FSPromiseStream<R>).abortError);
    //                                 return;
    //                             }
    //                             error[index] = error;
    //                             if (++count >= max) {
    //                                 reject(error);
    //                             }
    //                         });
    //                     });
    //                 };
    //                 if (Async) {
    //                     if (isNextTick) {
    //                         process.nextTick(doCallback);
    //                     } else {
    //                         setTimeout(doCallback, 0);
    //                     }
    //                 } else {
    //                     doCallback();
    //                 }
    //             });
    //             return promise;
    //         }
    //     }
    //     export class FSPromiseRaceExtended<R> extends FSPromise<R>
    //     {
    //         /**
    //          * Make a Promise that fulfills when first item fulfills, and rejects if all items reject.
    //          */
    //         public static raceResolve<R>(promises: (PromiseLike<R> | FSPromise<R>)[]): FSPromise<R> {
    //             let promise = new FSPromise<R>((resolve, reject) => {
    //                 let doCallback = () => {
    //                     const error = [];
    //                     let count = 0;
    //                     const max = promises.length;
    //                     promises.forEach((promise, index) => {
    //                         if (!(promise instanceof FSPromise)) {
    //                             throw new FSPromiseError(`FSPromiseRaceExtended.raceResolve accept only PromiseLike`);
    //                         }
    //                         promise.then((value) => {
    //                             if ((promise as FSPromiseRaceExtended<R>).isAbort) {
    //                                 reject((promise as FSPromiseRaceExtended<R>).abortError);
    //                                 return;
    //                             }
    //                             resolve(value);
    //                         }, (error) => {
    //                             if ((promise as FSPromiseRaceExtended<R>).isAbort) {
    //                                 reject((promise as FSPromiseRaceExtended<R>).abortError);
    //                                 return;
    //                             }
    //                             error[index] = error;
    //                             if (++count >= max) {
    //                                 reject(error);
    //                             }
    //                         });
    //                     });
    //                 };
    //                 if (Async) {
    //                     if (isNextTick) {
    //                         process.nextTick(doCallback);
    //                     } else {
    //                         setTimeout(doCallback, 0);
    //                     }
    //                 } else {
    //                     doCallback();
    //                 }
    //             });
    //             return promise;
    //         }
    //         /**
    //          * Make a Promise that fulfills when first item rejects, and rejects if all items fullfill.
    //          */
    //         public static raceReject<R>(promises: (PromiseLike<R> | FSPromise<R>)[]): FSPromise<R> {
    //             let promise = new FSPromise<R>((resolve, reject) => {
    //                 let doCallback = () => {
    //                     const error = [];
    //                     let count = 0;
    //                     const max = promises.length;
    //                     promises.forEach((promise, index) => {
    //                         if (!(promise instanceof FSPromise)) {
    //                             throw new FSPromiseError(`FSPromiseRaceExtended.raceResolve accept only PromiseLike`);
    //                         }
    //                         promise.then((error) => {
    //                             if ((promise as FSPromiseRaceExtended<R>).isAbort) {
    //                                 reject((promise as FSPromiseRaceExtended<R>).abortError);
    //                                 return;
    //                             }
    //                             error[index] = error;
    //                             if (++count >= max) {
    //                                 reject(error);
    //                             }
    //                         }, (value) => {
    //                             if ((promise as FSPromiseRaceExtended<R>).isAbort) {
    //                                 reject((promise as FSPromiseRaceExtended<R>).abortError);
    //                                 return;
    //                             }
    //                             resolve(value);
    //                         });
    //                     });
    //                 };
    //                 if (Async) {
    //                     if (isNextTick) {
    //                         process.nextTick(doCallback);
    //                     } else {
    //                         setTimeout(doCallback, 0);
    //                     }
    //                 } else {
    //                     doCallback();
    //                 }
    //             });
    //             return promise;
    //         }
    //     }
    // }
    exports.default = FSPromise;
});
//# sourceMappingURL=FSPromise.js.map