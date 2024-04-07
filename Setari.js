import React, {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getAsoc, getPrelevatoriAsoc} from './lib/services/Services';

const STORprelev_KEY = '@save_prelev';

const Setari = () => {
    const [asoc, setAsoc] = useState('');
    const [data, setData] = useState([]);
    const [prelev, setPrelev] = useState([]);
    const [selectedPrelevId, setSelectedPrelevId] = useState('');

    const navigation = useNavigation();

    useEffect(() => {
        const fetchAsociatii = async () => {
            const asociatii = await getAsoc();
            setData(asociatii);
            if (asociatii.length > 0) {
                setAsoc(asociatii[0].id);
            }
        };
        fetchAsociatii();
    }, []);

    useEffect(() => {
        const fetchPrelevatori = async () => {
            if (asoc) {
                const prelevatori = await getPrelevatoriAsoc(asoc);
                setPrelev(prelevatori);
                if (prelevatori.length > 0) {
                    setSelectedPrelevId(prelevatori[0].id);
                } else {
                    setSelectedPrelevId('');
                }
            }
        };
        fetchPrelevatori();
    }, [asoc]);

    const saveData = async () => {
        try {
            await AsyncStorage.setItem(STORprelev_KEY, JSON.stringify(selectedPrelevId));
            const selectedPrelev = prelev.find(p => p.id === selectedPrelevId);
            console.log(selectedPrelev?.nume, selectedPrelevId);
            navigation.navigate('Controale', {
                controlName: selectedPrelev?.nume,
            });
        } catch (e) {
            console.error(e);
            alert('Failed to save the data');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Genetica Control Lapte</Text>
            </View>
            <Text style={styles.title2}>
                Alegeți asociația și căutați numele
            </Text>
           <Picker
                selectedValue={asoc}
                onValueChange={(itemValue) => setAsoc(itemValue)}
                style={styles.picker}>
                {data.map((asoc) => (
                    <Picker.Item key={asoc.id} label={asoc.nume} value={asoc.id}/>
                ))}
            </Picker>
            <Picker
                selectedValue={selectedPrelevId}
                onValueChange={(itemValue) => setSelectedPrelevId(itemValue)}
                style={styles.picker}>
                {prelev.map((item) => (
                    <Picker.Item key={item.id} label={item.nume} value={item.id}/>
                ))}
            </Picker>
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
    panel: {
        padding: 40,
        alignItems: 'center',
        width: 200,
    },
    text: {
        fontSize: 24,
        padding: 10,
        backgroundColor: '#dcdcdc',
    },
    text2: {
        fontSize: 24,
        padding: 10,
        backgroundColor: '#dcdcdc',
        width: '80%',
    },
    bottomView: {
        width: '100%',
        backgroundColor: '#dcdcdc',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative', //Here is the trick
        bottom: 0, //Here is the trick
        marginTop: '5%',
    },
    input: {
        padding: 15,
        height: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        margin: 10,
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
})

export default Setari
