import {Provider} from 'react-redux';
import store from './src/redux/store';
import { NavigationContainer } from "@react-navigation/native";
import Routes from "./src/routes/Route";

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Routes />
      </NavigationContainer>
    </Provider>
  );
}
