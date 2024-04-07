import React from 'react'
import { Text, View } from 'react-native'
import Style from '../style'

class CellIndex extends React.Component {
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
        } = this.props

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

        return (
            <View style={columnStyle}>
                <Text>{(row + 1).toString()}</Text>
            </View>
        )
    }
}

export default CellIndex
