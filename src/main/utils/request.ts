import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import constants from 'common/configs/constants';
import api from 'common/configs/apis';
import moment from 'moment';
import { logMain } from 'common/utils/logger';

let requestTaskId = 1;

function now() {
  return moment().format('YYYY-MM-DD HH:mm:ss');
}

function initAxios(): AxiosInstance {
  const axiosInstance: AxiosInstance = axios.create({
    // baseURL: api.base,
    timeout: constants.requestTimeout,
  });
  axiosInstance.interceptors.request.use(function (config) {
    config.params = {
      ...config.params,
      _t: new Date().getTime(),
    };
    return config;
  });
  return axiosInstance;
}

function checkStatus(reqId: number, mau: string, duration: number, response: AxiosResponse) {
  console.log(
    `[${now()} resp #${reqId}] ${mau} (${duration}ms)\n` +
      JSON.stringify(
        {
          status: `${response.status} ${response.statusText}`,
          headers: response.headers,
          data: response.data,
        },
        null,
        '  ',
      ),
  );
  // TODO 添加 resp 和 error 的生产环境 log
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  const error: any = new Error(response.statusText);
  error.response = response;
  throw error;
}

/**
 * Send a request and get API response
 * @param {string} url
 * @param {AxiosRequestConfig} options
 * @param {function} postprocess **can not be used in renderer process**
 * @returns {Promise<IApiResp<any>>}
 */
async function baseRequest<O = any>(url: string, options?: AxiosRequestConfig): Promise<O>;
async function baseRequest<O = any, PO = O>(
  url: string,
  options: AxiosRequestConfig,
  postprocess: (data: O) => PO,
): Promise<PO>;
async function baseRequest<O = any, PO = O>(
  url: string,
  options: AxiosRequestConfig = {},
  postprocess?: (data: O) => PO,
) {
  const axiosInstance = initAxios();
  const reqId = requestTaskId++;
  const mau = `${options.method || 'GET'} ${url}`;
  console.log(
    `[${now()}  req #${reqId}] ${mau}` +
      (options.data ? '\n' + JSON.stringify(options.data, null, '  ') : ''),
  );
  logMain.info('[req]', mau);
  const st = Date.now();
  const response = await axiosInstance({
    url,
    ...options,
  });
  const ed = Date.now();
  checkStatus(reqId, mau, ed - st, response);
  const data = response.data;
  if (postprocess && typeof postprocess === 'function') {
    // @ts-ignore
    return postprocess(data);
  }
  return data;
}

function get<O = undefined>(url: string) {
  return baseRequest<O>(url);
}

function post<I = undefined, O = undefined>(url: string, data?: I) {
  return baseRequest<O>(url, {
    method: 'POST',
    data,
  });
}

function put<I = undefined, O = undefined>(url: string, data?: I) {
  return baseRequest<O>(url, {
    method: 'PUT',
    data,
  });
}

function patch<I = undefined, O = undefined>(url: string, data?: I) {
  return baseRequest<O>(url, {
    method: 'PATCH',
    data,
  });
}

function del<I = undefined, O = undefined>(url: string, data?: I) {
  return baseRequest<O>(url, {
    method: 'DELETE',
    data,
  });
}

const req = {
  baseRequest,
  get,
  post,
  put,
  patch,
  del,
};

export default req;
