// Type definitions for FSPromise
// Project: https://github.com/MasGaNo/FSPromise
// Definitions by: Norbert TRAN PHAT <https://github.com/MasGaNo>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

// Library documentation : https://github.com/MasGaNo/FSPromise/blob/master/documentation.md

/// <reference path="../es6-promise/es6-promise.d.ts" />
declare class FSPromiseCancelError {
    name: string;
    message: string;
    constructor(message?: string);
}
declare class FSPromise<R> implements Thenable<R> {
    private internalPromise;
    private isAbort;
    /**
     * If you call resolve in the body of the callback passed to the constructor,
     * your promise is fulfilled with result object passed to resolve.
     * If you call reject your promise is rejected with the object passed to resolve.
     * For consistency and debugging (eg stack traces), obj should be an instanceof Error.
     * Any errors thrown in the constructor callback will be implicitly passed to reject().
     */
    constructor(callback: (resolve: (value?: R | Thenable<R>) => void, reject: (error?: any) => void) => void);
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
    then<U>(onFulfilled?: (value: R) => U | Thenable<U>, onRejected?: (error: any) => U | Thenable<U>): FSPromise<U>;
    /**
     * Sugar for promise.then(undefined, onRejected)
     *
     * @param onRejected called when/if "promise" rejects
     */
    catch<U>(onRejected?: (error: any) => U | Thenable<U>): FSPromise<U>;
    /**
     * Trigger an catchable FSPromiseCancelError and stop execution of Promise
     */
    abort(): void;
    /**
     * Make a new promise from the thenable.
     * A thenable is promise-like in as far as it has a "then" method.
     */
    static resolve<R>(value?: R | Thenable<R>): FSPromise<R>;
    /**
     * Make a promise that rejects to obj. For consistency and debugging (eg stack traces), obj should be an instanceof Error
     */
    static reject(error: any): FSPromise<any>;
    /**
     * Make a promise that fulfills when every item in the array fulfills, and rejects if (and when) any item rejects.
     * the array passed to all can be a mixture of promise-like objects and other objects.
     * The fulfillment value is an array (in order) of fulfillment values. The rejection value is the first rejection value.
     */
    static all<R>(promises: (R | Thenable<R>)[]): FSPromise<R[]>;
    /**
     * Make a Promise that fulfills when any item fulfills, and rejects if any item rejects.
     */
    static race<R>(promises: (R | Thenable<R>)[]): FSPromise<R>;

}

/**
 * Activate ES6Promise polyfill
 **/
declare function polyfill(): void;

declare module 'FSPromise' {
    var foo: typeof FSPromise; // Temp variable to reference Promise in local context
    var bar: typeof FSPromiseCancelError;
    module FSPromiseDefinition {
        export var FSPromise: typeof foo;
        export var FSPromiseCancelError: typeof bar;
        export function polyfill(): void;
    }
    export = FSPromiseDefinition;
}