import { FontAwesome5 } from '@expo/vector-icons'
import Checkbox from 'expo-checkbox'
import React from 'react'
import { Text, View } from 'react-native'
class CellControale extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            value: props.value,
        }
        this.onChangeText = this.onChangeText.bind(this)
        this.updateDefintiv = this.updateDefintiv.bind(this)
    }

    onChangeText(e) {
        let { text } = e.nativeEvent
        this.setState({ ...this.state, value: text })
        if (typeof this.props.onCellChange === 'function') {
            const { column, row, input } = this.props
            this.props.onCellChange(text, column, row, input)
        }
    }

    updateDefintiv() {
        console.log(this.state.value)
        this.setState({ ...this.state, value: !this.state.value })
    }

    render() {
        const {
            value,
            row,
            editable,
            borderStyle,
            customStyles,
            height,
            width,
            index,
            span,
            definitiv,
            editRow,
            updateControlDefinitiv,
        } = this.props

        const columnStyle = {
            flex: 1,
            height: 40,
            padding: 2,
            alignItems: 'center',
            justifyContent: 'center',
        }

        if (index === 2) {
            return (
                <View style={columnStyle}>
                    <Text>{new Date(value).toISOString().slice(0, 10)}</Text>
                </View>
            )
        }
        if (index === 3) {
            return (
                <Checkbox
                    style={{ flex: 0.2, height: 30, alignItems: 'center' }}
                    disabled={this.state.value == true}
                    value={this.state.value}
                    tintColor="#C14C4E"
                    onValueChange={() => {
                        this.updateDefintiv(row)
                        updateControlDefinitiv(row)
                    }}
                />
            )
        }
        if (index === 0) {
            return (
                <FontAwesome5
                    name="edit"
                    size={30}
                    color={definitiv ? 'gray' : 'red'}
                    onPress={() => {
                        editRow(row)
                    }}
                />
            )
        } else
            return (
                <View style={columnStyle}>
                    <Text>{value}</Text>
                </View>
            )
    }
}

export default CellControale
