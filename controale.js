import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import PropTypes from 'prop-types';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import CellIndex from './lib/CellIndex';
import CellControale from './lib/CellControale';
import CellEditButton from './lib/CellEditButton';
import Column from './lib/ColumnControale';
import { getControls, getControlsMeta, putDefinitivControlMeta } from './lib/services/Services';
import Style from './style';
import { checkConnection } from './NaviUtil';
import { PrelevContext } from './lib/PrelevContext';

export function formatDate(dateString) {
    const datePart = (dateString ?? '').split('T')[0];
    const [year = '', month = '', day = ''] = (datePart ?? '').split('-');
    return `${year}-${month}-${day}`;
}

export default function Controale({
                                      customStyles = {},      // ✅ React 19: provide defaults in params (defaultProps don't apply)
                                      style = {},
                                      cellHeight = 40,
                                      headerBorders = false,
                                      onColumnChange,
                                      borders = false,
                                      onCellChange,
                                      route,
                                  }) {
    const columns = [
        { value: 'Edit',      input: 'c0', width: 7 },
        { value: '#',         input: 'c1', width: 7 },
        { value: 'Ferma',     input: 'c2', width: 35 },
        { value: 'Data Set',  input: 'c3', width: 20 },
        { value: 'Definitiv', input: 'c5', width: 7 },
    ];

    const columnWidths = columns.map((c) => c.width);
    const [widths] = useState(_calculateCellWidths(columnWidths));
    const [datac, setDatac] = useState(new Date());
    const [show, setShow] = useState(false);
    const [controls, setControls] = useState([]);

    const [selecteddataset, setSelecteddataset] = useState();
    const [uniquedatasets, setUniquedatasets] = useState([]);
    const { selectedPrelev } = useContext(PrelevContext);
    const { id: selectedPrelevId, name: selectedPrelevName } = selectedPrelev ?? { id: null, name: '' };

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

    // ✅ move useMemo to top-level (Rules of Hooks)
    const groupedData = useMemo(() => groupBydataset(controls), [controls]);

    const renderFilterOptions = useMemo(
        () => (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 10 }}>
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
                        <Text style={{ color: selecteddataset === dataset ? '#fff' : '#000' }}>
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
        ),
        [uniquedatasets, selecteddataset]
    );

    const renderItem = useCallback(
        ({ item }) => (
            <View style={Style.rowFront}>
                {createRow(item, controls.indexOf(item))}
            </View>
        ),
        [controls]
    );

    function createColumns(cols) {
        return cols.map((c, i) => {
            let borderStyle = {};
            if (headerBorders) {
                borderStyle = _createBorderStyles(i, cols.length);
            }
            return (
                <Column
                    {...c}
                    key={c.input}
                    column={c}
                    index={i}
                    customStyles={customStyles}
                    borderStyle={borderStyle}
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
        const filteredData = selecteddataset
            ? { [selecteddataset]: groupedData[selecteddataset] ?? [] }
            : groupedData;

        return (
            <View style={{ flex: 1 }}>
                {Object.entries(filteredData).map(([dataset, group]) => (
                    <View key={`group-${dataset}`} style={{ marginBottom: 20 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 18 }}>
                            {`Data Control selectată: ${String(dataset).split('T')[0]}`}
                        </Text>
                        <FlatList
                            data={group}
                            renderItem={renderItem}
                            keyExtractor={(item) => `row-${item.id}`}
                        />
                    </View>
                ))}
            </View>
        );
    }

    function createRow(row, rowIndex) {
        let addColIndex = 0;
        const entries = [row['id'], row['ferma'], row['dataset'], row['definitiv']];

        const cells = entries.map((cell, colIndex) => {
            colIndex = colIndex + addColIndex;
            if (cell && typeof cell === 'object' && Object.prototype.hasOwnProperty.call(cell, 'span')) {
                addColIndex += cell.span - 1;
            }
            let borderStyle = {};
            if (borders) {
                // ❗ row is an object; we want the number of columns:
                borderStyle = _createBorderStyles(colIndex, columns.length);
            }
            return createCell(
                cell,
                colIndex,
                rowIndex,
                borderStyle,
                row['definitiv'],
                `cell-${rowIndex}-${colIndex}` // unique key
            );
        });

        return [
            cells[0],
            // ❗ pass a real borderStyle object instead of the number 0.5
            createCellIndex('', 1, controls.indexOf(row), _createBorderStyles(1, columns.length), `index-${rowIndex}`),
            ...cells.slice(1),
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
            datac: formatDate(controls[row]?.dataset),
            ferma: controls[row]?.ferma,
            controlId: controls[row]?.id,
            controlor: selectedPrelevId,
            definitiv: controls[row]?.definitiv,
        });
    }

    function updateControlDefinitiv(row) {
        const idC = Number(controls[row]?.['id']);
        if (!Number.isFinite(idC)) return;
        putDefinitivControlMeta(idC).then(() => {
            const updatedControls = controls.map((control, index) =>
                index === row ? { ...control, definitiv: !control.definitiv } : control
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
        const columnInput = `${columns[colIndex]?.input ?? 'c'}-${rowIndex}-${colIndex}`;
        if (cell && typeof cell === 'object') {
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
                    definitiv={!!definitiv}
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
                width={widths[colIndex] ?? 0.8}
                input={columnInput}
                column={colIndex}
                row={rowIndex}
                definitiv={!!definitiv}
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
            <Text style={{ fontSize: 20, color: 'tomato' }}>
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
                <Text style={{ color: 'white', fontSize: 24, textAlign: 'center' }}>
                    ADAUGA CONTROL
                </Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1, height: 2, backgroundColor: 'black' }} />
                <Text style={{ width: 150, textAlign: 'center', fontSize: 22 }}>Lista Controale</Text>
                <View style={{ flex: 1, height: 2, backgroundColor: 'black' }} />
            </View>
        </>
    );

    return (
        <FlatList
            data={selecteddataset ? groupedData[selecteddataset] ?? [] : controls}
            keyExtractor={(item) => `row-${item.id}`}
            renderItem={renderItem}
            ListHeaderComponent={
                <>
                    <Text style={{ fontSize: 20, color: 'tomato' }}>
                        BUNA ZIUA {selectedPrelevName}!
                    </Text>
                    <TouchableOpacity
                        style={{
                            margin: 10,
                            backgroundColor: '#2196f3',
                            minHeight: 70,
                            borderRadius: 10,
                        }}
                        onPress={() => navigation.navigate('ScanPaper')}
                    >
                        <Text style={{ color: 'white', fontSize: 24, textAlign: 'center' }}>
                            ADAUGA CONTROL
                        </Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ flex: 1, height: 2, backgroundColor: 'black' }} />
                        <Text style={{ width: 150, textAlign: 'center', fontSize: 22 }}>
                            Lista Controale
                        </Text>
                        <View style={{ flex: 1, height: 2, backgroundColor: 'black' }} />
                    </View>

                    {/* Table header */}
                    <View style={[Style.row, customStyles?.row]}>
                        {createColumns(columns)}
                    </View>

                    {/* Filter buttons */}
                    {renderFilterOptions}
                </>
            }
            contentContainerStyle={{ paddingBottom: 50 }}
        />
    );
}

Controale.propTypes = {
    cellHeight: PropTypes.number,
    onCellChange: PropTypes.func,
    onColumnChange: PropTypes.func,
    customStyles: PropTypes.object,
    borders: PropTypes.bool,
    headerBorders: PropTypes.bool,
};
