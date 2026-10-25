// Navigation.tsx (or Navigation.js)

import React, {useEffect, useRef} from 'react';
import {Alert, AppState, Text, TouchableOpacity, Linking, Platform} from 'react-native';
import {NavigationContainer, useNavigationContainerRef, CommonActions} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import Controale from './controale';
import ControlNou from './controlnou';
import ScanPaper from './scanpaper';
import Setari from './Setari';
import styles from './style';
import {PrelevProvider} from './lib/PrelevContext';

import * as InAppUpdates from 'expo-in-app-updates';
import DeviceInfo from 'react-native-device-info';


const Stack = createStackNavigator();

// No "later" button: leaving for the store and coming back re-runs the check
let updateAlertVisible = false;
function showUpdateAlert(openStore) {
    if (updateAlertVisible) return;
    updateAlertVisible = true;
    Alert.alert(
        'Actualizare necesară',
        'Există o versiune nouă a aplicației. Pentru a continua, actualizează aplicația.',
        [{text: 'Actualizează acum', onPress: () => {
            updateAlertVisible = false;
            openStore();
        }}],
        {cancelable: false},
    );
}

async function getAppStoreVersion(bundleId) {
    // The app may only be listed in the Romanian store, so try it before the default (US) one
    for (const country of ['ro', '']) {
        const res = await fetch(
            `https://itunes.apple.com/lookup?bundleId=${bundleId}${country ? `&country=${country}` : ''}&t=${Date.now()}`,
        );
        const json = await res.json();
        const app = json?.results?.[0];
        if (app?.version) return {version: app.version, url: app.trackViewUrl};
    }
    return null;
}

function isNewer(storeVersion, installedVersion) {
    const a = String(storeVersion).split('.').map(Number);
    const b = String(installedVersion).split('.').map(Number);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const diff = (a[i] || 0) - (b[i] || 0);
        if (diff !== 0) return diff > 0;
    }
    return false;
}

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
    const checking = useRef(false);

    async function checkForForcedUpdate() {
        if (checking.current) return;
        checking.current = true;
        try {
            if (Platform.OS === 'android') {
                // Asks Google Play directly whether a newer versionCode is published.
                // Only works for installs that came from the Play Store.
                const info = await InAppUpdates.checkForUpdate();
                if (!info.updateAvailable) return;
                if (info.updateInProgress || info.immediateAllowed) {
                    // Full-screen Play update; if cancelled, the next foreground re-triggers it
                    await InAppUpdates.startUpdate(true);
                } else {
                    showUpdateAlert(() => Linking.openURL(`market://details?id=${DeviceInfo.getBundleId()}`));
                }
            } else if (Platform.OS === 'ios') {
                const store = await getAppStoreVersion(DeviceInfo.getBundleId());
                if (store && isNewer(store.version, DeviceInfo.getVersion())) {
                    showUpdateAlert(() => Linking.openURL(store.url));
                }
            }
        } catch (e) {
            console.log('Update check failed:', e?.message ?? String(e));
        } finally {
            checking.current = false;
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