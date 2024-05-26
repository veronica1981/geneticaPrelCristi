import React, { useContext, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAsoc, getPrelevatoriAsoc } from './lib/services/Services';
import { PrelevContext } from './lib/PrelevContext';

const STORprelev_KEY = '@save_prelev';

const Setari = () => {
    const [asoc, setAsoc] = useState(null);
    const [data, setData] = useState([]);
    const [prelev, setPrelev] = useState([]);
    const [isLoad, setIsLoad] = useState(false);
    const [error, setError] = useState(null);

    const { selectedPrelev, setSelectedPrelev } = useContext(PrelevContext);
    const { id: selectedPrelevId, name: selectedPrelevName } = selectedPrelev;

    const navigation = useNavigation();

    useEffect(() => {
        setIsLoad(true);
        setError(null);
        const fetchAsociatii = async () => {
            try {
                const asociatii = await getAsoc();
                if (asociatii && asociatii.length > 0) {
                    setData(asociatii);
                    setAsoc(asociatii[0].id);
                }
            } catch (error) {
                setError('Failed to fetch associations');
                Alert.alert('Error', 'Failed to load associations');
            } finally {
                setIsLoad(false);
            }
        };
        fetchAsociatii();
    }, []);

    useEffect(() => {
        if (!asoc) return;
        setIsLoad(true);
        setError(null);
        const fetchPrelevatori = async () => {
            try {
                const prelevatori = await getPrelevatoriAsoc(asoc);
                if (prelevatori && prelevatori.length > 0) {
                    setPrelev(prelevatori);
                    setSelectedPrelev({ id: prelevatori[0].id, name: prelevatori[0].nume });
                } else {
                    setPrelev([]);
                    setSelectedPrelev({ id: null, name: '' });
                }
            } catch (error) {
                setError('Failed to load collectors');
                Alert.alert('Error', 'Failed to load collectors');
            } finally {
                setIsLoad(false);
            }
        };
        fetchPrelevatori();
    }, [asoc]);

    const saveData = async () => {
        setIsLoad(true);
        try {
            await AsyncStorage.setItem(STORprelev_KEY, JSON.stringify(selectedPrelev));
            navigation.navigate('Controale');
        } catch (e) {
            Alert.alert('Error', 'Failed to save the data');
        } finally {
            setIsLoad(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Genetica Control Lapte</Text>
            </View>
            <Text style={styles.title2}>Alegeți asociația și căutați numele prelevator</Text>
            {data.length > 0 && (
                <Picker
                    selectedValue={asoc}
                    onValueChange={(itemValue) => setAsoc(itemValue)}
                    style={styles.picker}
                    enabled={!isLoad}
                >
                    {data.map((asoc) => (
                        <Picker.Item key={asoc.id} label={asoc.nume} value={asoc.id} />
                    ))}
                </Picker>
            )}
            {prelev.length > 0 && (
                <Picker
                    selectedValue={selectedPrelevId}
                    onValueChange={(itemValue) => {
                        const selected = prelev.find(p => p.id === itemValue);
                        setSelectedPrelev({ id: selected.id, name: selected.nume });
                    }}
                    style={styles.picker}
                    enabled={!isLoad}
                >
                    {prelev.map((item) => (
                        <Picker.Item key={item.id} label={item.nume} value={item.id} />
                    ))}
                </Picker>
            )}
            <TouchableOpacity onPress={saveData} style={styles.button}>
                <Text style={styles.buttonText}>Intra in cont</Text>
            </TouchableOpacity>
            <View style={styles.bottomView}>
                <Text style={styles.title2}>
                    Dacă numele d-voastra nu se află în listă sau pentru orice
                    alte întrebări vă rugăm să vă adresați:
                    office@genetica-transilvania.ro
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        backgroundColor: '#dcdcdc',
        padding: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        color: '#333',
        fontWeight: 'bold',
    },
    title2: {
        fontSize: 22,
        color: 'tomato',
        fontWeight: 'bold',
    },
    error: {
        fontSize: 16,
        color: 'red',
        padding: 10,
    },
    button: {
        margin: 10,
        padding: 10,
        backgroundColor: '#2196f3',
    },
    buttonText: {
        fontSize: 18,
        color: 'white',
        textAlign: 'center',
    },
    picker: {
        marginVertical: 30,
        width: 300,
        padding: 10,
        borderWidth: 1,
        borderColor: '#666',
        fontSize: 30,
    },
    bottomView: {
        width: '100%',
        backgroundColor: '#dcdcdc',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
        marginTop: '5%',
    },
});

export default Setari;
