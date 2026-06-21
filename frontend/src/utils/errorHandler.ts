import toast from 'react-hot-toast';


/**
 * Standardized error handler for API responses.
 * Extracts the message from Axios error format or falls back to a default.
 * Automatically shows a toast notification.
 */
export const handleError = (error: any, defaultMessage?: string, options?: any) => {
  if (typeof error === 'string') {
    toast.error(error, options);
    return error;
  }
  console.error('[Error Handler]:', error);
  const message = error?.response?.data?.message || error?.message || defaultMessage || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
  toast.error(message, options);
  return message;
};
