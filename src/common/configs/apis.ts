const BASE_URL = process.env.NODE_ENV === 'development' ?
  'http://localhost:9000/algo-bootstrap-static' :
  'http://192.168.31.230:9000/algo-bootstrap-static';

const api = {
  base: BASE_URL,
  respack: {
    info: BASE_URL + '/info',
    download: BASE_URL + '/respack',
  },
};

export default api;
