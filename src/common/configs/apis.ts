const BASE_URL = process.env.NODE_ENV === 'development' ?
  'http://localhost:9009/algo-bootstrap-static' :
  'https://algoux.org/downloads';

const api = {
  base: BASE_URL,
  version: BASE_URL + '/algo-bootstrap/version.json',
  respack: {
    info: BASE_URL + '/respack/checksum',
    download: BASE_URL + '/respack',
    version: BASE_URL + '/respack/version.json',
  },
};

export default api;
