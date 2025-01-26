// authorization.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Axios yapılandırması
const api = axios.create({
  baseURL: 'http://192.168.1.21:3000', // API adresiniz
});

// Token eklemek için Axios interceptor
api.interceptors.request.use(
  async (config) => {
    // AsyncStorage'den token'ı alıyoruz
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`; // Token'ı başlığa ekliyoruz
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Kullanıcı giriş yaptıktan sonra token'ı kaydetmek için fonksiyon
const setToken = async (token) => {
  try {
    await AsyncStorage.setItem('userToken', token); // Token'ı AsyncStorage'e kaydediyoruz
  } catch (error) {
    console.error('Error saving token', error);
  }
};

// Kullanıcı token'ını kaldırmak için fonksiyon
const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('userToken'); // Token'ı AsyncStorage'den kaldırıyoruz
  } catch (error) {
    console.error('Error removing token', error);
  }
};

// Token'ı almak için fonksiyon
const getToken = async () => {
  try {
    return await AsyncStorage.getItem('userToken'); // AsyncStorage'den token'ı alıyoruz
  } catch (error) {
    console.error('Error getting token', error);
  }
};

// API ile yapılan işlemleri dışa aktarıyoruz
export { api, setToken, removeToken, getToken };
