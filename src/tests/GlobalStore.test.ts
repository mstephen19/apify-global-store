import { ReducerFunction } from '..';
import GlobalStore from '../GlobalStore';

describe('GlobalStore', () => {
    describe('init', () => {
        it('Should return an instance of GlobalStore', async () => {
            const store = await GlobalStore.init();
            expect(store).toBeInstanceOf(GlobalStore);
        });

        it('Should return an instance with proper properties', async () => {
            const store = await GlobalStore.init({ name: 'test-store', initialState: { hello: 'world' } });
            expect(store).toHaveProperty('storeName', 'TEST-STORE');
            expect(store.state).toEqual({ hello: 'world' });
            expect(store.info).toHaveProperty('lastModified');
            expect(store.info).toHaveProperty('globalStoreVersion');
            expect(store.info).toHaveProperty('sizeInBytes');
        });
    });

    describe('summon', () => {
        it('Should return the proper instance of GlobalStore', () => {
            const store = GlobalStore.summon('test-store');
            expect(store).toBeInstanceOf(GlobalStore);
            expect(store).toHaveProperty('storeName', 'TEST-STORE');
        });

        it('Should modify the other intance when a summoned instance is modified', async () => {
            const store = await GlobalStore.init({ name: 'test-store-two' });
            const summoned = GlobalStore.summon('test-store-two');

            summoned.set((prev) => {
                return {
                    ...prev,
                    hello: 'world',
                };
            });

            expect(store.state).toEqual({ hello: 'world' });
        });
    });

    describe('summonAll', () => {
        it('Should return an object containing all store instances', () => {
            const stores = GlobalStore.summonAll();
            expect(stores).toHaveProperty('GLOBAL-STORE');
            expect(stores).toHaveProperty('TEST-STORE');

            for (const store of Object.values(stores)) {
                expect(store).toBeInstanceOf(GlobalStore);
            }
        });
    });

    describe('state', () => {
        it('Should return the current state', () => {
            const summoned = GlobalStore.summon();
            expect(summoned.state).toEqual({});
        });
    });

    describe('info', () => {
        it('Should return the current info object', () => {
            const summoned = GlobalStore.summon();
            expect(summoned.info).toHaveProperty('lastModified');
            expect(summoned.info).toHaveProperty('globalStoreVersion');
            expect(summoned.info).toHaveProperty('sizeInBytes');
        });
    });

    describe('set', () => {
        it('Should modify the state', () => {
            const summoned = GlobalStore.summon();

            summoned.set(() => {
                return {
                    world: 'hello',
                };
            });

            expect(summoned.state).toEqual({ world: 'hello' });

            summoned.set((prev) => {
                return {
                    ...prev,
                    hello: 'world',
                };
            });

            expect(summoned.state).toEqual({ world: 'hello', hello: 'world' });
        });
    });

    describe('dump', () => {
        it('Should completely dump the state', () => {
            const summoned = GlobalStore.summon();

            summoned.dump();

            expect(summoned.state).toEqual({});
        });
    });

    describe('addReducer', () => {
        it('Should add a reducer function to the GlobalStore instance', () => {
            const summoned = GlobalStore.summon();

            const reducer: ReducerFunction = (state, action) => {
                switch (action.type) {
                    default:
                        return state;
                    case 'TEST':
                        return {
                            hello: 'world',
                        };
                }
            };

            summoned.addReducer(reducer);

            const func = () => {
                summoned.setWithReducer({
                    type: 'TEST',
                });

                return summoned.state;
            };

            expect(func()).toEqual({ hello: 'world' });
        });

        it('Should not accept more than one reducer function', () => {
            const summoned = GlobalStore.summon();

            const reducer: ReducerFunction = (state, action) => {
                switch (action.type) {
                    default:
                        return state;
                    case 'GENERAL':
                        return {
                            ...state,
                            ...action.payload,
                        };
                }
            };

            expect(() => summoned.addReducer(reducer)).toThrow();
        });
    });

    describe('setWithReducer', () => {
        it('Should throw an error if there is no reducer', () => {
            const summoned = GlobalStore.summon('test-store-two');

            const fn = () => {
                summoned.setWithReducer({
                    type: 'GENERAL',
                    test: 'abc',
                });
            };

            expect(fn).toThrow();
        });

        it("Should modify the store's state", async () => {
            const store = await GlobalStore.init({ name: 'test-store-three' });

            const reducer: ReducerFunction = (state, action) => {
                switch (action.type) {
                    default:
                        return state;
                    case 'GENERAL':
                        return {
                            ...state,
                            ...action.payload,
                        };
                }
            };

            store.addReducer(reducer);

            store.setWithReducer({
                type: 'GENERAL',
                payload: { hello: 'world' },
            });

            expect(store.state).toEqual({ hello: 'world' });

            store.setWithReducer({
                type: 'GENERAL',
                payload: { hey: 'again' },
            });

            expect(store.state).toEqual({ hello: 'world', hey: 'again' });

            const summoned = GlobalStore.summon('test-store-three');

            summoned.setWithReducer({
                type: 'GENERAL',
                payload: { heyaa: 'again' },
            });

            expect(store.state).toEqual({ hello: 'world', hey: 'again', heyaa: 'again' });
            expect(summoned.state).toEqual({ hello: 'world', hey: 'again', heyaa: 'again' });
        });
    });

    describe('deletePath', () => {
        it('Should delete the path from the store', async () => {
            const store = await GlobalStore.init({ name: 'test-store-abc' });

            store.set((prev) => {
                return {
                    ...prev,
                    hello: 'world',
                    test: {
                        abc: 'hi',
                    },
                };
            });

            store.deletePath('test.abc');

            expect(store.state).toEqual({ hello: 'world', test: {} });
        });
    });

    describe('setPath', () => {
        it('Should set the path in the store to the specified value', async () => {
            const store = await GlobalStore.init({ name: 'my-test-store-hi' });

            store.setPath('hello.world', [1, 2, 3]);

            expect(store.state).toHaveProperty('hello');

            const { hello } = store.state;

            expect(hello).toHaveProperty('world');
            expect(typeof hello).toEqual('object');
        });
    });

    describe('addMethod and useMethod', () => {
        it('Should add a method to GlobalStore with StoreInstances passed in', () => {
            GlobalStore.addMethod({
                name: 'TEST-METHOD',
                method: (instances, value) => {
                    const store = instances['MY-TEST-STORE-HI'];

                    store.set(() => {
                        return {
                            heya: value,
                        };
                    });
                },
            });

            GlobalStore.useMethod('TEST-METHOD', 'hi');

            expect(GlobalStore.summon('MY-TEST-STORE-HI').state).toEqual({ heya: 'hi' });
        });
    });
});
