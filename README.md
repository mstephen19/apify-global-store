# Apify Global Store

[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

![npm](https://img.shields.io/npm/v/apify-global-store)

![npm](https://img.shields.io/npm/dw/apify-global-store)

## What's new in `1.1.3`?

-   Addition of `addMethod` and `useMethod` (experimental)
-   `pushPathToDataset` method name shortened to `pushPath`
-   Support for array formatted paths in `setPath`, `deletePath`, and `pushPath`
-   Bug fixes for `pushPath`, `summon`, and `summonAll`
-   Improve debug logs
-   Improve JSDoc

## Installation

```
npm install apify-global-store
```

## About

This is a simple and lightweight API which allows you to easily create and manage multiple global stores local to an actor's run. By using `apify-global-store`, you completely remove the need to pass large and complex data through requests. Simplify the process of storing incomplete data that isn't yet ready to be pushed to the dataset with `GlobalStore`!

State persistence, actor migrations, and race conditions are automatically handled under the hood, so the global state will not be lost on migrations or graceful aborts.

## Table of Contents:

-   [Importing](#importing)
-   [Example](#example)
-   [General Usage](#general-usage)
    -   [`await GlobalStore.init()`](#await-globalstoreinit)
    -   [`store.state`](#storestate)
    -   [`store.info`](#storeinfo)
-   [Mutating State](#mutating-state)
    -   [`store.set()`](#storeset)
    -   [`store.setPath()`](#storesetpath)
    -   [`store.deletePath()`](#storedeletepath)
    -   [`store.addReducer()`](#storeaddreducer)
    -   [`store.setWithReducer()`](#storesetwithreducer)
-   [Data Management](#data-management)
    -   [`await store.pushPath()`](#await-storepushpath)
    -   [`store.dump()`](#storedump)
    -   [`await store.backup()`](#await-storebackup)
    -   [`await store.forceSave()`](#await-storeforcesave)
-   [Static Methods](#static-methods)
    -   [`GlobalStore.summon()`](#globalstoresummon)
    -   [`GlobalStore.summonAll()`](#globalstoresummonall)
    -   [`GlobalStore.dumpAll()`](#globalstoredumpall)
-   [Experimental Methods](#experimental-methods)
    -   [`GlobalStore.addMethod()`](#globalstoreaddmethod)
    -   [`GlobalStore.useMethod()`](#globalstoreusemethod)
-   [Best Practices](#best-practices)
    -   [Best practices with store management](#best-practices-with-store-management)
    -   [Best practices when using a reducer](#best-practices-when-using-a-reducer)
-   [Storage](#storage)
-   [Available Types](#available-types)
-   [License](#license)

## Importing

ES6+

```TypeScript
import { GlobalStore } from 'apify-global-store'
```

ES5-

```JavaScript
const { GlobalStore } = require('apify-global-store')
```

## Example

```JavaScript
const Apify = require('apify');
const { GlobalStore } = require('apify-global-store');

Apify.main(async () => {
    const store = await GlobalStore.init();

    console.log(store.state); // -> {}

    store.set((prev) => {
        return {
            ...prev,
            message: 'hello'
        }
    })

    console.log(store.state); // -> { message: 'hello' }

    store.set((prev) => {
        return {
            ...prev,
            message2: 'world'
        }
    })

    console.log(store.state); // -> { message: 'hello', message2: 'world' }

    await store.pushPath('message')
});
```

## General Usage

### `await GlobalStore.init()`

(**initializeOptions?**: _[InitializeOptions](#available-types)_ => `Promise<GlobalStore>`

| Argument          | Type              | Required  | Description                                                             |
| ----------------- | ----------------- | --------- | ----------------------------------------------------------------------- |
| initializeOptions | InitializeOptions | **false** | Configure the store's name, its initial state, and where it is located. |

```TypeScript
interface InitializeOptions {
    name?: string; // The name of the store to use
    initialState?: Record<string, unknown>; // The initial state to start with
    cloud?: boolean; // Whether or not to keep the store on the cloud, or locally to the actor's run
    debug?: boolean; // Whether or not to display helpful debug messages
}
```

`GlobalStore` doesn't have a public constructor. Its `init()` method runs necessary asynchronous tasks prior to calling on its private constructor.

**Usage:**

```JavaScript
const store = await GlobalStore.init({
    name: 'clothing-store',
    initialState: {
        websites: [],
        errors: [],
    },
    cloud: true,
    debug: true
});
```

If the store already has a previous state stored within the Key-Value store (in the situation that a migration/abort occurred), then the `initialState` option will have no effect.

You can only pass letters and "-" within the string, otherwise an error will be thrown (to follow naming conventions). The provided store name will _always_ be forced into uppercase.

> **Note:** A name for a store can only be used once. That includes the default name of `GLOBAL-STORE`. If the `cloud` option is set to true, then the global store will be stored in the cloud on your Apify account under "Storages" within a named Key-Value store called `CLOUD-GLOBAL-STORES`.

### `store.state`

**Usage:**

```JavaScript
const { myValue } = store.state;
```

A getter method that returns the current state object of the store.

### `store.info`

```JavaScript
const { sizeInBytes, lastModified } = store.info;
```

An object containing information about the contents of the store. Example:

```JavaScript
{
    sizeInBytes: 17,
    lastModified: '2022-03-18T15:39:45.041Z',
    globalStoreVersion: '1.0.9',
    type: 'LOCAL'
}
```

## Mutating State

### `store.set()`

(**setStateParam**: _[SetStateFunctionCallBack](#available-types)_) => `void`

| Argument      | Type                     | Required | Description                                                                                                                                      |
| ------------- | ------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| setStateParam | SetStateFunctionCallBack | **true** | A callback function in which the current state is passed and can be modified. Return value must be an object which will be set as the new state. |

A synchronous function which sets the current state. The previous state is passed into the callback function as a parameter. It is recommended to refer to the previous state through this parameter instead of using `store.state` within the callback.

**Usage:**

```JavaScript
store.set((prev) => {
    return {
        ...prev, // spread out the previous state
        newValue: 'hello world'
    }
});
```

> **Note:** It is always best practice to spread out the previous state at the top level of the returned object, then to add/override any values below.

### `store.setPath()`

(**path**: _string | string[]_, **value**: _unknown_) => `void`

| Argument | Type    | Required | Description                                                              |
| -------- | ------- | -------- | ------------------------------------------------------------------------ |
| path     | string  | **true** | A string version of the path within the state you'd like to set/replace. |
| value    | unknown | **true** | The value you'd like to add for the specified path.                      |

**Usage:**

```JavaScript
store.setPath(`products.${productId}.reviews`, reviewsData);
```

If the key you are using has dots in it (eg. "https://google.com"), you should use bracket notation instead of dot notation.

```JavaScript
const link = 'https://google.com';
const data = { hello: 'world' }

// Will throw an error saying the path "websites -> https://google -> com" doesn't exist, which is true.
store.setPath(`websites.${link}`, data);

// Using bracket notation instead; therefore, the ".com" is not evaluated as dot notation.
store.setPath(`websites[${link}]`, data);

// Array format can also be used
store.setPath(['websites', link], data);
```

### `store.deletePath()`

(**path**: _string | string[]_) => `void`

| Argument | Type   | Required | Description                                                         |
| -------- | ------ | -------- | ------------------------------------------------------------------- |
| path     | string | **true** | A string version of the path within the state you'd like to delete. |

**Usage:**

```JavaScript
store.setPath(`products.${productId}.reviews`);
```

> **Note:** This method works similar to `store.pushPath()`, except it does not push the data to the dataset prior to deleting it from the state.

### `store.addReducer()`

(**reducerFn**: _[ReducerFunction](#available-types)_) => `void`

| Argument  | Type            | Required | Description                                                             |
| --------- | --------------- | -------- | ----------------------------------------------------------------------- |
| reducerFn | ReducerFunction | **true** | A custom reducer function which takes (state, action) as its arguments. |

When you find yourself writing the same code over and over again using the `store.set()` method, or you are dealing with modifying deeply nested values, it is best practice to migrate to using a reducer function.

**Usage:**

```JavaScript
// the "action" parameter is expected to have a "type" property
const reducer = (state, action) => {
    switch (action.type) {
        default:
            return state;
        case 'ADD-PRODUCT-REVIEW':
            return {
                ...state,
                products: {
                    ...state.products,
                    [action.productId]: { ...state[action.productId], reviews: [...state[action.productId.reviews], ...action.payload] },
                },
            };
    }
};


store.addReducer(reducer);
```

> **Note:** Only _one_ reducer can be added to a store instance. Trying to add a second one will result in an error.

### `store.setWithReducer()`

(**action**: _[ReducerAction](#available-types)_) => `void`

| Argument | Type          | Required | Description                                    |
| -------- | ------------- | -------- | ---------------------------------------------- |
| action   | ReducerAction | **true** | Use your reducer function to modify the state. |

**Usage:**

```JavaScript
const action = { type: 'ADD-PRODUCT-REVIEW', productId: 1234, payload: { title: 'review 1', author: 'super cool product!', stars: 4 } };

store.setWithReducer(action);
```

## Data Management

### `await store.pushPath()`

(**path**: _string_, **dataset?**: _[Dataset](https://sdk.apify.com/docs/api/dataset)_ => `Promise<void>`

| Argument | Type    | Required  | Description                                                                      |
| -------- | ------- | --------- | -------------------------------------------------------------------------------- |
| path     | string  | **true**  | A string version of the path within the state you'd like to push to the dataset. |
| dataset  | Dataset | **false** | The dataset to push to. If not provided a dataset, the default one will be used. |

Push some data from the store into the specified dataset (or into the default one), then automatically delete it from the store after it's been pushed.

**Usage:**

```JavaScript
await store.pushPath(`products.${productId}.reviews.${reviewId}`);
```

> **Note:** When using this method to push to a dataset, the path is deleted within the state. If you don't want the data to be deleted from the global store after being pushed to the dataset, use regular `Apify.pushData()` instead.

### `store.dump()`

() => `void`

Completely empty the entire contents of the store.

### `await store.backup()`

() => `Promise<void>`

Back the store up to the cloud. The backup will be stored in the "Storages" section of your Apify account under a Key-Value store named `CLOUD-GLOBAL-STORES`. If you'd prefer to exclusively keep the store on the cloud, set the `cloud` option to `true` in `InitializeOptions`.

> **Note:** If you're using `cloud: true` in `InitializeOptions`, you don't need to use this method. Just use `store.forceSave()` instead

### `await store.forceSave()`

() => `Promise<void>`

The store's data is saved to the Key-Value Store every single time the "persistState" event is fired. It can also be forced to be saved instantly with this method.

## Static Methods

### `GlobalStore.summon()`

(**storeName**: _string_) => `GlobalStore`

| Argument  | Type   | Required  | Description                      |
| --------- | ------ | --------- | -------------------------------- |
| storeName | string | **false** | The name of the store to summon. |

A static method which returns the instance of the store attached to the name provided. A useful and simple aternative to passing a store instance around a parameter.

You are **_not_** required to provide the uppercase version of the store name in the `storeName` parameter. It is automatically done for you.

If you do not provide a store name, then the default store `GLOBAL-STORE` will be summoned.

**Usage:**

```JavaScript
const store = await GlobalStore.init();

const summoned = GlobalStore.summon('GLOBAL-STORE');

console.log(summoned.state); // => {}
```

### `GlobalStore.summonAll()`

() => `StoreInstances`

Similar to `summon`, but returns the entire `storeInstances` object, which is a map of all created instances of GlobalStore.

### `GlobalStore.dumpAll()`

() => `void`

Dump all instances of GlobalStore at once.

## Experimental Methods

### `GlobalStore.addMethod()`

(**addMethodOptions**: _[AddMethodOptions](#available-types)_) => `void`

| Argument         | Type             | Required | Description                                                                                                                                                     |
| ---------------- | ---------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| addMethodOptions | AddMethodOptions | **true** | An object containing the name and method to add. Within this method, the return value of `GlobalStore.summonAll()` is already passed in as the first parameter. |

Add a custom method to the entire GlobalStore class, which is accessible through `GlobalStore.useMethod()`. This method can be used to modify any store instance.

This is valuable for convenience sake, or when you are making complex modifications to multiple stores.

**Usage:**

Here is an example of using addMethod to add a complex method to GlobalStore, which modifies the state of three different instances.

```TypeScript
// Import GlobalStore and the CustomMethod type
import { GlobalStore, CustomMethod } from 'apify-global-store';

import { methodNames, storeNames } from './consts';

// Destructure our constants
const { ADD_PRODUCT_AND_REVIEWS } = methodNames;
const { PRODUCTS, REVIEWS, RUN_DATA } = storeNames;

// Create a function which ALWAYS takes StoreInstances as the first argument
// Our custom arguments come after the first one
const method: CustomMethod = async (instances, product, website) => {
    // Grab the instances of each store we need
    const productStore = instances[PRODUCTS];
    const reviewsStore = instances[REVIEWS];
    const runDataStore = instances[RUN_DATA]

    // First, add our product to the PRODUCTS GlobalStore instance
    productStore.set((prev) => {
        // Grab the product's data without its reviews
        const { reviews, ...productData } = product;

        return {
            // Spread the previous state
            ...prev,
            [website]: {
                products: {
                    // Spread the previous data for [website].products
                    ...prev[website].products,
                    // Add our new product
                    [productData.id]: productData
                }
            }
        }
    })

    // Add our product's reviews to the REVIEWS GlobalStore instance
    reviewsStore.setPath([website, product.id, 'latestReviews'], product.reviews)

    // If the products for this specific website has reached our threshold,
    // push the data to the dataset and delete it from the REVIEWS store
    if (reviewsStore.state[website].length >= 100) {
        await reviewsStore.pushPath(website);
    };

    // Update our RUN-DATA store
    runDataStore.set((prev) => {
        return {
            ...prev,
            [website]: {
                ...prev[website],
                runs: prev[website].runs + 1
            }
        }
    })
};

GlobalStore.addMethod({ name: ADD_PRODUCT_AND_REVIEWS, method });
```

> **Note:** It's not recommended to use reducers inside of these custom methods. That can make things complicated very quickly. `addMethod` can serve as an alternative to `addReducer`.

### `GlobalStore.useMethod()`

(**name**: _string_, **...rest**) => `void` | `Promise<void>`

| Argument | Type      | Required  | Description                                                |
| -------- | --------- | --------- | ---------------------------------------------------------- |
| name     | string    | **true**  | The name of the method used when adding it to GlobalStore. |
| ...rest  | unknown[] | **false** | Any custom parameters the method needs to run properly     |

**Usage:**

```TypeScript
import { methodNames } from './consts';

const { ADD_PRODUCT_AND_REVIEWS } = methodNames;

const product = parseProduct($);

await GlobalStore.useMethod(ADD_PRODUCT_AND_REVIEWS, product, new URL(request.url).hostname);
```

## Best Practices

These are not necessarily gospel, but they can help you modularize and scale your project while also making it more readable.

### Store Management

When using more than one instance of GlobalStore, it is best to use custom store names, and to put them into a constant:

`consts.ts`:

```TypeScript
export enum storeNames { PRODUCTS = 'PRODUCTS', HOTELS = 'HOTELS' };
```

`main.ts`:

```TypeScript
import { storeNames } from './consts';

const productStore = await GlobalStore.init({ name: storeNames.PRODUCTS });

const hotelStore = await GlobalStore.init({name: storeNames.HOTELS});

const summoned = GlobalStore.summon(storeNames.HOTELS);
```

### Using a reducer

1. It is always best practice to define your action types as constants, then to import them when defining your reducer.
2. Always define your reducer outside of the `store.addReducer()` method. Ideally, this should be done in a separate file, then imported.

**Example:**

`consts.ts`:

```TypeScript
export enum actions {
    GENERAL = 'GENERAL',
    ADD_PRODUCT = 'ADD_PRODUCT',
}
```

`reducer.ts`:

```TypeScript
import { ReducerFunction } from 'apify-global-store';
import { actions } from './consts';

const reducer: ReducerFunction = (state, action) => {
    switch (action.type) {
        default:
            return state;
        case actions.GENERAL:
            return {
                ...state,
                ...action.payload,
            };
        case actions.ADD_PRODUCT:
            return {
                ...state,
                products: { ...state.products, ...action.payload }
            }
    }
};

export default reducer;
```

`main.ts`:

```TypeScript
import { GlobalStore } from 'apify-global-store';
import { actions } from './consts'
import reducer from './reducer'

const store = await GlobalStore.init();
store.addReducer(reducer);

store.setWithReducer({
        type: actions.GENERAL,
        payload: { hello: 'world' },
    });
```

## Storage

In the Key-Value store, each store will be represented by an object looking like this:

```JSON
{
    "store": {
        "hello": "world"
    },
    "data": {
        "sizeInBytes": 17,
        "lastModified": "2022-03-18T15:39:45.041Z",
        "globalStoreVersion": "1.0.9",
        "type": "LOCAL"
    }
}
```

If the `cloud` option was not set to `true` upon the store's initialization, the store will be local to the actor's run under a key in the default Key-Value store.

If `cloud` was set to `true`, the global store will be stored in the cloud on your Apify account, under a named Key-Value store called `CLOUD-GLOBAL-STORES`.

> **Please:** DO NOT manually modify these objects using `Apify.setValue()`. GlobalStore uses the actor's default Key-Value store under the hood.

## Available Types

-   **_GlobalStore_**

The GlobalStore class.

-   **_InitializeOptions_**

The options to initialize an instance of GlobalStore.

```TypeScript
interface InitializeOptions {
    name?: string;
    initialState?: Record<string, unknown>;
    cloud?: boolean;
    debug?: boolean;
}
```

-   **_StoreState_**

An object representing the state returned from `store.state`.

```TypeScript
type StoreState = Record<string, unknown>;
```

-   **_SetStateFunctionCallback_**

The callback function to be passed into `store.set()`

```TypeScript
type SetStateFunctionCallBack = (previous: StoreState) => StoreState;
```

-   **_ReducerParam_**

The `action` object of your reducer function. Must include a `type` key.

```TypeScript
interface ReducerType {
    type: string;
}

type ReducerParam<T> = ReducerType & Record<string, T>;
```

-   **_ReducerFunction_**

A function which should be passed into `store.addReducer()`

```TypeScript
type ReducerFunction = <T>(state: StoreState, action: ReducerParam<T>) => StoreState;
```

-   **_StoreData_**

An object representing the data which is returned from `store.info`

```TypeScript
interface StoreData {
    sizeInBytes: number;
    lastModified: string;
    globalStoreVersion: string;
    type: 'LOCAL' | 'CLOUD';
}
```

-   **_StoreInstances_**

An object which hold all instances of GlobalStore, accessible through `GlobalStore.summonAll()`

```TypeScript
type StoreInstances = Record<DefaultStoreName | string, GlobalStore>;
```

-   **_AddMethodOptions_**

```TypeScript
export type CustomMethod = (storeInstances: StoreInstances, ...rest: unknown[]) => unknown | Promise<unknown>;

interface AddMethodOptions {
    name: string;
    method: CustomMethod;
}
```

## Credits

### Matt Stephens

-   [LinkedIn](https://www.linkedin.com/in/mstephen19/)
-   [Github](https://github.com/mstephen19)

### Kristýna Lhoťanová

-   [Github](https://github.com/lhotanok)

## License

Copyright (c) 2022-present Matt Stephens

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
