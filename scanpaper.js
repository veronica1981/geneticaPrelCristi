import {FontAwesome5} from '@expo/vector-icons'
import {useNavigation} from '@react-navigation/native'
import {Audio} from 'expo-av'
import {BarCodeScanner} from 'expo-barcode-scanner'
import PropTypes from 'prop-types'
import {React, useContext, useEffect, useState} from 'react'
import {Button, ScrollView, Text, TouchableOpacity, View} from 'react-native'
import Modal from 'react-native-modal'
import ControlNou from './controlnou'
import Style from './style'
import {checkConnection} from './NaviUtil';
import {PrelevContext} from './lib/PrelevContext';

export default function ScanPaper() {
    const [sound, setSound] = useState(new Audio.Sound())
    const [text, setText] = useState('')
    const [hasPermission, setHasPermission] = useState(null)
    const [scaneaza, setScaneaza] = useState(false)
    const [scanned, setScanned] = useState(false)
    const [roferma, setRoferma] = useState()
    const [datac, setDatac] = useState()
    const navigation = useNavigation()
    const {selectedPrelev} = useContext(PrelevContext);
    const {id: selectedPrelevId} = selectedPrelev;

    async function playSound() {
        console.log('Loading Sound')
        const {sound} = await Audio.Sound.createAsync(
            require('./assets/beep.mp3')
        )

        setSound(sound)
        console.log('Playing Sound')
        await sound.playAsync()
    }

    useEffect(() => {
        return sound
            ? () => {
                console.log('Unloading Sound')
                sound.unloadAsync()
            }
            : undefined
    }, [sound])

    const askForCameraPermission = () => {
        ;(async () => {
            const {status} = await BarCodeScanner.requestPermissionsAsync()
            setHasPermission(status === 'granted')
        })()
    }

    // Request Camera Permission
    useEffect(() => {
        checkConnection();
        askForCameraPermission()
    }, [])

    function handleBarCodeScanned({data}) {
        playSound()
        const ferma = data.slice(8)
        const datacontr = data
            .slice(0, 8)
            .replace(/(\d{4})(\d{2})(\d{2})/g, '$1-$2-$3')
        setText('Ferma ' + ferma + '\nData ' + datacontr)
        setRoferma(ferma)
        setDatac(datacontr)
        setScanned(true)
        setScaneaza(false)
    }

    function scannedfunc() {
        console.log(scanned + ' vvvvvvvvvvvvvvvvvvvvvv')

        return undefined
    }

    function existent(text) {
        return text !== undefined
    }

    if (hasPermission === null) {
        return (
            <View style={Style.container}>
                <Text>Requesting for camera permission</Text>
            </View>
        )
    }
    if (hasPermission === false) {
        return (
            <View style={Style.container}>
                <Text style={{margin: 10}}>No access to camera</Text>
                <Button
                    title={'Allow Camera'}
                    onPress={() => askForCameraPermission()}
                />
            </View>
        )
    }

    return (
        <ScrollView style={{flex: 1}}>
            <View style={Style.containerBarCode}>
                <View
                    style={{
                        flex: 1,
                    }}
                >
                    <View style={{flex: 1}}>
                        <View style={Style.barcodeboxFerma}>
                            {scaneaza && (
                                <BarCodeScanner
                                    barCodeTypes={["code128"]}
                                    onBarCodeScanned={
                                        scanned
                                            ? scannedfunc
                                            : handleBarCodeScanned
                                    }
                                    style={{width: 500, height: 500}}
                                ></BarCodeScanner>
                            )}
                        </View>

                        <TouchableOpacity
                            style={{
                                backgroundColor: 'tomato',
                                borderRadius: 30,
                                justifyContent: 'center',
                                flex: 0.9,
                                height: 100,
                                marginTop: 20,
                            }}
                            onPress={() => {
                                setScanned(false)
                                setScaneaza(true)
                            }}
                        >
                            <Text
                                style={{
                                    color: 'white',
                                    fontSize: 28,
                                }}
                            >
                                {' '}
                                Scaneaza foaia control{' '}
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
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                flex: 0.8,
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    width: '100%',
                                    minHeight: 100,
                                    backgroundColor: '#2196f3',
                                }}
                                onPress={() => {
                                    navigation.navigate('ControlNou', {
                                        datac: datac,
                                        ferma: roferma,
                                        controlor: selectedPrelevId,
                                        definitiv: false,
                                    })
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
                                    width: '100%',
                                    height: 70,
                                    backgroundColor: 'red',
                                }}
                                onPress={() => {
                                    setText('')
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
                                    setText('')
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
            </View>
        </ScrollView>
    )
}

ControlNou.defaultProps = {
    values: [],
    emptyRows: 1,
    borders: false,
    headerBorders: false,
    style: {},
    customStyles: {},
    cellHeight: 40,
}

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
}
