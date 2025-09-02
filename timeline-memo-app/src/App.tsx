import App from './components/App';
import { AppProvider } from './context/AppContext';

function AppRoot() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}

export default AppRoot;