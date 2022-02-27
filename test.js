const action = { type: 'ADD-PRODUCT-REVIEW', productId: 1234, payload: { title: 'review 1', author: 'super cool product!', stars: 4 } };

store.setWithReducer(action);
