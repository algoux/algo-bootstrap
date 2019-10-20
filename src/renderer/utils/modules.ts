import { remote } from 'electron';
import { cloneDeep } from 'lodash';

const sharedModules: _SharedModules = remote.getGlobal('modules');

// 避免返回的对象含有 electron 的 getter/setter
const reqHackWrapper = (f: (...args: any[]) => any) => (...args: any[]) => f(...args).then((r: any) => cloneDeep(r));

const sm = {
  ...sharedModules,
  req: {
    baseRequest: reqHackWrapper(sharedModules.req.baseRequest),
    get: reqHackWrapper(sharedModules.req.get),
    post: reqHackWrapper(sharedModules.req.post),
    put: reqHackWrapper(sharedModules.req.put),
    patch: reqHackWrapper(sharedModules.req.patch),
    del: reqHackWrapper(sharedModules.req.del),
  } as _SharedModules['req'],
};

export default sm;
