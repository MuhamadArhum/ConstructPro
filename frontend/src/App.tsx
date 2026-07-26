import { CssBaseline, ThemeProvider } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { theme } from './theme/theme';
import AppRoutes from './routes/AppRoutes';
import GlobalSnackbar from './components/common/GlobalSnackbar';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AppRoutes />
          <GlobalSnackbar />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
