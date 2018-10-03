'use strict';

export class FSPromiseError extends Error {
    name: string;

    constructor(message?: string) {
        super(message);
        this.name = 'FSPromiseCancelError';
    }
}

export class FSPromiseCancelError extends FSPromiseError {

    constructor(message?: string) {
        super(message);
    }
}

var Async = false;

var isNextTick = (typeof (global) === 'object');

export function setAsync(isAsync: boolean) {
    Async = isAsync;
}

export class FSPromise<R> implements Promise<R> {

    private internalPromise: Promise<R>;
    private parentPromise: FSPromise<R>;
    private _isAbort: boolean;
    private _abortError: FSPromiseCancelError;

	/**
	 * If you call resolve in the body of the callback passed to the constructor,
	 * your promise is fulfilled with result object passed to resolve.
	 * If you call reject your promise is rejected with the object passed to resolve.
	 * For consistency and debugging (eg stack traces), obj should be an instanceof Error.
	 * Any errors thrown in the constructor callback will be implicitly passed to reject().
	 */
    constructor(callback: (resolve: (value?: R | PromiseLike<R>) => void, reject: (error?: any) => void) => void) {

        this._isAbort = false;

        this.internalPromise = new Promise((resolve, reject) => {

            let doCallback = () => {
                try {
                    callback((value) => {

                        if (this._isAbort) {
                            return reject(this._abortError);
                        }

                        resolve(value);

                    }, (value) => {

                        reject(value);

                    });
                } catch (e) {
                    reject(e);
                }
            };

            if (Async) {
                if (isNextTick) {
                    process.nextTick(doCallback);
                } else {
                    setTimeout(doCallback, 0);
                }
            } else {
                doCallback();
            }
        });

        this.internalPromise.catch((e) => {
            /** */
        })

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
    then<TResult1 = R, TResult2 = never>(onFulfilled?: (value: R) => TResult1 | PromiseLike<TResult1>, onRejected?: (error: any) => TResult2 | PromiseLike<TResult2>): FSPromise<TResult1 | TResult2> {

        let promise = new FSPromise<any>((resolve, reject) => {

            let doCallback = () => {
                this.internalPromise.then((value: R) => {

                    if (this._isAbort) {
                        reject(this._abortError);
                        if (onRejected) {
                            onRejected(this._abortError);
                        }
                        return;
                    }

                    if (!onFulfilled) {
                        resolve(value);
                        return;
                    }

                    try {
                        let returnValue: TResult1 | PromiseLike<TResult1> = onFulfilled(value);
                        resolve(returnValue);
                    } catch (e) {
                        reject(e);
                    }

                }, (error) => {

                    if (this._isAbort) {
                        reject(this._abortError);
                        if (onRejected) {
                            onRejected(this._abortError);
                        }

                        return;
                    }

                    if (!onRejected) {
                        reject(error);
                        return;
                    }

                    try {
                        let returnValue: TResult2 | PromiseLike<TResult2> = onRejected(error);
                        resolve(returnValue);
                    } catch (e) {
                        reject(e);
                    }


                });
            }

            if (Async) {
                if (isNextTick) {
                    process.nextTick(doCallback);
                } else {
                    setTimeout(doCallback, 0);
                }
            } else {
                doCallback();
            }
        });

        promise.parentPromise = this;

        return promise;

    }

    /**
     * Sugar for promise.then(undefined, onRejected)
     *
     * @param onRejected called when/if "promise" rejects
     */
    catch<U>(onRejected?: (error: any) => U | PromiseLike<U>): FSPromise<U> {

        return this.then(null, onRejected) as FSPromise<U>;
    }


    finally(onFinally: () => void): FSPromise<R> {

        this.internalPromise.then(() => {
            onFinally();
        }, () => {
            onFinally();
        });
        return this;
    }

    /**
     * Trigger an catchable FSPromiseCancelError and stop execution of Promise
     */
    abort(): void {
        this._abort(new FSPromiseCancelError('Cancel'));
    }

    private _abort(abortError: FSPromiseCancelError): void {
        this._abortError = abortError;
        this._isAbort = true;
        if (!!this.parentPromise) {
            this.parentPromise._abort(this._abortError);
        }
    }

    protected get isAbort() {
        return this._isAbort;
    }

    protected get abortError() {
        return this._abortError;
    }


    /**
	 * Make a new promise from the PromiseLike.
	 * A PromiseLike is promise-like in as far as it has a "then" method.
	 */
    public static resolve<R>(value?: R | PromiseLike<R>): FSPromise<R> {
        return new FSPromise((resolve, reject) => {
            resolve(value);
        });
    }

    /**
     * Make a promise that rejects to obj. For consistency and debugging (eg stack traces), obj should be an instanceof Error
     */
    public static reject(error: any): FSPromise<any> {
        return new FSPromise((resolve, reject) => {
            reject(error);
        });
    }

    /**
     * Make a promise that fulfills when every item in the array fulfills, and rejects if (and when) any item rejects.
     * the array passed to all can be a mixture of promise-like objects and other objects.
     * The fulfillment value is an array (in order) of fulfillment values. The rejection value is the first rejection value.
     */
    public static all<R>(promises: (R | PromiseLike<R>)[]): FSPromise<R[]> {
        let promise = new FSPromise<R[]>((resolve, reject) => {

            let doCallback = () => {

                Promise.all(promises).then((value) => {

                    if (promise._isAbort) {
                        reject(promise._abortError);
                        return;
                    }

                    resolve(value);

                }, (error) => {

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
                } else {
                    setTimeout(doCallback, 0);
                }
            } else {
                doCallback();
            }

        });

        return promise;
    }

    /**
     * Make a Promise that fulfills when any item fulfills, and rejects if any item rejects.
     */
    public static race<R>(promises: (R | PromiseLike<R>)[]): FSPromise<R> {
        let promise = new FSPromise<R>((resolve, reject) => {

            let doCallback = () => {
                Promise.race(promises).then((value) => {

                    if (promise._isAbort) {
                        reject(promise._abortError);
                        return;
                    }

                    resolve(value);

                }, (error) => {

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
                } else {
                    setTimeout(doCallback, 0);
                }
            } else {
                doCallback();
            }

        });

        return promise;
    }

    readonly [Symbol.toStringTag]: "Promise";
}

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

export default FSPromise;
