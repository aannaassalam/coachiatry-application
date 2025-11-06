import axios from 'axios';
import { baseUrlApi } from '../endpoints';
import { getToken } from '../../helpers/token-storage';
// import { refreshAccessToken } from "../functions/user.api";

const axiosInstance = axios.create({
  baseURL: baseUrlApi,
});

axiosInstance.interceptors.request.use(async config => {
  const token = await getToken();
  if (token && !!config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

export default axiosInstance;
