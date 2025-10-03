// Navigation.tsx (or Navigation.js)

import React, {useEffect, useRef} from 'react';
import {Alert, AppState, Text, TouchableOpacity, Linking} from 'react-native';
import {NavigationContainer, useNavigationContainerRef, CommonActions} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import Controale from './controale';
import ControlNou from './controlnou';
import ScanPaper from './scanpaper';
import Setari from './Setari';
import styles from './style';
import {PrelevProvider} from './lib/PrelevContext';

import VersionCheck from 'react-native-version-check-expo';


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
    const navigationRef = useNavigationContainerRef(); // ✅ define it
    const REQUIRED_BUILD = 19; // the build you’re publishing
    const lastPrompt = useRef(0);

    async function checkForForcedUpdate() {
        try {
            const currentBuild = Number(VersionCheck.getCurrentBuildNumber()); // installed build
            if (Number.isFinite(currentBuild) && currentBuild < REQUIRED_BUILD) {
                // Try to get storeUrl (we only use the URL)
                let storeUrl;
                try {
                    const res = await VersionCheck.needUpdate();
                    storeUrl = res?.storeUrl;
                } catch {}

                // throttle prompts
                const now = Date.now();
                if (now - lastPrompt.current < 10_000) return;
                lastPrompt.current = now;

                Alert.alert(
                    'Actualizare necesară',
                    `Ai versiunea ${currentBuild}. Pentru a continua, actualizează la ${REQUIRED_BUILD}.`,
                    [
                        { text: 'Mai târziu', style: 'cancel' },
                        {
                            text: 'Actualizează acum',
                            onPress: () => {
                                if (storeUrl) Linking.openURL(storeUrl);
                            },
                        },
                    ],
                );
            }
        } catch (e) {
            console.log('Build check failed:', e?.message ?? String(e));
        }
    }

    // Run when app returns to foreground + once on mount
    useEffect(() => {
        const sub = AppState.addEventListener('change', (s) => {
            if (s === 'active') checkForForcedUpdate();
        });
        checkForForcedUpdate();
        return () => sub.remove();
    }, []);

    return (
        <PrelevProvider>
            <NavigationContainer ref={navigationRef}>
                <MyStack />
            </NavigationContainer>
        </PrelevProvider>
    );
}