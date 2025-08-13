import path from 'path';
import req from '@/utils/request';
import api from 'common/configs/apis';
import { ResourceId, ResourceIndexItem, resourcesIndexPathMap } from 'common/configs/resources';

export async function getRemoteResourceIndexItem(resourceId: ResourceId): Promise<ResourceIndexItem> {
  const res = (await req.get(
    path.join(api.res.base, resourcesIndexPathMap[resourceId]),
  )) as ResourceIndexItem;
  return res;
}
