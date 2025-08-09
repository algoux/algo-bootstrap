import got, { Got, Options, Response } from 'got';
import constants from 'common/configs/constants';
// import api from 'common/configs/apis';
import moment from 'moment';
import { logMain } from 'common/utils/logger';

let requestTaskId = 1;

function now() {
  return moment().format('YYYY-MM-DD HH:mm:ss');
}

function parseResponse(response: Response, forceType?: 'json' | 'text' | 'buffer'): any {
  const contentType = response.headers['content-type'] || '';
  const lowerContentType = contentType.toLowerCase();

  if (forceType) {
    switch (forceType) {
      case 'json':
        if (typeof response.body === 'string') {
          try {
            return JSON.parse(response.body);
          } catch (error) {
            console.warn('Failed to parse JSON response:', error);
            return response.body;
          }
        }
        return response.body;
      case 'text':
        return response.body;
      case 'buffer':
        return response.rawBody;
      default:
        return response.body;
    }
  }

  if (
    lowerContentType.includes('application/json') ||
    lowerContentType.includes('text/json') ||
    lowerContentType.includes('application/ld+json')
  ) {
    try {
      if (typeof response.body === 'string') {
        return JSON.parse(response.body);
      }
      return response.body;
    } catch (error) {
      console.warn('Failed to parse JSON response:', error);
      return response.body;
    }
  }

  if (
    lowerContentType.includes('text/html') ||
    lowerContentType.includes('application/xhtml+xml')
  ) {
    return response.body;
  }

  if (
    lowerContentType.includes('text/plain') ||
    lowerContentType.includes('text/css') ||
    lowerContentType.includes('text/javascript') ||
    lowerContentType.includes('application/javascript')
  ) {
    return response.body;
  }

  if (lowerContentType.includes('application/xml') || lowerContentType.includes('text/xml')) {
    return response.body;
  }

  if (
    lowerContentType.includes('application/octet-stream') ||
    lowerContentType.includes('image/') ||
    lowerContentType.includes('audio/') ||
    lowerContentType.includes('video/') ||
    lowerContentType.includes('application/pdf') ||
    lowerContentType.includes('application/zip') ||
    lowerContentType.includes('application/x-zip-compressed')
  ) {
    return response.rawBody;
  }

  return response.body;
}

function initGot(): Got {
  const gotInstance: Got = got.extend({
    // prefixUrl: api.base,
    timeout: {
      request: constants.requestTimeout,
    },
    hooks: {
      beforeRequest: [
        (options) => {
          // Add timestamp parameter to query
          if (!options.searchParams) {
            options.searchParams = new URLSearchParams();
          }
          options.searchParams.set('_t', new Date().getTime().toString());
        },
      ],
    },
  });
  return gotInstance;
}

function checkStatus(reqId: number, mau: string, duration: number, response: Response) {
  console.log(
    `[${now()} resp #${reqId}] ${mau} (${duration}ms)\n` +
      JSON.stringify(
        {
          status: `${response.statusCode} ${response.statusMessage}`,
          headers: response.headers,
          body: response.body,
        },
        null,
        '  ',
      ),
  );
  // TODO 添加 resp 和 error 的生产环境 log
  if (response.statusCode >= 200 && response.statusCode < 300) {
    return response;
  }

  const error: any = new Error(response.statusMessage);
  error.response = response;
  throw error;
}

/**
 * Send a request and get API response
 * @param {string} url
 * @param {Options} options
 * @param {function} postprocess **can not be used in renderer process**
 * @returns {Promise<IApiResp<any>>}
 */
async function baseRequest<O = any>(url: string, options?: Options): Promise<O>;
async function baseRequest<O = any, PO = O>(
  url: string,
  options: Options,
  postprocess: (data: O) => PO,
): Promise<PO>;
async function baseRequest<O = any, PO = O>(
  url: string,
  options: Options = {},
  postprocess?: (data: O) => PO,
) {
  const gotInstance = initGot();
  const reqId = requestTaskId++;
  const mau = `${options.method || 'GET'} ${url}`;
  console.log(
    `[${now()}  req #${reqId}] ${mau}` +
      (options.json ? '\n' + JSON.stringify(options.json, null, '  ') : ''),
  );
  logMain.info('[req]', mau);
  const st = Date.now();
  const response = (await gotInstance(url, options)) as Response;
  const ed = Date.now();
  checkStatus(reqId, mau, ed - st, response);

  const forceType = (options as any).forceType as 'json' | 'text' | 'buffer' | undefined;
  const data = parseResponse(response, forceType);

  if (postprocess && typeof postprocess === 'function') {
    // @ts-ignore
    return postprocess(data);
  }
  return data;
}

function get<O = undefined>(url: string) {
  return baseRequest<O>(url);
}

function getJson<O = undefined>(url: string) {
  return baseRequest<O>(url, { forceType: 'json' } as any);
}

function getText(url: string) {
  return baseRequest<string>(url, { forceType: 'text' } as any);
}

function getBuffer(url: string) {
  return baseRequest<Buffer>(url, { forceType: 'buffer' } as any);
}

function post<I = undefined, O = undefined>(url: string, data?: I) {
  return baseRequest<O>(url, {
    method: 'POST',
    json: data,
  });
}

function put<I = undefined, O = undefined>(url: string, data?: I) {
  return baseRequest<O>(url, {
    method: 'PUT',
    json: data,
  });
}

function patch<I = undefined, O = undefined>(url: string, data?: I) {
  return baseRequest<O>(url, {
    method: 'PATCH',
    json: data,
  });
}

function del<I = undefined, O = undefined>(url: string, data?: I) {
  return baseRequest<O>(url, {
    method: 'DELETE',
    json: data,
  });
}

const req = {
  baseRequest,
  get,
  getJson,
  getText,
  getBuffer,
  post,
  put,
  patch,
  del,
};

export default req;
