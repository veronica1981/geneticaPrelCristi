import {FontAwesome5} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {Audio} from 'expo-av';
import {BarCodeScanner} from 'expo-barcode-scanner';
import PropTypes from 'prop-types';
import React, {useContext, useEffect, useState} from 'react';
import * as FileSystem from 'expo-file-system';
import {StorageAccessFramework} from 'expo-file-system';
import {
    ActivityIndicator,
    Alert,
    Button,
    KeyboardAvoidingView, Linking, PermissionsAndroid,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Modal from 'react-native-modal';
import {TextInput} from 'react-native-paper';

import Cell from './lib/Cell';
import Column from './lib/Column';
import {
    deleteControls,
    getControls,
    saveControlMeta, saveControlsService,
} from './lib/services/Services';
import Style from './style';
import CellDeleteButton from './lib/CellEditButton';
import CellIndex from './lib/CellIndex';
import {checkConnection} from './NaviUtil';
import {PrelevContext} from './lib/PrelevContext';

async function requestDirectoryPermission() {
    try {
        const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
            return permissions.directoryUri;
        } else {
            Alert.alert(
                "Permission Required",
                "Storage permission is required to save files. Please enable it in the app settings.",
                [
                    {text: "Cancel", style: "cancel"},
                    {text: "Open Settings", onPress: () => Linking.openSettings()}
                ]
            );
            return null;
        }
    } catch (err) {
        console.warn(err);
        return null;
    }
}

const getTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}`;
};

async function saveCSV(linii, ferma, datac) {
    const directoryUri = await requestDirectoryPermission();
    if (!directoryUri) {
        Alert.alert('Permission denied', 'Cannot save file without storage permission');
        return;
    }

    try {
        const csvData = linii.map(row => {
            return [row[0].value, row[2], datac, row[1].value].join(",");
        }).join("\n");
        const timestamp = getTimestamp();
        const baseFileName = `${ferma}_${datac}_export_${timestamp}`;
        const extension = '.csv';
        let fileName = baseFileName + extension;

        // Create the file in the selected directory
        const fileUri = await StorageAccessFramework.createFileAsync(directoryUri, fileName, 'application/csv');

        // Write the CSV data to the file
        await StorageAccessFramework.writeAsStringAsync(fileUri, csvData);

        const formattedPath = decodeURIComponent(fileUri.split('document/primary%3A')[1]).replace('%2F', '/');

        Alert.alert('Fisierul CSV a fost salvat', `S-a salvat in directorul: ${formattedPath}`);

        // Log the file path to verify
        console.log('File saved at:', fileUri);
    } catch (err) {
        Alert.alert('Error', `Unable to save file: ${err.message}`);
    }
}


const columns = [
    {
        value: '',
        input: 'c1',
        width: 5,
        sortable: true,
        defaultSort: 'ASC',
        reorder: true,
    },
    {
        value: '#',
        input: 'c2',
        width: 15,
        sortable: true,
        defaultSort: 'ASC',
        reorder: true,
    },
    {
        value: 'Crot',
        input: 'c3',
        width: 27.5,
        sortable: false,
        reorder: true,
    },
    {
        value: 'Cant',
        input: 'c4',
        width: 27.5,
        sortable: true,
    },
    {
        value: 'Cupa',
        input: 'c5',
        width: 27.5,
        sortable: true,
    },
];
const values = [
    [{value: '', editable: true}, {value: '', editable: true}, 890756453],
    [{value: '', editable: true}, {value: '', editable: true}, 890756454],
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
    const sortIndex = columns.findIndex(
        (c) => c.hasOwnProperty('defaultSort') === true
    );

    const [sort, setSort] = useState(
        sortIndex !== undefined ? columns[sortIndex].defaultSort : null
    );

    const [sortColumnIndex, setSortColumnIndex] = useState(
        sortIndex !== undefined ? sortIndex : null
    );

    const [scanned, setScanned] = useState(false);
    const [text, setText] = useState('');
    const [sound, setSound] = useState(new Audio.Sound());
    const [rows, setRows] = useState(values.length);
    const [linii, setLinii] = useState([]);
    let columnWidths = columns.map((c) => c.width);
    const [widths, setnWidths] = useState(_calculateCellWidths(columnWidths));
    const [hasPermission, setHasPermission] = useState(null);
    const [hasPermissionWrite, setHasPermissionWrite] = useState(null);
    const [asc, setAsc] = useState(false);
    const [displayId, setDisplayId] = useState(linii.length);
    const [liniiNoi, setLiniiNoi] = useState('1');
    const [scaneaza, setScaneaza] = useState(false);
    const [collapsed, setCollapsed] = useState(true);
    const [codManual, setCodManual] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setloading] = useState(false);
    const navigation = useNavigation();
    const {selectedPrelev} = useContext(PrelevContext);
    const {id: selectedPrelevId} = selectedPrelev;

    useEffect(() => {
        const fetchControls = async () => {
            if (route.params.controlId) {
                setloading(true); // Assume loading starts here
                try {
                    const items = await getControls(route.params.controlId);
                    if (items.length > 0) {
                        setLinii(items.map((item) => [
                            { value: item['crot'], editable: true },
                            { value: item['cant'], editable: true },
                            item['codbare'],
                        ]));
                    }
                } catch (error) {
                    Alert.alert("Nu s-a putut incarca controlul:", error.toString());
                } finally {
                    setloading(false); // Ensure loading is set to false even on error
                }
            }
        };

        fetchControls();
    }, [route.params.controlId]);

    async function playSound() {
        const {sound} = await Audio.Sound.createAsync(
            require('./assets/beep.mp3')
        );

        setSound(sound);

        await sound.playAsync();
    }

    const toggleExpanded = () => {
        //Toggling the state of single Collapsible
        setCollapsed(!collapsed);
        if (collapsed == true) {
            setScanned(true);
        } else {
            setScanned(false);
        }
    };

    async function saveControls() {
        if (await checkConnection()) {
            const controlId = route.params.controlId;
            var liniiD = linii.map((e) => e[0].value);
            var duplicates = liniiD.filter(function (value, index, self) {
                return (
                    self.indexOf(value) !== self.lastIndexOf(value) &&
                    self.indexOf(value) === index
                );
            });

            if (duplicates.length > 0) {
                Alert.alert('Crotalii duplicate   ' + duplicates, '', [
                    {
                        text: 'OK',
                        style: 'cancel',
                        onPress: () => {
                        },
                    },
                ]);
                return;
            }

            try {
                console.log("Checking controlId and saved status", controlId, saved);

                if (!controlId && !saved) {
                    const contrid = await saveControlMeta(route.params.ferma, route.params.datac, selectedPrelevId, linii);
                    await saveControlsService(linii, contrid);

                    setSaved(true);
                } else {
                    await deleteControls(linii, controlId);
                }

                setHasChanges(false);

                Alert.alert('Salvarea s-a efectuat.', '', [
                    {
                        text: 'OK',
                        onPress: () => {
                            console.log("Success alert OK pressed");
                        },
                        style: 'cancel',
                    },
                ]);
            } catch (error) {
                console.error("Error during save/delete process:", error);
                Alert.alert(error.message, 'Eroare la salvare, probabil nu aveti conexiune internet. Salvati controlul prin butonul CSV ca sa nu pierdeti datele.');
            }
        } else {

            Alert.alert('Nu există conexiune la internet. Doriti ca datele sa fie salvate ca CSV.', '', [
                {
                    text: 'OK',
                    onPress: async () => {
                        await saveCSV(linii, route.params.ferma, route.params.datac);
                    },
                    style: 'cancel',
                },
            ]);

        }
    }

    React.useEffect(() => {
        return sound
            ? () => {
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    React.useEffect(
        () =>
            navigation.addListener('beforeRemove', (e) => {
                setScaneaza(false);
                if (!hasChanges) return;
                const action = e.data.action;

                e.preventDefault();

                Alert.alert('Vreti sa parasiti pagina fara sa salvati?', '', [
                    {
                        text: 'RAMAN PE PAGINA',
                        style: 'cancel',
                        onPress: () => {
                        },
                    },
                    {
                        text: 'IESIRE FARA SALVARE',
                        style: 'destructive',
                        onPress: () => navigation.dispatch(action),
                    },
                ]);
            }),
        [navigation, hasChanges]
    );


    useEffect(() => {
        const requestPermissions = async () => {
            const cameraPermission = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(cameraPermission.status === 'granted');
        };

        requestPermissions();
    }, []);

    function createColumns(columns) {
        return columns.map((c, i) => {
            let borders = {};
            if (headerBorders) {
                borders = _createBorderStyles(i, columns.length);
            }
            return (
                <Column
                    {...c}
                    key={c.input}
                    column={c}
                    index={i}
                    customStyles={customStyles}
                    borderStyle={borders}
                    onColumnChange={onColumnChange}
                    height={cellHeight}
                    width={widths[i]}
                    sortColumn={sortColumn}
                />
            );
        });
    }

    function sortColumn(colIndex) {
        let sortedAsceding;

        if (asc) {
            if (colIndex == 4) {
                sortedAsceding = linii.sort((a, b) => {
                    return Number(b[2]) - Number(a[2]);
                });
            } else {
                sortedAsceding = linii.sort((a, b) => {
                    return (
                        Number(b[colIndex - 2].value) -
                        Number(a[colIndex - 2].value)
                    );
                });
            }
        } else {
            if (colIndex == 4) {
                sortedAsceding = linii.sort((a, b) => {
                    return Number(a[2]) - Number(b[2]);
                });
            }
            sortedAsceding = linii.sort((a, b) => {
                return (
                    Number(a[colIndex - 2].value) -
                    Number(b[colIndex - 2].value)
                );
            });
        }
        setAsc(!asc);

        return setLinii([...sortedAsceding]);
    }

    function createRows(rows) {
        let count = 0;
        let arr = rows.map((row, i) => {
            const isLastRow = rows.length - 1 === i;
            const rowStyle = [Style.row, customStyles.row, {}];

            return (
                <View key={row[2]} style={rowStyle}>
                    {createRow(row, i)}
                </View>
            );
        });
        return arr.reverse();

        //sortColumn(2)
    }

    function createRow(row, rowIndex) {
        let addColIndex = 0;
        var cells = row.map((cell, colIndex) => {
            colIndex = colIndex + addColIndex;
            if (cell.hasOwnProperty('span')) {
                addColIndex += cell.span - 1;
            }
            let borderStyle = {};
            if (borders) {
                borderStyle = _createBorderStyles(colIndex, row.length);
            }
            return createCell(
                cell,
                colIndex,
                rowIndex,
                borderStyle,
                onCellChange
            );
        });
        return [
            route.params.definitiv == false ? createCellDelete('', 0, row, rowIndex, 0.5) : null,
            createCellIndex('', 1, rowIndex, 0.5),
            cells,
        ];
    }

    function createCellDelete(cell, colIndex, row, rowIndex, borderStyle) {
        return (
            <CellDeleteButton
                value={rowIndex}
                key={colIndex}
                index={colIndex}
                customStyles={customStyles}
                borderStyle={borderStyle}
                height={cellHeight}
                width={0.14}
                column={colIndex}
                row={row}
                rowIndex={rowIndex}
                deleteRow={deleteRow}
            />
        );
    }

    function deleteRow(row) {
        return setLinii(linii.filter((linie) => linie !== row));
    }

    function createCellIndex(cell, colIndex, rowIndex, borderStyle) {
        return (
            <CellIndex
                value={cell}
                key={colIndex}
                index={colIndex}
                customStyles={customStyles}
                borderStyle={borderStyle}
                height={cellHeight}
                width={0.42}
                column={colIndex}
                row={rowIndex}
                displayId={displayId}
            />
        );
    }

    function createCell(cell, colIndex, rowIndex, borderStyle) {
        let columnInput = columns[colIndex].input;
        columnInput += `-${rowIndex}-${colIndex}`;
        if (typeof cell === 'object') {
            let width = widths[colIndex];
            if (cell.hasOwnProperty('span')) {
                const span = cell.span;
                if (span + colIndex <= columns.length) {
                    for (let i = 1; i < span; i++) {
                        width += widths[colIndex + i];
                    }
                }
            }
            return (
                <Cell
                    {...cell}
                    key={colIndex}
                    index={colIndex}
                    customStyles={customStyles}
                    borderStyle={borderStyle}
                    height={cellHeight}
                    width={0.76}
                    input={columnInput}
                    column={colIndex}
                    row={rowIndex}
                    onCellChange={onCellChange}
                />
            );
        }

        return (
            <Cell
                value={cell}
                key={colIndex}
                index={colIndex}
                customStyles={customStyles}
                borderStyle={borderStyle}
                height={cellHeight}
                width={0.76}
                input={columnInput}
                column={colIndex}
                row={rowIndex}
            />
        );
    }

    function _createBorderStyles(i, length) {
        return {
            borderRightWidth: length - 1 > i ? 0.5 : 0,
        };
    }

    function _calculateCellWidths(widths) {
        const widthFlexs = [];
        for (let i = 0; i < widths.length; i++) {
            widthFlexs.push(widths.length * (widths[i] * 0.01));
        }
        return widthFlexs;
    }

    function onCellChange(value, column, row, unique_id) {
        let items = [...linii];
        items[row][column].value = value;

        setLinii(items);
    }

    const showConfirmDialog = () => {
        return Alert.alert(
            'Are your sure?',
            'Are you sure you want to remove this beautiful box?',
            [
                // The "Yes" button
                {
                    text: 'Yes',
                    onPress: () => {
                        setShowBox(false);
                    },
                },
                // The "No" button
                // Does nothing but dismiss the dialog when tapped
                {
                    text: 'No',
                },
            ]
        );
    };

    function handleBarCodeScanned({data}) {
        playSound();
        if (linii.some((linie) => linie[2].toString() === data)) {
            setText(undefined);
        } else {
            setText(data);
        }
        setScanned(true);
        setScaneaza(false);
    }

    function scannedfunc() {
        return undefined;
    }

    function existent(text) {
        return text !== undefined;
    }

    if (hasPermission === null || hasPermissionWrite) {
        return (
            <View style={Style.container}>
                <Text>Requesting for camera permission</Text>
            </View>
        );
    }
    if (hasPermission === false || hasPermissionWrite) {
        return (
            <View style={Style.container}>
                <Text style={{margin: 10}}>No access to camera or files</Text>
                <Button
                    title={'Acorda Permisiuni'}
                    onPress={() => {
                        askForCameraPermission();
                        askForFilePermission()
                    }}
                />
            </View>
        );
    }
    return (
        <ScrollView style={{flex: 1}}>
            {route.params.definitiv == false ? (
                <TouchableOpacity
                    style={{
                        height: 60,
                        justifyContent: 'center',
                        margin: 5,
                        alignItems: 'center',
                        borderRadius: 10, // Rounded corners
                        shadowRadius: 10,
                        elevation: 2, // Shadow for Android
                    }}
                    onPress={saveControls}
                >
                    <Text
                        style={{
                            color: 'red',
                            fontSize: 24,
                        }}
                    >
                        SALVEAZĂ
                    </Text>
                </TouchableOpacity>
            ) : (
                <Text
                    style={{
                        color: 'red',
                        fontSize: 24,
                    }}
                >
                    CONTROL DEFINITIV, NU SE MAI POATE MODIFICA!
                </Text>
            )}
            {loading && (
                <View style={Style.containerBarCode}>
                    <ActivityIndicator size="large" color="#0000ff"/>
                    <Text
                        style={{
                            textAlign: 'center',
                            fontSize: 20,
                        }}
                    >
                        Se incarca controlul!
                    </Text>
                </View>
            )}
            <TouchableOpacity
                style={{
                    height: 30,
                    justifyContent: 'center',
                    width: 100,
                    margin: 10,
                    alignItems: 'center',
                    backgroundColor: '#28a745',
                    borderRadius: 15,
                    flexDirection: 'row',
                    paddingHorizontal: 10,
                }}
                onPress={() => saveCSV(linii, route.params.ferma, route.params.datac)}
            >
                <FontAwesome5 name="file-excel" size={24} color="white" style={{marginRight: 10}}/>
                <Text
                    style={{
                        color: 'white',
                        fontSize: 24,
                    }}
                >
                    CSV
                </Text>
            </TouchableOpacity>
            <View style={Style.containerBarCode}>
                <View
                    style={{
                        flex: 1,
                    }}
                >
                    {/* <Collapsible collapsed={collapsed}> */}
                    <View
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            marginTop: 10,
                            marginBottom: 10,
                            justifyContent: 'space-between',
                        }}
                    >
                        {route.params.definitiv == false ? (
                            <View style={Style.barcodebox}>
                                {scaneaza && (
                                    <BarCodeScanner
                                        barCodeTypes={["code128"]}
                                        onBarCodeScanned={scanned ? scannedfunc : handleBarCodeScanned}
                                        style={{
                                            width: 250,
                                            height: 250,
                                        }}
                                    />

                                )}
                            </View>
                        ) : (
                            <View></View>
                        )}

                        <TouchableOpacity
                            style={{
                                backgroundColor: 'tomato',
                                borderRadius: 30,
                                justifyContent: 'center',
                                flex: 0.9,
                            }}
                            onPress={() => {
                                setScanned(false);
                                setScaneaza(true);
                            }}
                        >
                            <Text
                                style={{
                                    color: 'white',
                                    fontSize: 28,
                                }}
                            >
                                {' '}
                                Scanează{' '}
                                <FontAwesome5
                                    size={30}
                                    color="white"
                                    name="barcode"
                                />
                            </Text>
                        </TouchableOpacity>

                    </View>

                    {existent(text) ? (
                        <Modal
                            isVisible={text !== ''}
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                flex: 0.8,
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    marginLeft: 30,
                                    width: 200,
                                    height: 100,
                                    backgroundColor: '#2196f3',
                                }}
                                onPress={() => {
                                    setLinii([
                                        ...linii,
                                        [
                                            {
                                                value: '',
                                                editable: true,
                                            },
                                            {
                                                value: '',
                                                editable: true,
                                            },
                                            parseInt(text),
                                        ],
                                    ]);
                                    setText('');
                                }}
                            >
                                <Text
                                    style={{
                                        color: 'white',
                                        textAlign: 'center',
                                        fontSize: 30,
                                    }}
                                >
                                    {text}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{
                                    width: 200,
                                    height: 100,
                                    backgroundColor: 'red',
                                }}
                                onPress={() => {
                                    setText('');
                                }}
                            >
                                <Text
                                    style={{
                                        color: 'white',
                                        textAlign: 'center',
                                        fontSize: 30,
                                    }}
                                ></Text>
                            </TouchableOpacity>
                        </Modal>
                    ) : (
                        <Modal
                            isVisible={text !== ''}
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                flex: 0.8,
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    width: 200,
                                    height: 100,
                                    backgroundColor: 'red',
                                }}
                                onPress={() => {
                                    setText('');
                                }}
                            >
                                <Text
                                    style={{
                                        color: 'white',
                                        textAlign: 'center',
                                        fontSize: 30,
                                    }}
                                >
                                    {text}
                                </Text>
                            </TouchableOpacity>
                        </Modal>
                    )}
                    {/* </Collapsible> */}
                </View>

                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                    }}
                >
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#2196f3',
                            borderRadius: 10,
                            padding: 1,
                        }}
                        onPress={() => {
                            setHasChanges(true);
                            var arr = linii.sort((a, b) => {
                                return Number(a[2]) - Number(b[2]);
                            });
                            if (codManual) {
                                let cod = [
                                    {value: '', editable: true},
                                    {value: '', editable: true},
                                    parseInt(codManual),
                                ];

                                let newLines = [];
                                if (parseInt(liniiNoi) > 1) {
                                    for (var i = 0; i < parseInt(liniiNoi); i++) {
                                        newLines.push([
                                            {value: '', editable: true},
                                            {value: '', editable: true},
                                            parseInt(codManual) + i,
                                        ]);
                                    }
                                } else {
                                    newLines.push(cod);
                                }

                                setLinii([...arr, ...newLines]);
                                setCodManual('');
                                setLiniiNoi('1');
                            } else {
                                let newLines = [];
                                if (linii.length > 0) {
                                    for (var i = 0; i < parseInt(liniiNoi); i++) {
                                        newLines.push([
                                            {value: '', editable: true},
                                            {value: '', editable: true},
                                            parseInt(linii[linii.length - 1][2] + i + 1),
                                        ]);
                                    }
                                }

                                setLinii([...arr, ...newLines]);
                                setLiniiNoi('1');
                            }
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 28,
                                color: 'white',
                                textAlign: 'center',
                                textAlignVertical: 'center',
                            }}
                        >
                            Adaugă
                        </Text>
                    </TouchableOpacity>

                    <TextInput
                        minWidth={100}
                        label="Urmatoarele"
                        fontWeight="bold"
                        keyboardType="decimal-pad"
                        fontSize={30}
                        textAlign="center"
                        value={liniiNoi}
                        onChangeText={(text) => {
                            setLiniiNoi(text);
                        }}
                        type="outlined"
                    />
                    <TextInput
                        minWidth={150}
                        label="Cod bare"
                        fontWeight="bold"
                        keyboardType="decimal-pad"
                        fontSize={30}
                        textAlign="center"
                        value={codManual}
                        onChangeText={(text) => {
                            setCodManual(text);
                        }}
                        type="outlined"
                    />
                </View>

                <View>
                    <View
                        style={[
                            Style.container,
                            style,
                            {minHeight: cellHeight},
                        ]}
                    >
                        <KeyboardAvoidingView
                            style={{flex: 1}}
                            behavior={Platform.OS === 'ios' ? 'position' : null}
                            keyboardVerticalOffset={
                                Platform.OS === 'ios' ? 50 : 70
                            }
                        >
                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: 'column',
                                    padding: 10,
                                }}
                            >
                                <View style={[Style.row, customStyles.row]}>
                                    {createColumns(columns)}
                                </View>
                                {createRows(linii)}
                            </View>
                        </KeyboardAvoidingView>
                    </View>
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
