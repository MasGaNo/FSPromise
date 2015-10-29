/// <reference path="scripts/typings/es6-promise/es6-promise.d.ts" />
'use strict';

import ES6Promise = require('es6-promise');
import Promise = ES6Promise.Promise;

export class FSPromiseCancelError {
    name: string;
    message: string;

    constructor(message?: string) {
        this.message = message;
        this.name = 'FSPromiseCancelError';
    }
}

export class FSPromise<R> implements Thenable<R> {

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
    constructor(callback: (resolve: (value?: R | Thenable<R>) => void, reject: (error?: any) => void) => void) {

        this.isAbort = false;

        this.internalPromise = new Promise((resolve, reject) => {

			try {
				callback((value) => {

					if (this.isAbort) {
						reject(new FSPromiseCancelError('Cancel'));
					}

					resolve(value);

				}, (value) => {

					reject(value);

				});
			} catch(e) {
				reject(e);
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
    then<U>(onFulfilled?: (value: R) => U | Thenable<U>, onRejected?: (error: any) => U | Thenable<U>): FSPromise<U> {

        let promise = new FSPromise((resolve, reject) => {

            this.internalPromise.then((value: R) => {

                if (this.isAbort) {
                    reject(new FSPromiseCancelError('Cancel'));
                }

                if (!onFulfilled) {
                    resolve(value);
                    return;
                }

                try {
                    let returnValue: U | Thenable<U> = onFulfilled(value);
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
                    let returnValue: U | Thenable<U> = onRejected(error);
                    resolve(returnValue);
                } catch (e) {
                    reject(e);
                }


            });

        });

        promise.parentPromise = this;

        return promise;
   
    }

    /**
     * Sugar for promise.then(undefined, onRejected)
     *
     * @param onRejected called when/if "promise" rejects
     */
    catch<U>(onRejected?: (error: any) => U | Thenable<U>): FSPromise<U> {

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
	 * Make a new promise from the thenable.
	 * A thenable is promise-like in as far as it has a "then" method.
	 */
    public static resolve<R>(value?: R | Thenable<R>): FSPromise<R> {
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
    public static all<R>(promises: (R | Thenable<R>)[]): FSPromise<R[]> {
        let promise =  new FSPromise((resolve, reject) => {
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
        });

        return promise;
    }

    /**
     * Make a Promise that fulfills when any item fulfills, and rejects if any item rejects.
     */
    public static race<R>(promises: (R | Thenable<R>)[]): FSPromise<R> {
        let promise = new FSPromise((resolve, reject) => {

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

        });

        return promise;
    }
}

/**
 * Activate ES6Promise polyfill
 **/
export function polyfill(): void {
    (<any>ES6Promise).polyfill();
}

