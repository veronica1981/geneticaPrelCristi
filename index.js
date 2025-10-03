import { registerRootComponent } from 'expo';
import 'react-native-gesture-handler';
import Navigation from './Navigation';
import { BackHandler } from 'react-native';
if (typeof BackHandler.removeEventListener !== 'function') {
    // @ts-ignore
    BackHandler.removeEventListener = () => {};
}
import { enableScreens } from 'react-native-screens';
enableScreens();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Navigation);
