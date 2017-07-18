'use strict';

export class FSPromiseCancelError extends Error {
    name: string;

    constructor(message?: string) {
        super(message);
        this.name = 'FSPromiseCancelError';
    }
}

var Async = false;

var isNextTick = (typeof (global) === 'object');

export function setAsync(isAsync: boolean) {
    Async = isAsync;
}

export class FSPromise<R> implements PromiseLike<R> {

    private internalPromise: Promise<R>;
    private parentPromise: FSPromise<R>;
    private isAbort: boolean;

	/**
	 * If you call resolve in the body of the callback passed to the constructor,
	 * your promise is fulfilled with result object passed to resolve.
	 * If you call reject your promise is rejected with the object passed to resolve.
	 * For consistency and debugging (eg stack traces), obj should be an instanceof Error.
	 * Any errors thrown in the constructor callback will be implicitly passed to reject().
	 */
    constructor(callback: (resolve: (value?: R | PromiseLike<R>) => void, reject: (error?: any) => void) => void) {

        this.isAbort = false;

        this.internalPromise = new Promise((resolve, reject) => {

            let doCallback = () => {
                try {
                    callback((value) => {

                        if (this.isAbort) {
                            reject(new FSPromiseCancelError('Cancel'));
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
    then<U>(onFulfilled?: (value: R) => U | PromiseLike<U>, onRejected?: (error: any) => U | PromiseLike<U>): FSPromise<U> {

        let promise = new FSPromise<any>((resolve, reject) => {

            let doCallback = () => {
                this.internalPromise.then((value: R) => {

                    if (this.isAbort) {
                        reject(new FSPromiseCancelError('Cancel'));
                    }

                    if (!onFulfilled) {
                        resolve(value);
                        return;
                    }

                    try {
                        let returnValue: U | PromiseLike<U> = onFulfilled(value);
                        resolve(returnValue);
                    } catch (e) {
                        reject(e);
                    }

                }, (error) => {

                    if (this.isAbort) {
                        reject(new FSPromiseCancelError('Cancel'));
                    }

                    if (!onRejected) {
                        reject(error);
                        return;
                    }

                    try {
                        let returnValue: U | PromiseLike<U> = onRejected(error);
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

        return this.then(null, onRejected);

    }

    /**
     * Trigger an catchable FSPromiseCancelError and stop execution of Promise
     */
    abort(): void {
        this.isAbort = true;
        if (!!this.parentPromise) {
            this.parentPromise.abort();
        }
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

                    if (promise.isAbort) {
                        reject(new FSPromiseCancelError('Cancel'));
                        return;
                    }

                    resolve(value);

                }, (error) => {

                    if (promise.isAbort) {
                        reject(new FSPromiseCancelError('Cancel'));
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

                    if (promise.isAbort) {
                        reject(new FSPromiseCancelError('Cancel'));
                        return;
                    }

                    resolve(value);

                }, (error) => {

                    if (promise.isAbort) {
                        reject(new FSPromiseCancelError('Cancel'));
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
}
