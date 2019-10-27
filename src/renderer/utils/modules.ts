import { remote } from 'electron';
import { cloneDeep } from 'lodash';
import { purifyObject } from '@/../common/utils/format';

const sharedModules: _GlobalSharedModules = remote.getGlobal('modules');

// 避免返回的对象含有 electron 的 getter/setter
const pureHackWrapper = (f: (...args: any[]) => any) => (...args: any[]) => f(...args).then((r: any) => purifyObject(r));

const sm = {
  ...sharedModules,
  req: {
    baseRequest: pureHackWrapper(sharedModules.req.baseRequest),
    get: pureHackWrapper(sharedModules.req.get),
    post: pureHackWrapper(sharedModules.req.post),
    put: pureHackWrapper(sharedModules.req.put),
    patch: pureHackWrapper(sharedModules.req.patch),
    del: pureHackWrapper(sharedModules.req.del),
  } as _GlobalSharedModules['req'],
};

export default sm;
