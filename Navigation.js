import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import Controale from './controale';
import ControlNou from './controlnou';
import ScanPaper from './scanpaper';
import Setari from './Setari';
import styles from './style';
import { TouchableOpacity, Text, Alert, AppState } from 'react-native';
import { PrelevProvider } from './lib/PrelevContext';

// 🔑 Dependencies for version check
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
                    title: 'C ' + route.params.ferma + ' ' + route.params.datac,
                    headerTitleStyle: {
                        fontSize: 16,
                    },
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => navigation.navigate('Controale')}>
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

    // 🔎 Function to check app store for a newer version
    async function checkForStoreUpdate() {
        try {
            const currentVersion = VersionCheck.getCurrentVersion(); // local app version (from app.json/build)
            const latestVersion = await VersionCheck.getLatestVersion(); // latest from store
            const updateNeeded = await VersionCheck.needUpdate({
                currentVersion,
                latestVersion,
            });

            const isNeeded = typeof updateNeeded === 'object' ? updateNeeded?.isNeeded : !!updateNeeded;

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
            console.log('Version check failed:', e.message);
        }
    }

    useEffect(() => {
        // run on app foreground
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
