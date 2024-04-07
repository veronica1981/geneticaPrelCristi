import { Audio } from 'expo-av';
import { BarCodeScanner } from 'expo-barcode-scanner';
import PropTypes from 'prop-types';
import React from 'react';
import {
  Button,
  KeyboardAvoidingView,
  Platform, ScrollView, Text, View
} from 'react-native';
import CellDeleteButton from './lib/CellDeleteButton';
import CellIndex from './lib/CellIndex';
import Cell from './lib/Cell';
import Column from './lib/Column';
import Style from './style';

class EditableTable extends React.Component {
  constructor(props) {
    super(props);
    const sortIndex = props.columns.findIndex(
      c => c.hasOwnProperty('defaultSort') === true,
    );
    this.state = {
      sort:
        sortIndex !== undefined ? props.columns[sortIndex].defaultSort : null,
      sortColumnIndex: sortIndex !== undefined ? sortIndex : null,
      scanned: false,
      text: 'Nici un cod scanat',
      sound: new Audio.Sound(),
      rows: props.values.length,
      linii: props.values.slice(0, -1),
    };

    let columnWidths = props.columns.map(c => c.width);
    this.state.widths = this._calculateCellWidths(columnWidths);
    this.deleteRow = this.deleteRow.bind(this);
    this.adaugareCod = this.adaugareCod.bind(this);
    this.adaugareCodScanat = this.adaugareCodScanat.bind(this);


  }
  async playSound() {
    console.log('Loading Sound');
    const { sound } = await Audio.Sound.createAsync(
       require('./assets/beep.mp3')
    );

    this.setState({sound: sound});
    console.log('Playing Sound');
    await sound.playAsync();
  }

    handleBarCodeScanned = ({ type, data }) => {
      this.setState({ scanned: true });
      alert(`Bar code with type ${type} and data ${data} has been scanned!`);
    };

  createColumns(columns) {
    return columns.map((c, i) => {
      let borders = {};
      if (this.props.headerBorders) {
        borders = this._createBorderStyles(i, columns.length);
      }
      return (
        <Column
          {...c}
          key={c.input}
          column={c}
          index={i}
          customStyles={this.props.customStyles}
          borderStyle={borders}
          onColumnChange={this.props.onColumnChange}
          height={this.props.cellHeight}
          width={this.state.widths[i]}
        />
      );
    });
  }

  createRows(rows) {
    const {customStyles} = this.props;
    return rows.map((row, i) => {
      const isLastRow = rows.length - 1 === i;
      const rowStyle = [
        Style.row,
        customStyles.row,
        isLastRow ? {borderBottomWidth: 0} : {},
      ];
      return (
        <View key={i} style={rowStyle}>
          {this.createRow(row, i)}
        </View>
      );
    });
  }

  createRow(row, rowIndex) {
    let addColIndex = 0;
    var cells = row.map((cell, colIndex) => {
      colIndex = colIndex + addColIndex;
      if (cell.hasOwnProperty('span')) {
        addColIndex += cell.span - 1;
      }
      let borderStyle = {};
      if (this.props.borders) {
        borderStyle = this._createBorderStyles(colIndex, row.length);
      }
      return this.createCell(cell, colIndex, rowIndex, borderStyle);
    });
    return [
      this.createCellDelete('', 0, rowIndex, 0.5),
      this.createCellIndex('', 1, rowIndex, 0.5),
      cells,
    ];
  }

  createCellDelete(cell, colIndex, rowIndex, borderStyle) {
    return (
      <CellDeleteButton
        value={cell}
        key={colIndex}
        index={colIndex}
        customStyles={this.props.customStyles}
        borderStyle={borderStyle}
        height={this.props.cellHeight}
        width={0.14}
        column={colIndex}
        row={rowIndex}
        deleteRow={this.deleteRow}
      />
    );
  }

  deleteRow(rowIndex) {
    return this.setState({
      ...this.state,
      linii: [
        ...this.state.linii.filter(
          item => this.state.linii.indexOf(item) !== rowIndex,
        ),
      ],
    });
  }

  createCellIndex(cell, colIndex, rowIndex, borderStyle) {
    return (
      <CellIndex
        value={cell}
        key={colIndex}
        index={colIndex}
        customStyles={this.props.customStyles}
        borderStyle={borderStyle}
        height={this.props.cellHeight}
        width={0.42}
        column={colIndex}
        row={this.state.linii.length - rowIndex}
      />
    );
  }

