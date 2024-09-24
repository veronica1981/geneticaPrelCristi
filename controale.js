import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import PropTypes from 'prop-types';
import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Alert, Button, FlatList, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import CellIndex from './lib/CellIndex';
import CellControale from './lib/CellControale';
import CellEditButton from './lib/CellEditButton';
import Column from './lib/ColumnControale';
import {getControls, getControlsMeta, putDefinitivControlMeta} from './lib/services/Services';
import Style from './style';
import {checkConnection} from './NaviUtil';
import {PrelevContext} from './lib/PrelevContext';

export function formatDate(dateString) {
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    return `${year}-${month}-${day}`;
}

export default function Controale({
                                      customStyles,
                                      style,
                                      cellHeight,
                                      headerBorders,
                                      onColumnChange,
                                      borders,
                                      onCellChange,
                                      route,
                                  }) {
    const columns = [
        {value: 'Edit', input: 'c0', width: 7},
        {value: '#', input: 'c1', width: 7},
        {value: 'Ferma', input: 'c2', width: 35},
        {value: 'Data Set', input: 'c3', width: 20},
        {value: 'Definitiv', input: 'c5', width: 7},
    ];

    const columnWidths = columns.map((c) => c.width);
    const [widths] = useState(_calculateCellWidths(columnWidths));
    const [datac, setDatac] = useState(new Date());
    const [show, setShow] = useState(false);
    const [controls, setControls] = useState([]);

    const [selecteddataset, setSelecteddataset] = useState();
    const [uniquedatasets, setUniquedatasets] = useState([]);
    const {selectedPrelev} = useContext(PrelevContext);
    const {id: selectedPrelevId, name: selectedPrelevName} = selectedPrelev;

    const navigation = useNavigation();
    const prevSelecteddatasetRef = useRef();

    const loadData = useCallback(async () => {
        if (!selectedPrelevId) {
            navigation.navigate('Setari');
            return;
        }

        const items = await getControlsMeta(selectedPrelevId);
        const sortedItems = items.sort((a, b) => (new Date(b.dataset) > new Date(a.dataset) ? 1 : -1));
        const allUniquedatasets = [...new Set(sortedItems.map((item) => item.dataset))];
        setUniquedatasets(allUniquedatasets);

        if (sortedItems.length > 0) {
            setSelecteddataset(sortedItems[0].dataset);
        } else {
            setSelecteddataset('');
        }
    }, [selectedPrelevId, navigation]);

    useFocusEffect(
        useCallback(() => {
            if (selectedPrelevId) {
                loadData();
            }
        }, [loadData, selectedPrelevId])
    );

    useEffect(() => {
        const prevSelecteddataset = prevSelecteddatasetRef.current;
        if (prevSelecteddataset !== selecteddataset) {
            const filterControls = async () => {
                if (selecteddataset) {
                    const items = await getControlsMeta(selectedPrelevId);
                    const filteredItems = items.filter((item) => item.dataset === selecteddataset);
                    setControls(filteredItems);
                } else {
                    setControls([]);
                }
            };
            filterControls();
        }

        prevSelecteddatasetRef.current = selecteddataset;
    }, [selecteddataset, selectedPrelevId]);

    const renderFilterOptions = useMemo(() => (
        <View style={{flexDirection: 'row', flexWrap: 'wrap', marginVertical: 10}}>
            {uniquedatasets.map((dataset) => (
                <TouchableOpacity
                    key={`filter-${dataset}`}
                    style={{
                        backgroundColor: selecteddataset === dataset ? '#2196f3' : '#ddd',
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 5,
                        marginHorizontal: 5,
                        marginVertical: 5,
                    }}
                    onPress={() => setSelecteddataset(dataset)}
                >
                    <Text style={{color: selecteddataset === dataset ? '#fff' : '#000'}}>
                        {formatDate(dataset)}
                    </Text>
                </TouchableOpacity>
            ))}
            <TouchableOpacity
                style={{
                    backgroundColor: '#ddd',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 5,
                    marginHorizontal: 5,
                    marginVertical: 5,
                }}
                onPress={() => setSelecteddataset('')}
            >
                <Text>Clear Filter</Text>
            </TouchableOpacity>
        </View>
    ), [uniquedatasets, selecteddataset]);

    const renderItem = useCallback(({item}) => (
        <View style={Style.rowFront}>
            {createRow(item, controls.indexOf(item))}
        </View>
    ), [controls]);

    function createColumns(columns) {
        return columns.map((c, i) => {
            let borders = {};
            if (headerBorders) {
                borders = _createBorderStyles(i, columns.length);
            }
            return (
                <Column
                    {...c}
                    key={c.input}
                    column={c}
                    index={i}
                    customStyles={customStyles}
                    borderStyle={borders}
                    onColumnChange={onColumnChange}
                    height={cellHeight}
                    width={widths[i]}
                />
            );
        });
    }

    function groupBydataset(data) {
        return data.reduce((groups, item) => {
            const key = item['dataset'];
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {});
    }

    function createRows() {
        const groupedData = useMemo(() => groupBydataset(controls), [controls]);
        const filteredData = selecteddataset ? {[selecteddataset]: groupedData[selecteddataset]} : groupedData;
        return (
            <View style={{flex: 1}}>
                {Object.entries(filteredData).map(([dataset, group]) => {
                    return (
                        <View key={`group-${dataset}`} style={{marginBottom: 20}}>
                            <Text style={{
                                fontWeight: 'bold',
                                fontSize: 18
                            }}>{`Data Control selectată: ${dataset.split('T')[0]}`}</Text>
                            <FlatList
                                data={group}
                                renderItem={renderItem}
                                keyExtractor={(item) => `row-${item.id}`}
                            />
                        </View>
                    )
                })
                }
            </View>
        );
    }


    function createRow(row, rowIndex) {
        let addColIndex = 0;
        const entries = [row['id'], row['ferma'], row['dataset'], row['definitiv']];
        const cells = entries.map((cell, colIndex) => {
            colIndex = colIndex + addColIndex;
            if (cell.hasOwnProperty('span')) {
                addColIndex += cell.span - 1;
            }
            let borderStyle = {};
            if (borders) {
                borderStyle = _createBorderStyles(colIndex, row.length);
            }
            return createCell(
                cell,
                colIndex,
                rowIndex,
                borderStyle,
                row['definitiv'],
                `cell-${rowIndex}-${colIndex}` // unique key prop
            );
        });

        return [
            cells[0],
            createCellIndex('', 1, controls.indexOf(row), 0.5, `index-${rowIndex}`), // unique key prop
            ...cells.slice(1), // spread the cells array, excluding the first cell
        ];
    }

    function createCellIndex(cell, colIndex, rowIndex, borderStyle, key) {
        return (
            <CellIndex
                value={cell}
                key={key}
                index={colIndex}
                customStyles={customStyles}
                borderStyle={borderStyle}
                height={cellHeight}
                width={0.42}
                column={colIndex}
                row={rowIndex}
            />
        );
    }

    function deleteRow(row) {
        const newR = controls.filter((linie) => controls.indexOf(linie) !== Number(row) - 1);
        setControls(newR);
    }

    function deleteRowC(row) {
        setControls(controls.filter((linie) => linie !== row));
    }

    function editRow(row) {
        navigation.navigate('ControlNou', {
            datac: formatDate(controls[row].dataset),
            ferma: controls[row].ferma,
            controlId: controls[row].id,
            controlor: selectedPrelevId,
            definitiv: controls[row].definitiv,
        });
    }

    function updateControlDefinitiv(row) {
        const idC = Number(controls[row]['id']);
        putDefinitivControlMeta(idC).then(() => {
            const updatedControls = controls.map((control, index) =>
                index === row ? {...control, definitiv: !control.definitiv} : control
            );
            setControls(updatedControls);
        });
    }

    function createCellDelete(cell, colIndex, rowIndex, borderStyle) {
        return (
            <CellEditButton
                value={cell}
                key={colIndex}
                index={colIndex}
                customStyles={customStyles}
                borderStyle={borderStyle}
                height={cellHeight}
                width={0.14}
                column={colIndex}
                row={rowIndex}
                deleteRow={deleteRow}
                editRow={editRow}
            />
        );
    }

    function createCell(cell, colIndex, rowIndex, borderStyle, definitiv, key) {
        const columnInput = `${columns[colIndex].input}-${rowIndex}-${colIndex}`;
        if (typeof cell === 'object') {
            return (
                <CellControale
                    {...cell}
                    key={key}
                    index={colIndex}
                    customStyles={customStyles}
                    borderStyle={borderStyle}
                    height={cellHeight}
                    width={0.8}
                    input={columnInput}
                    column={colIndex}
                    row={rowIndex}
                    onCellChange={onCellChange}
                    definitiv={definitiv}
                    editRow={editRow}
                    updateControlDefinitiv={updateControlDefinitiv}
                />
            );
        }
        return (
            <CellControale
                value={cell}
                key={key}
                index={colIndex}
                customStyles={customStyles}
                borderStyle={borderStyle}
                height={cellHeight}
                width={widths[colIndex]}
                input={columnInput}
                column={colIndex}
                row={rowIndex}
                definitiv={definitiv}
                editRow={editRow}
                updateControlDefinitiv={updateControlDefinitiv}
            />
        );
    }

    function _createBorderStyles(i, length) {
        return {
            borderRightWidth: length - 1 > i ? 0.5 : 0,
        };
    }

    function _calculateCellWidths(widths) {
        const widthFlexs = [];
        for (let i = 0; i < widths.length; i++) {
            widthFlexs.push(widths.length * (widths[i] * 0.01));
        }
        return widthFlexs;
    }

    const onChange = (event, selectedDate) => {
        const currentDate = selectedDate || datac;
        setDatac(currentDate);
        setShow(false);
    };

    const renderHeader = () => (
        <>
            <Text style={{fontSize: 20, color: 'tomato'}}>
                BUNA ZIUA {selectedPrelevName}!
            </Text>
            <TouchableOpacity
                style={{
                    margin: 10,
                    backgroundColor: '#2196f3',
                    minHeight: 70,
                    borderRadius: 10,
                }}
                onPress={async () => {
                    navigation.navigate('ScanPaper');

                }}
            >
                <Text style={{color: 'white', fontSize: 24, textAlign: 'center'}}>
                    ADAUGA CONTROL
                </Text>
            </TouchableOpacity>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={{flex: 1, height: 2, backgroundColor: 'black'}}/>
                <Text style={{width: 150, textAlign: 'center', fontSize: 22}}>Lista Controale</Text>
                <View style={{flex: 1, height: 2, backgroundColor: 'black'}}/>
            </View>
        </>
    );

    return (
        <View style={{flex: 1}}>
            <ScrollView style={{flex: 1}}>
                <Text style={{fontSize: 20, color: 'tomato'}}>
                    BUNA ZIUA {selectedPrelevName}!
                </Text>
                <TouchableOpacity
                    style={{
                        margin: 10,
                        flex: 0.1,
                        backgroundColor: '#2196f3',
                        minHeight: 70,
                        borderRadius: 10,
                    }}
                    onPress={() => {
                        navigation.navigate('ScanPaper');
                    }}
                >
                    <Text style={{color: 'white', fontSize: 24, textAlign: 'center'}}>
                        ADAUGA CONTROL
                    </Text>
                </TouchableOpacity>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={{flex: 1, height: 2, backgroundColor: 'black'}}/>
                    <View>
                        <Text style={{width: 150, textAlign: 'center', fontSize: 22}}>
                            Lista Controale
                        </Text>
                    </View>
                    <View style={{flex: 1, height: 2, backgroundColor: 'black'}}/>
                </View>
                <View style={[Style.container, style, {minHeight: cellHeight}]}>
                    <View style={{flex: 1}}>
                        <View style={{flex: 1, flexDirection: 'column'}}>
                            <View style={[Style.row, customStyles.row]}>
                                {createColumns(columns)}
                            </View>
                            {createRows()}
                            {renderFilterOptions}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

Controale.defaultProps = {
    controls: [],
    borders: false,
    headerBorders: false,
    style: {},
    customStyles: {},
    cellHeight: 40,
};

Controale.propTypes = {
    cellHeight: PropTypes.number,
    onCellChange: PropTypes.func,
    onColumnChange: PropTypes.func,
    customStyles: PropTypes.object,
    navigation: PropTypes.object,
    borders: PropTypes.bool,
    headerBorders: PropTypes.bool,
};
