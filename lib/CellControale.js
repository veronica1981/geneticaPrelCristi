import { FontAwesome5 } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import {formatDate} from '../controale';

const CellControale = (props) => {
    const [value, setValue] = useState(props.value);

    const onChangeText = (e) => {
        const { text } = e.nativeEvent;
        setValue(text);
        if (typeof props.onCellChange === 'function') {
            const { column, row, input } = props;
            props.onCellChange(text, column, row, input);
        }
    };

    const updateDefinitiv = () => {
        setValue((prevValue) => !prevValue);
    };

    const {
        row,
        index,
        definitiv,
        editRow,
        updateControlDefinitiv,
    } = props;

    const columnStyle = {
        flex: 1,
        height: 40,
        padding: 2,
        alignItems: 'center',
        justifyContent: 'center',
    };

    if (index === 2) {
        return (
            <View style={columnStyle}>
                <Text>{formatDate(value)}</Text>
            </View>
        );
    }

    if (index === 3) {
        return (
            <Checkbox
                style={{ flex: 0.2, height: 30, alignItems: 'center' }}
                disabled={value}
                value={value}
                tintColor="#C14C4E"
                onValueChange={() => {
                    updateDefinitiv();
                    updateControlDefinitiv(row);
                }}
            />
        );
    }

    if (index === 0) {
        return (
            <FontAwesome5
                name="edit"
                size={30}
                color={definitiv ? 'gray' : 'red'}
                onPress={() => editRow(row)}
            />
        );
    }

    return (
        <View style={columnStyle}>
            <Text>{value}</Text>
        </View>
    );
};

export default CellControale;