  createCell(cell, colIndex, rowIndex, borderStyle) {
    let columnInput = this.props.columns[colIndex].input;
    columnInput += `-${rowIndex}-${colIndex}`;
    if (typeof cell === 'object') {
      let width = this.state.widths[colIndex];
      if (cell.hasOwnProperty('span')) {
        const span = cell.span;
        if (span + colIndex <= this.props.columns.length) {
          for (let i = 1; i < span; i++) {
            width += this.state.widths[colIndex + i];
          }
        }
      }
      return (
        <Cell
          {...cell}
          key={colIndex}
          index={colIndex}
          customStyles={this.props.customStyles}
          borderStyle={borderStyle}
          height={this.props.cellHeight}
          width={0.76}
          input={columnInput}
          column={colIndex}
          row={rowIndex}
          onCellChange={this.props.onCellChange}
        />
      );
    }

    return (
      <Cell
        value={cell}
        key={colIndex}
        index={colIndex}
        customStyles={this.props.customStyles}
        borderStyle={borderStyle}
        height={this.props.cellHeight}
        width={0.76}
        input={columnInput}
        column={colIndex}
        row={rowIndex}
      />
    );
  }

  _createBorderStyles(i, length) {
    return {
      borderRightWidth: length - 1 > i ? 0.5 : 0,
    };
  }

  _calculateCellWidths(widths) {
    const widthFlexs = [];
    for (let i = 0; i < widths.length; i++) {
      widthFlexs.push(widths.length * (widths[i] * 0.01));
    }
    return widthFlexs;
  }

  handleBarCodeScanned = ({  data }) => {
    console.log(data);
    this.playSound();
    this.setState({
      scanned:true,
      text: data
    });

  };

  render() {
    const {style, customStyles, cellHeight, columns, values} = this.props;
    const { scanned, text } = this.state;
    return (
      <View style={Style.containerBarCode}>

      <Button
       color='red'
        title="Terminare Control"
        onPress={() => {}}
      />
      <View style={Style.barcodebox}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={{ height: 400, width: 400 }} />
      </View>
      <Text style={style.maintext}>{text}     {scanned && text!='' && <Button  title={'Preia cod?'} onPress={() => { this.adaugareCodScanat(text)}} color='#2196f3' />} </Text>

      {scanned && <Button title={'Scaneaza dinou?'} onPress={() => {this.setState({scanned:false})}} color='tomato' />}

      <View style={{padding:10}} >

        <View
          style={{
            flexDirection: 'row',
            height: 60,
            width: 400,
            padding: 10,
            justifyContent: 'space-around',
          }}>
          <Button
            style={{flex: 0.5}}
            title="Adaugare manuala"
            onPress={() => {this.adaugareCod(this.state.linii[0][2])}}
          />

        </View>
        <View style={[Style.container, style, {minHeight: cellHeight}]}>
          <ScrollView style={{flex: 1}}>
            <KeyboardAvoidingView
              style={{flex: 1}}
              behavior={Platform.OS === 'ios' ? 'position' : 'padding'}
              enabled>
              <View style={{flex: 1, flexDirection: 'column'}}>
                <View style={[Style.row, customStyles.row]}>
                  {this.createColumns(columns)}
                </View>
                {this.createRows(this.state.linii)}
              </View>
            </KeyboardAvoidingView>
          </ScrollView>
        </View>
      </View>
      </View>
    );
  }

  adaugareCod(wert) {
    return this.setState({
      ...this.state,
      linii: [
        [
          {value: '', editable: true},
          {value: '', editable: true},
          parseInt(wert + 1),
        ],
        ...this.state.linii,
      ],
    });
  }
  adaugareCodScanat(wert) {
    return this.setState({
      ...this.state,
      linii: [
        [
          {value: '', editable: true},
          {value: '', editable: true},
          parseInt(wert),
        ],
        ...this.state.linii,
      ],
      text:''
    });
  }
}

EditableTable.defaultProps = {
  values: [],
  emptyRows: 1,
  borders: false,
  headerBorders: false,
  style: {},
  customStyles: {},
  cellHeight: 40,
};

EditableTable.propTypes = {
  columns: PropTypes.array.isRequired,
  values: PropTypes.array,
  emptyRows: PropTypes.number,
  cellHeight: PropTypes.number,
  onCellChange: PropTypes.func,
  onColumnChange: PropTypes.func,
  customStyles: PropTypes.object,
  borders: PropTypes.bool,
  headerBorders: PropTypes.bool,
};

export default EditableTable;
