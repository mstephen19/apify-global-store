# Apify Global Store

## Installation

```
npm install apify-global-store
```

## About

This is an extremely simple API which allows you to easily create and manage multiple global stores.

State persistence and actor migrations are automatically handled, so the global state will not be lost on migrations or graceful aborts.

## Example

```JavaScript
const Apify = require('apify');
const { GlobalStore } = require('apify-global-store');

Apify.main(async () => {
    const store = new GlobalStore();
    await store.initialize();

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

### `new GlobalStore()`

| Argument   | Type   | Required | Description                                                                                                                 |
| ---------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| customName | string | false    | Custom name for the global store. Useful when creating multiple stores. If not provided, the default name is 'GLOBAL-STORE' |

```JavaScript
const store = new GlobalStore('hello-world');
```

You can only pass letters and "-" within the string, otherwise an error will be thrown (to follow naming conventions).

### `store.initialize()`

| Argument     | Type            | Required | Description                                                                                 |
| ------------ | --------------- | -------- | ------------------------------------------------------------------------------------------- |
| initialState | StateStoreValue | true     | The initial state to start with (if the state doesn't already exist in the key-value store) |

```JavaScript
await store.initialize({ hello: 'world' });
```

> A name for a store can only be used once. That includes the default name.

### `store.state`

A getter method that returns the current state object of the store.

### `store.set()`

| Argument      | Type                     | Required | Description                                                                                                                                      |
| ------------- | ------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| setStateParam | SetStateFunctionCallBack | **true** | A callback function in which the current state is passed and can be modified. Return value must be an object which will be set as the new state. |

A synchronous function which sets the current state.

Common usage:

```JavaScript
store.set((prev) => {
    return {
        ...prev,
        newValue: 'hello world'
    }
});
```

### `store.pushPathToDataset()`

| Argument      | Type                     | Required | Description                                                                                                                                      |
| ------------- | ------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| path | string | **true** | A string version of the path you'd like to push within the state. |
| dataset | Dataset | **false** | The dataset to push to. If not provided a dataset, the default one will be used. |

```JavaScript
await store.pushPathToDataset(`products.${productId}.reviews.${reviewId}`)
```

> When using this method to push to a dataset, the path is deleted within the state. If you don't want the data to be deleted from the global store after being pushed to the dataset, use regular `Apify.pushData()` instead

### Advanced usage

### `store.addReducer()`

| Argument  | Type            | Required | Description                                                                 |
| --------- | --------------- | -------- | --------------------------------------------------------------------------- |
| reducerFn | ReducerFunction | true     | Add a custom reducer function which takes (state, action) as its arguments. |

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

```JavaScript
const action = { type: 'ADD-PRODUCT-REVIEW', productId: 1234, payload: { title: 'review 1', author: 'super cool product!', stars: 4 } };

store.setWithReducer(action);
```
