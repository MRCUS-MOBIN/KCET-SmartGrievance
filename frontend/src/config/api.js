// Centralized API configuration for KCET SmartGrievance

const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  return 'http://localhost:5000/api';
};

const getNlpUrl = () => {
  const envUrl = import.meta.env.VITE_NLP_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  return 'http://localhost:8001';
};

export const API = getBackendUrl();
export const NLP_API = getNlpUrl();
