type _SharedModules = typeof import('common/../main/modules').default;

interface IApiResp<T = undefined> {
  success: boolean;
  code?: number;
  msg?: string;
  data?: T;
}
