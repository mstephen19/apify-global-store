# Apify Global Store

## Installation

```
npm install apify-global-store
```

## About

This is an extremely simple API which allows you to easily create and manage multiple global stores local to an actor's run.

State persistence and actor migrations are automatically handled, so the global state will not be lost on migrations or graceful aborts.

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

### `await GlobalStore.init()`

(initializeOptions: _InitializeOptions_) => `Promise<GlobalStore>`

| Argument          | Type              | Required | Description                                                                          |
| ----------------- | ----------------- | -------- | ------------------------------------------------------------------------------------ |
| initializeOptions | InitializeOptions | false    | An object containing `{ customName: string, initialState: Record<string, unknown> }` |

`GlobalStore` doesn't have a public constructor. Its `init()` method runs necessary asynchronous tasks prior to calling on its private constructor.

**Usage:**

```JavaScript
const store = await GlobalStore.init({ customName: 'hello-world' });
```

You can only pass letters and "-" within the string, otherwise an error will be thrown (to follow naming conventions). The provided store name will _always_ be forced into uppercase.

> A name for a store can only be used once. That includes the default name.

### `store.state`

A getter method that returns the current state object of the store.

### `store.info`

An object containing information about the contents of the store. Example:

```JavaScript
{
    sizeInBytes: 17,
    lastModified: '2022-03-18T15:39:45.041Z'
}
```

### `store.set()`

(setStateParam: SetStateFunctionCallBack) => `void`

| Argument      | Type                     | Required | Description                                                                                                                                      |
| ------------- | ------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| setStateParam | SetStateFunctionCallBack | **true** | A callback function in which the current state is passed and can be modified. Return value must be an object which will be set as the new state. |

A synchronous function which sets the current state.

**Usage:**

```JavaScript
store.set((prev) => {
    return {
        ...prev, // spread out the previous state
        newValue: 'hello world'
    }
});
```

### `await store.pushPathToDataset()`

(path: string, dataset: Dataset) => `Promise<void>`

| Argument | Type    | Required  | Description                                                                      |
| -------- | ------- | --------- | -------------------------------------------------------------------------------- |
| path     | string  | **true**  | A string version of the path you'd like to push within the state.                |
| dataset  | Dataset | **false** | The dataset to push to. If not provided a dataset, the default one will be used. |

**Usage:**

```JavaScript
await store.pushPathToDataset(`products.${productId}.reviews.${reviewId}`)
```

> When using this method to push to a dataset, the path is deleted within the state. If you don't want the data to be deleted from the global store after being pushed to the dataset, use regular `Apify.pushData()` instead

### `store.dump()`

() => `void`

Completely empty the entire contents of the store.

### `store.summon()`

(storeName: string) => `GlobalStore`

| Argument  | Type   | Required | Description                      |
| --------- | ------ | -------- | -------------------------------- |
| storeName | string | **true** | The name of the store to summon. |

A static method which returns the instance of the store attached to the name provided. A useful and simple aternative to passing a store instance around a parameter.

**Usage:**

```JavaScript
const store = await GlobalStore.init()

const summoned = GlobalStore.summon('GLOBAL-STORE')

console.log(summoned.state) // => {}
```

> Note: This does not return a new store instance. It only returns the already existing instance of the store with that name. If you modify the summoned store, the original will also be modified. All summoned stores point to the same instance of GlobalStore. To get a new instance of GlobalStore, use `await GlobalStore.init()`.

## Advanced usage

### `store.addReducer()`

| Argument  | Type            | Required | Description                                                             |
| --------- | --------------- | -------- | ----------------------------------------------------------------------- |
| reducerFn | ReducerFunction | **true** | A custom reducer function which takes (state, action) as its arguments. |

When you find yourself writing the same code in the `store.set()` method, or you are dealing with modifying deeply nested values, it is best practice to use a reducer function.

**Usage:**

```JavaScript
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

### `store.setWithReducer()`

| Argument | Type          | Required | Description                                    |
| -------- | ------------- | -------- | ---------------------------------------------- |
| action   | ReducerAction | true     | Use your reducer function to modify the state. |

**Usage:**

```JavaScript
const action = { type: 'ADD-PRODUCT-REVIEW', productId: 1234, payload: { title: 'review 1', author: 'super cool product!', stars: 4 } };

store.setWithReducer(action);
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

> Please: DO NOT manually modify these objects using `Apify.setValue()`. GlobalStore uses the actor's default Key-Value store under the hood.

## Available Types

-   _GlobalStore_
-   _StoreState_
-   _SetStateFunctionCallback_
-   _ReducerParam_
-   _ReducerFunction_
-   _StoreData_
