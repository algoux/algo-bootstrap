// const BASE_URL =
//   process.env.NODE_ENV === 'development'
//     ? 'http://localhost:9009/algo-bootstrap-static'
//     : 'https://cdn.algoux.cn/algo-bootstrap';

const BASE_URL = 'https://cdn.algoux.cn/algo-bootstrap';

const api = {
  base: BASE_URL,
  version: BASE_URL + '/version.json',
  respack: {
    info: BASE_URL + '/respack/checksum',
    download: BASE_URL + '/respack',
    version: BASE_URL + '/respack/version.json',
  },
  res: {
    base: BASE_URL + '/res/',
  },
};

export default api;
