import { DvaSagaEffect } from '@/utils/dva';
import { logRenderer } from '@/utils/logger';
import sm from '@/utils/modules';
import pRetry from 'p-retry';
import { ResourceId, ResourceIndexItem, ResourceIndexValue } from 'common/configs/resources';

type CurrentState = IResourcesState;

function getMatchedResourceIndexValue(
  resourceId: ResourceId,
  resourceIndexItemWithTypes: ResourceIndexItem,
): ResourceIndexValue {
  if (sm.platform.currentPlatformArch in resourceIndexItemWithTypes) {
    return resourceIndexItemWithTypes[sm.platform.currentPlatformArch] as ResourceIndexValue;
  } else if ('universal' in resourceIndexItemWithTypes) {
    return resourceIndexItemWithTypes.universal as ResourceIndexValue;
  } else if ('src' in resourceIndexItemWithTypes) {
    return resourceIndexItemWithTypes.src as ResourceIndexValue;
  } else {
    throw new Error(
      `No matched resource index value for ${resourceId}, available keys: ${Object.keys(resourceIndexItemWithTypes)}`,
    );
  }
}

function genInitialState(): CurrentState {
  return {
    resourceIndex: {},
  };
}

export default {
  state: genInitialState(),
  reducers: {
    setResourceIndex(
      state: CurrentState,
      { payload: { resourceIndex } }: DvaAction<Pick<CurrentState, 'resourceIndex'>>,
    ) {
      state.resourceIndex = resourceIndex;
    },
    addResourceIndexItem(
      state: CurrentState,
      {
        payload: { resourceId, value },
      }: DvaAction<{ resourceId: ResourceId; value: ResourceIndexValue }>,
    ) {
      state.resourceIndex[resourceId] = value;
    },
    addResourceIndexItems(
      state: CurrentState,
      {
        payload: { items },
      }: DvaAction<{ items: { resourceId: ResourceId; value: ResourceIndexValue }[] }>,
    ) {
      items.forEach((item) => {
        state.resourceIndex[item.resourceId] = item.value;
      });
    },
  },
  effects: {
    *getResourceIndexItem(
      { payload: { resourceId } }: DvaAction<{ resourceId: ResourceId }>,
      { call, put }: DvaSagaEffect,
    ) {
      logRenderer.info('fetching resource index item for:', resourceId);
      const resourceIndexItem: ResourceIndexItem = yield call(
        sm.resources.getRemoteResourceIndexItem,
        resourceId,
      );
      const selectedValue = getMatchedResourceIndexValue(resourceId, resourceIndexItem);
      logRenderer.info('selected resource index value for:', resourceId, selectedValue);
      yield put({
        type: 'addResourceIndexItem',
        payload: {
          resourceId,
          value: selectedValue,
        },
      });
      return selectedValue;
    },
    *getResourceIndexItems(
      { payload: { resourceIds } }: DvaAction<{ resourceIds: ResourceId[] }>,
      { call, put, all }: DvaSagaEffect,
    ): Generator<any, { successful: ResourceId[]; failed: ResourceId[] }, any> {
      logRenderer.info('fetching resource index items for', resourceIds);

      const effects = resourceIds.map((resourceId) =>
        call(async () => {
          try {
            const resourceIndexItem: ResourceIndexItem = await pRetry(
              () => sm.resources.getRemoteResourceIndexItem(resourceId),
              { retries: 1, minTimeout: 100 },
            );
            const selectedValue = getMatchedResourceIndexValue(resourceId, resourceIndexItem);
            logRenderer.info('selected resource index value for:', resourceId, selectedValue);

            return { success: true, resourceId, value: selectedValue };
          } catch (e: any) {
            logRenderer.error('failed to fetch resource index item for:', resourceId, e);
            return { success: false, resourceId, error: e.message };
          }
        }),
      );

      const results = yield all(effects) as any;
      const successfulIds: ResourceId[] = [];
      const failedIds: ResourceId[] = [];
      results.forEach((result: any) => {
        if (result.success) {
          successfulIds.push(result.resourceId);
        } else {
          failedIds.push(result.resourceId);
        }
      });
      yield put({
        type: 'addResourceIndexItems',
        payload: {
          items: results
            .filter((result: any) => result.success)
            .map((result: any) => ({
              resourceId: result.resourceId,
              value: result.value,
            })),
        },
      });

      logRenderer.info(
        'resource index items fetch completed. successful:',
        successfulIds,
        'failed:',
        failedIds,
      );

      return {
        successful: successfulIds,
        failed: failedIds,
      };
    },
  },
};
