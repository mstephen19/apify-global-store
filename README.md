# Apify Global Store

[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

![npm](https://img.shields.io/npm/v/apify-global-store)

![npm](https://img.shields.io/npm/dw/apify-global-store)

## Table of Contents:

-   [Installation](#installation)
-   [About](#about)
-   [Importing](#importing)
-   [Example](#example)
-   [Usage](#usage)
    -   [`await GlobalStore.init()`](#await-globalstoreinit)
    -   [`store.state`](#storestate)
    -   [`store.info`](#storeinfo)
    -   [`store.set()`](#storeset)
    -   [`await store.pushPathToDataset()`](#await-storepushpathtodataset)
    -   [`store.dump()`](#storedump)
    -   [`await store.forceSave()`](#await-storeforcesave)
    -   [`GlobalStore.summon()`](#globalstoresummon)
    -   [`GlobalStore.summonAll()`](#globalstoresummonall)
    -   [Best practices with store namagement](#best-practices-with-store-management)
-   [Advanced Usage](#advanced-usage)
    -   [`store.addReducer()`](#storeaddreducer)
    -   [`store.setWithReducer()`](#storesetwithreducer)
    -   [Best practices when using a reducer](#best-practices-when-using-a-reducer)
-   [Storage](#in-the-key-value-store)
-   [Types](#available-types)

## Installation

```
npm install apify-global-store
```

## About

This is an extremely simple API which allows you to easily create and manage multiple global stores local to an actor's run. Using `apify-global-store` removes the need to pass complex data through requests, and simplifies the process of storing incomplete data that isn't yet ready to be pushed to the dataset.

State persistence, actor migrations, and race conditions are automatically handled under the hood, so the global state will not be lost on migrations or graceful aborts.

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

    console.log(store.state) // -> {}

    store.set((prev) => {
        return {
            ...prev,
            message: 'hello'
        }
    })

    console.log(store.state) // -> { message: 'hello' }

    store.set((prev) => {
        return {
            ...prev,
            message2: 'world'
        }
    })

    console.log(store.state) // -> { message: 'hello', message2: 'world' }
});
```

## Usage

### `await GlobalStore.init()`

(initializeOptions: _InitializeOptions_) => `Promise<GlobalStore>`

| Argument          | Type              | Required | Description                                                             |
| ----------------- | ----------------- | -------- | ----------------------------------------------------------------------- |
| initializeOptions | InitializeOptions | false    | Configure the store's name, its initial state, and where it is located. |

```TypeScript
interface InitializeOptions {
    name?: string; // The name of the store to use
    initialState?: Record<string, unknown>; // The initial state to start with
    cloud?: boolean; // Whether or not to keep the store on the cloud, or locally to the actor's run
}
```

`GlobalStore` doesn't have a public constructor. Its `init()` method runs necessary asynchronous tasks prior to calling on its private constructor.

**Usage:**

```JavaScript
const store = await GlobalStore.init({ name: 'hello-world' });
```

If the store already has a previous state stored within the Key-Value store (in the situation that a migration/abort occurred), then the `initialState` option will have no effect.

You can only pass letters and "-" within the string, otherwise an error will be thrown (to follow naming conventions). The provided store name will _always_ be forced into uppercase.

> **Note:** A name for a store can only be used once. That includes the default name of `GLOBAL-STORE`. If the `cloud` option is set to true, then the global store will be stored in the cloud on your Apify account under "Storages" within a named Key-Value store called `CLOUD-GLOBAL-STORES`.

### `store.state`

**Usage:**

```JavaScript
const { myValue } = store.state
```

A getter method that returns the current state object of the store.

### `store.info`

```JavaScript
const { sizeInBytes, lastModified } = store.info
```

An object containing information about the contents of the store. Example:

```JavaScript
{
    sizeInBytes: 17,
    lastModified: '2022-03-18T15:39:45.041Z',
    globalStoreVersion: '1.0.9'
}
```

### `store.set()`

(setStateParam: _SetStateFunctionCallBack_) => `void`

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

### `await store.pushPathToDataset()`

(path: _string_, dataset: _Dataset_) => `Promise<void>`

| Argument | Type    | Required  | Description                                                                      |
| -------- | ------- | --------- | -------------------------------------------------------------------------------- |
| path     | string  | **true**  | A string version of the path you'd like to push within the state.                |
| dataset  | Dataset | **false** | The dataset to push to. If not provided a dataset, the default one will be used. |

Push some data from the store into the specified dataset (or into the default one), then automatically delete it from the store after it's been pushed.

**Usage:**

```JavaScript
await store.pushPathToDataset(`products.${productId}.reviews.${reviewId}`)
```

> **Note:** When using this method to push to a dataset, the path is deleted within the state. If you don't want the data to be deleted from the global store after being pushed to the dataset, use regular `Apify.pushData()` instead.

### `store.dump()`

() => `void`

Completely empty the entire contents of the store.

### `await store.forceSave()`

() => `Promise<void>`

The store's data is saved to the Key-Value Store every single time the "persistState" event is fired. It can also be forced to be saved instantly with this method.

### `GlobalStore.summon()`

(storeName: _string_) => `GlobalStore`

| Argument  | Type   | Required | Description                      |
| --------- | ------ | -------- | -------------------------------- |
| storeName | string | **false** | The name of the store to summon. |

A static method which returns the instance of the store attached to the name provided. A useful and simple aternative to passing a store instance around a parameter.

You are _not_ required to provide the uppercase version of the store name in the `storeName` parameter. It is automatically done for you.

If you do not provide a store name, then the default store `GLOBAL-STORE` will be summoned.

**Usage:**

```JavaScript
const store = await GlobalStore.init()

const summoned = GlobalStore.summon('GLOBAL-STORE')

console.log(summoned.state) // => {}
```

### `GlobalStore.summonAll()`

() => `Record<string, GlobalStore>`

Similar to `summon`, but returns the entire `storeInstances` object, which is a map of all instances of GlobalStore.

### Best practices with store namagement

When using more than one instance of GlobalStore, it is best to use custom store names, and to put them into a constant:

`consts.ts`:

```TypeScript
export enum storeNames { PRODUCTS = 'PRODUCTS', HOTELS = 'HOTELS' }
```

`main.ts`:

```TypeScript
import { storeNames } from './consts'

const store = await GlobalStore.init({ name: storeNames.PRODUCTS })
```

## Advanced usage

### `store.addReducer()`

(reducerFn: _ReducerFunction_) => `void`

| Argument  | Type            | Required | Description                                                             |
| --------- | --------------- | -------- | ----------------------------------------------------------------------- |
| reducerFn | ReducerFunction | **true** | A custom reducer function which takes (state, action) as its arguments. |

When you find yourself writing the same code over and over again using the `store.set()` method, or you are dealing with modifying deeply nested values, it is best practice to migrate to using a reducer function.

**Usage:**

```JavaScript
// the "action" parameter is expected to have a "type" property
const reducer = (state, action) => {
    switch(action.type) {
        default:
            return state;
        case 'ADD-PRODUCT-REVIEW':
            return {
                ...state,
                products: { ...state.products, [action.productId]: { ...state[action.productId], reviews: [...state[action.productId.reviews], ...action.payload] } }
            }
    }
};

store.addReducer(reducer);
```

> **Note:** Only _one_ reducer can be added to a store instance. Trying to add a second one will result in an error.

### `store.setWithReducer()`

(action: _ReducerAction_) => `void`

| Argument | Type          | Required | Description                                    |
| -------- | ------------- | -------- | ---------------------------------------------- |
| action   | ReducerAction | true     | Use your reducer function to modify the state. |

**Usage:**

```JavaScript
const action = { type: 'ADD-PRODUCT-REVIEW', productId: 1234, payload: { title: 'review 1', author: 'super cool product!', stars: 4 } };

store.setWithReducer(action);
```

### Best practices when using a reducer

1. It is always best practice to define your action types as constants, then to import them when defining your reducer.
2. Always define your reducer outside of the `store.addReducer()` method. Ideally, this should be done in a separate file.

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

## In the Key-Value Store

In the Key-Value store, each store will be represented by an object looking like this:

```JSON
{
    "store": {
        "hello": "world"
    },
    "data": {
        "sizeInBytes": 17,
        "lastModified": "2022-03-18T15:39:45.041Z"
    }
}
```

> **Please:** DO NOT manually modify these objects using `Apify.setValue()`. GlobalStore uses the actor's default Key-Value store under the hood.

## Available Types

-   _GlobalStore_
-   _StoreState_
-   _SetStateFunctionCallback_
-   _ReducerParam_
-   _ReducerFunction_
-   _StoreData_
