import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PrelevContext = createContext();

const PrelevProvider = ({ children }) => {
    const [selectedPrelev, setSelectedPrelev] = useState({ id: null, name: '' });

    useEffect(() => {
        const loadStoredValues = async () => {
            try {
                const storedPrelev = await AsyncStorage.getItem('@save_prelev');
                if (storedPrelev !== null) {
                    const parsedPrelev = JSON.parse(storedPrelev);
                    setSelectedPrelev(parsedPrelev);
                }
            } catch (error) {
                console.error('Failed to load stored prelev values', error);
            }
        };

        loadStoredValues();
    }, []);

    return (
        <PrelevContext.Provider value={{ selectedPrelev, setSelectedPrelev }}>
            {children}
        </PrelevContext.Provider>
    );
};

export { PrelevContext, PrelevProvider };
