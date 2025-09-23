import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { Camera, CameraView } from 'expo-camera';
import PropTypes from 'prop-types';
import React, { useContext, useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system';
import {
    ActivityIndicator,
    Alert,
    Button,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Modal from 'react-native-modal';
import { TextInput } from 'react-native-paper';

import Cell from './lib/Cell';
import Column from './lib/Column';
import {
    deleteControls,
    getControls,
    saveControlMeta,
    saveControlsService,
} from './lib/services/Services';
import Style from './style';
import CellDeleteButton from './lib/CellEditButton';
import CellIndex from './lib/CellIndex';
import { checkConnection } from './NaviUtil';
import { PrelevContext } from './lib/PrelevContext';

/**
 * === HELPER: Request directory permission for CSV export ===
 */
async function requestDirectoryPermission() {
    try {
        const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
            return permissions.directoryUri;
        } else {
            Alert.alert(
                'Permission Required',
                'Storage permission is required to save files. Please enable it in the app settings.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open Settings', onPress: () => Linking.openSettings() },
                ]
            );
            return null;
        }
    } catch (err) {
        console.warn(err);
        return null;
    }
}

/**
 * === HELPER: Save CSV ===
 */
async function saveCSV(linii, ferma, datac) {
    const directoryUri = await requestDirectoryPermission();
    if (!directoryUri) {
        Alert.alert(
            'Permission denied',
            'Cannot save file without storage permission'
        );
        return;
    }

    try {
        const csvData = linii
            .map((row) => {
                return [row[0].value, row[2], datac, row[1].value].join(',');
            })
            .join('\n');

        const timestamp = new Date()
            .toISOString()
            .replace(/[-:]/g, '')
            .replace(/\..+/, '');
        const fileName = `${ferma}_${datac}_export_${timestamp}.csv`;

        const fileUri = await StorageAccessFramework.createFileAsync(
            directoryUri,
            fileName,
            'application/csv'
        );

        await StorageAccessFramework.writeAsStringAsync(fileUri, csvData);

        Alert.alert('Fisierul CSV a fost salvat', `Path: ${fileUri}`);
        console.log('File saved at:', fileUri);
    } catch (err) {
        Alert.alert('Error', `Unable to save file: ${err.message}`);
    }
}

/**
 * === TABLE COLUMNS CONFIG ===
 */
const columns = [
    { value: '', input: 'c1', width: 5 },
    { value: '#', input: 'c2', width: 15 },
    { value: 'Crot', input: 'c3', width: 27.5 },
    { value: 'Cant', input: 'c4', width: 27.5 },
    { value: 'Cupa', input: 'c5', width: 27.5 },
];

const values = [
    [{ value: '', editable: true }, { value: '', editable: true }, 890756453],
    [{ value: '', editable: true }, { value: '', editable: true }, 890756454],
];

export default function ControlNou({
                                       customStyles,
                                       style,
                                       cellHeight,
                                       headerBorders,
                                       onColumnChange,
                                       borders,
                                       onCellChange,
                                       route,
                                   }) {
    const navigation = useNavigation();
    const { selectedPrelev } = useContext(PrelevContext);
    const { id: selectedPrelevId } = selectedPrelev;

    const [linii, setLinii] = useState([]);
    const [scanned, setScanned] = useState(false);
    const [scaneaza, setScaneaza] = useState(false);
    const [text, setText] = useState('');
    const [sound, setSound] = useState(null);
    const [hasPermission, setHasPermission] = useState(null);
    const [loading, setLoading] = useState(false);

    /**
     * === SOUND HANDLING ===
     */
    async function playSound() {
        const { sound } = await Audio.Sound.createAsync(
            require('./assets/beep.mp3')
        );
        setSound(sound);
        await sound.playAsync();
    }

    useEffect(() => {
        return sound
            ? () => {
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    /**
     * === CAMERA PERMISSIONS ===
     */
    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    /**
     * === BARCODE SCAN ===
     */
    function handleBarCodeScanned({ data }) {
        playSound();

        if (linii.some((linie) => linie[2].toString() === data)) {
            setText(undefined);
        } else {
            setText(data);
        }

        setScanned(true);
        setScaneaza(false);
    }

    if (hasPermission === null) {
        return (
            <View style={Style.container}>
                <Text>Requesting for camera permission…</Text>
            </View>
        );
    }
    if (hasPermission === false) {
        return (
            <View style={Style.container}>
                <Text>No access to camera</Text>
                <Button
                    title="Allow Camera"
                    onPress={async () => {
                        const { status } = await Camera.requestCameraPermissionsAsync();
                        setHasPermission(status === 'granted');
                    }}
                />
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1 }}>
            {/* Save button */}
            {route.params.definitiv === false && (
                <TouchableOpacity
                    style={{
                        height: 60,
                        justifyContent: 'center',
                        margin: 5,
                        alignItems: 'center',
                        borderRadius: 10,
                    }}
                    onPress={() => saveCSV(linii, route.params.ferma, route.params.datac)}
                >
                    <Text style={{ color: 'red', fontSize: 24 }}>SALVEAZĂ</Text>
                </TouchableOpacity>
            )}

            {/* Barcode scanner */}
            <View style={Style.containerBarCode}>
                <View style={{ flex: 1 }}>
                    {route.params.definitiv === false && (
                        <View style={Style.barcodebox}>
                            {scaneaza && !scanned && (
                                <CameraView
                                    barcodeScannerSettings={{ barcodeTypes: ['code128'] }}
                                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                                    style={{ width: 250, height: 250 }}
                                />
                            )}
                        </View>
                    )}

                    <TouchableOpacity
                        style={{
                            backgroundColor: 'tomato',
                            borderRadius: 30,
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 10,
                            marginVertical: 20,
                        }}
                        onPress={() => {
                            setScanned(false);
                            setScaneaza(true);
                        }}
                    >
                        <Text style={{ color: 'white', fontSize: 28 }}>
                            Scanează <FontAwesome5 size={30} color="white" name="barcode" />
                        </Text>
                    </TouchableOpacity>

                    {/* Scan result modal */}
                    <Modal isVisible={!!text}>
                        <TouchableOpacity
                            style={{ backgroundColor: '#2196f3', padding: 20 }}
                            onPress={() => {
                                setLinii([
                                    ...linii,
                                    [
                                        { value: '', editable: true },
                                        { value: '', editable: true },
                                        parseInt(text),
                                    ],
                                ]);
                                setText('');
                            }}
                        >
                            <Text style={{ color: 'white', fontSize: 30, textAlign: 'center' }}>
                                {text}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ backgroundColor: 'red', padding: 20 }}
                            onPress={() => setText('')}
                        >
                            <Text style={{ color: 'white', fontSize: 30, textAlign: 'center' }}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </Modal>
                </View>
            </View>
        </ScrollView>
    );
}

ControlNou.defaultProps = {
    values: [],
    emptyRows: 1,
    borders: false,
    headerBorders: false,
    style: {},
    customStyles: {},
    cellHeight: 40,
};

ControlNou.propTypes = {
    columns: PropTypes.array,
    values: PropTypes.array,
    emptyRows: PropTypes.number,
    cellHeight: PropTypes.number,
    onCellChange: PropTypes.func,
    onColumnChange: PropTypes.func,
    customStyles: PropTypes.object,
    borders: PropTypes.bool,
    headerBorders: PropTypes.bool,
};
