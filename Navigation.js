// Navigation.tsx (or Navigation.js)

import React, { useEffect } from 'react';
import { Alert, AppState, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer, useNavigationContainerRef, CommonActions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Controale from './controale';
import ControlNou from './controlnou';
import ScanPaper from './scanpaper';
import Setari from './Setari';
import styles from './style';
import { PrelevProvider } from './lib/PrelevContext';

// 🔑 Version check
import VersionCheck from 'react-native-version-check-expo';

const Stack = createStackNavigator();

function MyStack() {
    return (
        <Stack.Navigator initialRouteName="Controale">
            <Stack.Screen
                name="Controale"
                component={Controale}
                options={({ navigation }) => ({
                    headerRight: () => (
                        <TouchableOpacity onPress={() => navigation.navigate('Setari')}>
                            <Text style={styles.buttonNavi}>PAGINA DE LOGARE</Text>
                        </TouchableOpacity>
                    ),
                })}
            />
            <Stack.Screen name="Setari" component={Setari} />
            <Stack.Screen name="ScanPaper" component={ScanPaper} />
            <Stack.Screen
                name="ControlNou"
                component={ControlNou}
                options={({ route, navigation }) => ({
                    headerPressColor: '#fff',
                    title: `C ${route.params.ferma} ${route.params.datac}`,
                    headerTitleStyle: { fontSize: 16 },
                    // Custom left that POPs instead of navigating to avoid duplicating Controale
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => {
                                if (navigation.canGoBack()) {
                                    navigation.goBack();
                                } else {
                                    // Fallback if opened directly (no back stack)
                                    navigation.dispatch(
                                        CommonActions.reset({
                                            index: 0,
                                            routes: [{ name: 'Controale' }],
                                        })
                                    );
                                }
                            }}
                        >
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

    // 🔎 Check store for newer version when app comes to foreground
    async function checkForStoreUpdate() {
        try {
            const currentVersion = VersionCheck.getCurrentVersion();
            const latestVersion = await VersionCheck.getLatestVersion();
            const updateNeeded = await VersionCheck.needUpdate({
                currentVersion,
                latestVersion,
            });

            const isNeeded =
                typeof updateNeeded === 'object' ? !!updateNeeded?.isNeeded : !!updateNeeded;

            if (isNeeded) {
                Alert.alert(
                    'Actualizare disponibilă',
                    `Versiune nouă în Store: ${latestVersion}\nVersiunea instalată: ${currentVersion}`,
                    [
                        { text: 'Mai târziu', style: 'cancel' },
                        { text: 'Actualizează acum', onPress: () => VersionCheck.goToAppStore() },
                    ]
                );
            }
        } catch (e) {
            console.log('Version check failed:', e?.message ?? e);
        }
    }

    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                checkForStoreUpdate();
            }
        });
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
