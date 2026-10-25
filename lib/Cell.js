import React from 'react'
import { Text, TextInput, View } from 'react-native'
import Style from './../style'
export default function Cell({
    value,
    editable,
    borderStyle,
    customStyles,
    height,
    width,
    index,
    span,
    onCellChange,
    column,
    row,
    input,
}) {
    const [valueE, setValueE] = React.useState(value)

    function onChangeText(e) {
        let { text } = e.nativeEvent

        setValueE(text)
        onCellChange(text, column, row, input)
    }
    const columnStyle = [
        Style.cell,
        borderStyle,
        customStyles.cell,
        { height: height },
    ]

    if (span) {
        const paddingLR = 2 * span
        columnStyle.push({
            paddingLeft: paddingLR,
            paddingRight: paddingLR,
        })
    }

    if (width) {
        columnStyle.push({ flex: width })
    }

    if (editable) {
        const cellStyle = [Style.cellInput, customStyles.cellInput]

        return (
            <View style={columnStyle}>
                <TextInput
                    value={valueE.toString()}
                    style={cellStyle}
                    fontWeight="bold"
                    onChange={onChangeText}
                    keyboardType="decimal-pad"
                    maxFontSizeMultiplier={1.2}
                />
            </View>
        )
    }

    // Single line, shrinks to fit the cell instead of being clipped (large system font sizes)
    if (index == 2) {
        return (
            <View style={columnStyle}>
                <Text numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.2}>
                    {valueE
                        .toString()
                        .substring(0, valueE.toString().length - 4)}
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                        {valueE.toString().substring(valueE.toString().length - 4)}
                    </Text>
                </Text>
            </View>
        )
    } else {
        return (
            <View style={columnStyle}>
                <Text
                    style={{ fontSize: 16 }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    maxFontSizeMultiplier={1.2}
                >
                    {valueE.toString()}
                </Text>
            </View>
        )
    }
}
