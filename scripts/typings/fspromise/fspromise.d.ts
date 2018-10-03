export declare class FSPromiseError extends Error {
    name: string;
    constructor(message?: string);
}
export declare class FSPromiseCancelError extends FSPromiseError {
    constructor(message?: string);
}
export declare function setAsync(isAsync: boolean): void;
export declare class FSPromise<R> implements Promise<R> {
    private internalPromise;
    private parentPromise;
    private _isAbort;
    private _abortError;
    /**
     * If you call resolve in the body of the callback passed to the constructor,
     * your promise is fulfilled with result object passed to resolve.
     * If you call reject your promise is rejected with the object passed to resolve.
     * For consistency and debugging (eg stack traces), obj should be an instanceof Error.
     * Any errors thrown in the constructor callback will be implicitly passed to reject().
     */
    constructor(callback: (resolve: (value?: R | PromiseLike<R>) => void, reject: (error?: any) => void) => void);
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
    then<TResult1 = R, TResult2 = never>(onFulfilled?: (value: R) => TResult1 | PromiseLike<TResult1>, onRejected?: (error: any) => TResult2 | PromiseLike<TResult2>): FSPromise<TResult1 | TResult2>;
    /**
     * Sugar for promise.then(undefined, onRejected)
     *
     * @param onRejected called when/if "promise" rejects
     */
    catch<U>(onRejected?: (error: any) => U | PromiseLike<U>): FSPromise<U>;
    finally(onFinally: () => void): FSPromise<R>;
    /**
     * Trigger an catchable FSPromiseCancelError and stop execution of Promise
     */
    abort(): void;
    private _abort;
    protected readonly isAbort: boolean;
    protected readonly abortError: FSPromiseCancelError;
    /**
     * Make a new promise from the PromiseLike.
     * A PromiseLike is promise-like in as far as it has a "then" method.
     */
    static resolve<R>(value?: R | PromiseLike<R>): FSPromise<R>;
    /**
     * Make a promise that rejects to obj. For consistency and debugging (eg stack traces), obj should be an instanceof Error
     */
    static reject(error: any): FSPromise<any>;
    /**
     * Make a promise that fulfills when every item in the array fulfills, and rejects if (and when) any item rejects.
     * the array passed to all can be a mixture of promise-like objects and other objects.
     * The fulfillment value is an array (in order) of fulfillment values. The rejection value is the first rejection value.
     */
    static all<R>(promises: (R | PromiseLike<R>)[]): FSPromise<R[]>;
    /**
     * Make a Promise that fulfills when any item fulfills, and rejects if any item rejects.
     */
    static race<R>(promises: (R | PromiseLike<R>)[]): FSPromise<R>;
    readonly [Symbol.toStringTag]: "Promise";
}
export default FSPromise;
