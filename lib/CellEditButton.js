import { FontAwesome5 } from '@expo/vector-icons'
import React from 'react'
import { View } from 'react-native'
import Style from '../style'
class CellDeleteButton extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            value: props.value,
        }
        this.onChangeText = this.onChangeText.bind(this)
    }

    onChangeText(e) {
        let { text } = e.nativeEvent
        this.setState({ ...this.state, value: text })
        if (typeof this.props.onCellChange === 'function') {
            const { column, row, input } = this.props
            this.props.onCellChange(text, column, row, input)
        }
    }

    render() {
        const {
            value,
            editable,
            borderStyle,
            customStyles,
            height,
            width,
            index,
            span,
            row,
            deleteRow,
        } = this.props

        const columnStyle = [
            Style.cell,
            borderStyle,
            customStyles.cell,
            { height: height },
        ]

        if (width) {
            columnStyle.push({ flex: 0.25 })
        }

        return (
            <View style={columnStyle}>
                <FontAwesome5
                    name="trash-alt"
                    size={25}
                    color="red"
                    onPress={() => deleteRow(row)}
                />
            </View>
        )
    }
}

export default CellDeleteButton
