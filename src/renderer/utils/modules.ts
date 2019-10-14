import { remote } from 'electron';
import { url } from 'inspector';

const sharedModules: _SharedModules = remote.getGlobal('modules');

// 进行一次 JSON 转换，以避免返回的对象被 log 输出时显示为 '[Getter/Setter]'
const reqHackWrapper = (f: (...args: any[]) => any) => (...args: any[]) => f(...args).then((r: any) => JSON.parse(JSON.stringify(r)));

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
