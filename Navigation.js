import {NavigationContainer, useNavigationContainerRef} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import React, {useEffect} from 'react';
import Controale from './controale';
import ControlNou from './controlnou';
import ScanPaper from './scanpaper';
import Setari from './Setari';
import styles from './style';
import {checkConnection} from './NaviUtil';
import {TouchableOpacity, Text, Alert, AppState} from 'react-native';
import appConfig from './app.json';
import {PrelevProvider} from './lib/PrelevContext';

const versionCode = appConfig.expo.android.versionCode;
const Stack = createStackNavigator();

function MyStack() {
    return (
        <Stack.Navigator initialRouteName="Controale">
            <Stack.Screen
                name="Controale"
                component={Controale}
                options={({navigation}) => ({
                    headerRight: () => (
                        <TouchableOpacity onPress={() => navigation.navigate('Setari')}>
                            <Text style={styles.buttonNavi}>PAGINA DE LOGARE</Text>
                        </TouchableOpacity>
                    ),
                })}
            />
            <Stack.Screen name="Setari" component={Setari}/>
            <Stack.Screen name="ScanPaper" component={ScanPaper}/>
            <Stack.Screen
                name="ControlNou"
                component={ControlNou}
                options={({route, navigation}) => ({
                    headerPressColor: '#fff',
                    title: 'C ' + route.params.ferma + ' ' + route.params.datac,
                    headerTitleStyle: {
                        fontSize: 16,
                    },
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Controale')}>
                            <Text style={styles.buttonNavi2}>INAPOI CONTROALE</Text>
                        </TouchableOpacity>
                    ),
                })}
            />
        </Stack.Navigator>
    );
}

export default function Navigation() {
    const navigationRef = useNavigationContainerRef();
    useEffect(() => {
        // Listener for AppState to show version code when the app becomes active
        const appStateSubscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active' && versionCode < 7) {
                Alert.alert('Actual version code: ' + versionCode);
            }
        });
        return () => {
            appStateSubscription.remove();
        };
    }, [navigationRef]);


    return (
        <PrelevProvider>
            <NavigationContainer ref={navigationRef}>
                <MyStack/>
            </NavigationContainer>
        </PrelevProvider>
    );
}
