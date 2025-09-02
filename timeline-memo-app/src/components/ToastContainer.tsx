
import { Toast } from './Toast';
import { useAppContext } from '../context/AppContext';

/**
 * トースト通知を管理・表示するコンテナコンポーネント
 */
export function ToastContainer() {
  const { state, dispatch } = useAppContext();
  const { toasts } = state;

  const handleRemoveToast = (id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={handleRemoveToast}
        />
      ))}
    </div>
  );
}