import { StoreType } from './types';

export const GLOBAL_STORE = 'GLOBAL-STORE';
export const CLOUD_GLOBAL_STORES = 'CLOUD-GLOBAL-STORES';
export const CURRENT_VERSION = '1.1.1';
export const storeTypes: Record<StoreType, StoreType> = {
    CLOUD: 'CLOUD',
    LOCAL: 'LOCAL',
};
