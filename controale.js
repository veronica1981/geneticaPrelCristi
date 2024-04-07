import AsyncStorage from '@react-native-async-storage/async-storage'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import PropTypes from 'prop-types'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Alert, Button, FlatList, ScrollView, Text, TouchableOpacity, View} from 'react-native'
import CellIndex from './lib/CellIndex'
import CellControale from './lib/CellControale'
import CellEditButton from './lib/CellEditButton'
import Column from './lib/ColumnControale'
import NetInfo from "@react-native-community/netinfo";
import {
    getControls,
    getControlsMeta,
    putDefinitivControlMeta,
} from './lib/services/Services'
import Style from './style'
import * as FileSystem from 'expo-file-system'
import {Platform} from 'react-native'
import {checkConnection} from './NaviUtil';


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
        {
            value: 'Edit',
            input: 'c0',
            width: 7,
        },
        {
            value: '#',
            input: 'c1',
            width: 7,
        },
        {
            value: 'Ferma',
            input: 'c2',
            width: 35,
        },
        {
            value: 'Data Set',
            input: 'c3',
            width: 20,
        },
        {
            value: 'Definitiv',
            input: 'c5',
            width: 7,
        },
    ]

    let columnWidths = columns.map((c) => c.width)
    const [widths, setnWidths] = useState(_calculateCellWidths(columnWidths))
    const [datac, setDatac] = useState(new Date())
    const [show, setShow] = useState(false)
    const [controls, setControls] = useState([])
    const [controlor, setControlor] = useState()
    const [controlorName, setControlorName] = useState()
    const [selecteddataset, setSelecteddataset] = useState('')
    const STORprelev_KEY = '@save_prelev'
    const [uniquedatasets, setUniquedatasets] = useState([])

    const [uploadedFiles, setUploadedFiles] = useState({})


    function renderFilterOptions() {
        return (
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
        )
    }


    const loadData = useCallback(async () => {
        const res = await AsyncStorage.getItem(STORprelev_KEY)
        if (res == null || res == undefined) {
            navigation.navigate('Setari')
        } else {
            setControlor(res)
            console.log(route.params?.controlName, "nume controllor")
            setControlorName(route.params?.controlName)
            const items = await getControlsMeta(res)

            const sortedItems = items.sort((a, b) => (new Date(b.dataset) > new Date(a.dataset) ? 1 : -1))
            const allUniquedatasets = [
                ...new Set(sortedItems.map((item) => item.dataset)),
            ]
            console.log("items", allUniquedatasets)
            setUniquedatasets(allUniquedatasets)

            if (!selecteddataset && sortedItems.length > 0) {
                setSelecteddataset(sortedItems[0].dataset)
            } else {
                setSelecteddataset([])
            }
        }
    }, [navigation, route])

    useFocusEffect(
        useCallback(() => {
            loadData()
        }, [loadData]),
    )

    const prevSelecteddatasetRef = useRef()

    useEffect(() => {
        checkConnection();
        const prevSelecteddataset = prevSelecteddatasetRef.current

        // Only update the controls if the selecteddataset has actually changed
        if (prevSelecteddataset !== selecteddataset) {
            const filterControls = async () => {
                if (selecteddataset) {
                    const res = await AsyncStorage.getItem(STORprelev_KEY)
                    const items = await getControlsMeta(res)
                    const filteredItems = items.filter(
                        (item) => item.dataset === selecteddataset,
                    )
                    setControls(filteredItems)
                }
            }
            filterControls()
        }

        // Update the ref with the latest selecteddataset value
        prevSelecteddatasetRef.current = selecteddataset
    }, [selecteddataset])


    function createColumns(columns) {
        return columns.map((c, i) => {
            let borders = {}
            if (headerBorders) {
                borders = _createBorderStyles(i, columns.length)
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
            )
        })
    }

    function renderItemNow(row, i) {
        const isLastRow = linii.length - 1 === i
        const rowStyle = [
            Style.row,
            customStyles.row,
            isLastRow ? {borderBottomWidth: 0} : {},
        ]
        return (
            <View key={i} style={rowStyle}>
                {createRow(row, i)}
            </View>
        )
    }

    const navigation = useNavigation()

    function updateControlDefinitiv(row) {
        let idC = Number(controls[row]['id'])
        putDefinitivControlMeta(idC)
    }

    function groupBydataset(data) {
        return data.reduce((groups, item) => {
            const key = item['dataset']
            if (!groups[key]) {
                groups[key] = []
            }
            groups[key].push(item)
            return groups
        }, {})
    }


    function createRows() {
        const groupedData = groupBydataset(controls)
        const filteredData = selecteddataset
            ? {[selecteddataset]: groupedData[selecteddataset]}
            : groupedData

        const renderItem = ({item}) => (
            <View style={Style.rowFront}>
                {createRow(item, controls.indexOf(item))}
            </View>
        )

        return (
            <View style={{flex: 1}}>
                {Object.entries(filteredData).map(([dataset, group]) => (
                    <View key={`group-${dataset}`} style={{marginBottom: 20}}>
                        <Text style={{fontWeight: 'bold', fontSize: 18}}>
                            {`Data Control selectată: ${dataset.split('T')[0]}`}
                        </Text>
                        <FlatList
                            data={group}
                            renderItem={renderItem}
                            keyExtractor={(item, index) => `row-${item.id}`}
                        />
                    </View>
                ))}
            </View>
        )
    }

    function formatDate(dateString) {
        // Parse the string datetime to a JavaScript Date object
        const dateObject = new Date(dateString)

        // Extract the date components
        const day = String(dateObject.getDate()).padStart(2, '0')
        const month = String(dateObject.getMonth() + 1).padStart(2, '0') // Months are 0-based, so add 1
        const year = dateObject.getFullYear()

        // Format the date components in the 'dd_mm_yyyy' format
        return `${day}_${month}_${year}`
    }

    const createFolderIfNotExists = async (folderName) => {
        let folderPath

        if (Platform.OS === 'web') {
            const rootPath = FileSystem.documentDirectory
            folderPath = `${rootPath}${folderName}/`


        } else {
            const {uri} = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}${folderName}/`)

            if (!uri) {
                folderPath = await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}${folderName}/`, {intermediates: true})
            } else {
                folderPath = uri
            }
        }

        return folderPath
    }
    function createRow(row, rowIndex) {
        let addColIndex = 0
        var entries = [
            row['id'],
            row['ferma'],
            row['dataset'],
            row['definitiv'],
        ]
        const uploadedFilesForRow = uploadedFiles[rowIndex] || []
        var cells = entries.map((cell, colIndex) => {
            colIndex = colIndex + addColIndex
            if (cell.hasOwnProperty('span')) {
                addColIndex += cell.span - 1
            }
            let borderStyle = {}
            if (borders) {
                borderStyle = _createBorderStyles(colIndex, row.length)
            }
            return createCell(
                cell,
                colIndex,
                rowIndex,
                borderStyle,
                row['definitiv'],
                `cell-${rowIndex}-${colIndex}`, // unique key prop
            )
        })

        return [


            cells[0],
            createCellIndex(
                '',
                1,
                controls.indexOf(row),
                0.5,
                `index-${rowIndex}`, // unique key prop
            ),
            ...cells.slice(1), // spread the cells array, excluding the first cell


        ]
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
        )
    }

    function deleteRow(row) {
        var newR = controls.filter((linie) => {
            return controls.indexOf(linie) !== Number(row) - 1
        })
        return setControls(newR)
    }

    function deleteRowC(row) {
        return setControls(controls.filter((linie) => linie !== row))
    }

    function editRow(row) {
        navigation.navigate('ControlNou', {
            datac: datac.toISOString().slice(0, 10),
            ferma: controls[row].ferma,
            controlId: controls[row].id,
            controlor: controlor,
            definitiv: controls[row].definitiv,
        })
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
        )
    }

    function createCell(cell, colIndex, rowIndex, borderStyle, definitiv, key) {
        let columnInput = columns[colIndex].input
        columnInput += `-${rowIndex}-${colIndex}`
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
            )
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
        )
    }

    function _createBorderStyles(i, length) {
        return {
            borderRightWidth: length - 1 > i ? 0.5 : 0,
        }
    }

    function _calculateCellWidths(widths) {
        const widthFlexs = []
        for (let i = 0; i < widths.length; i++) {
            widthFlexs.push(widths.length * (widths[i] * 0.01))
        }
        return widthFlexs
    }

    const onChange = (event, selectedDate) => {
        const currentDate = selectedDate || datac
        setDatac(currentDate)
        setShow(false)
    }

    const renderHeader = () => (
        <>
            <Text style={{fontSize: 20, color: 'tomato'}}>
                BUNA ZIUA {controlorName}!
            </Text>
            <TouchableOpacity
                style={{
                    margin: 10,
                    backgroundColor: '#2196f3',
                    minHeight: 70,
                    borderRadius: 10,
                }}
                onPress={() => navigation.navigate('ScanPaper', {controlor: controlor})}
            >
                <Text style={{color: 'white', fontSize: 24, textAlign: 'center'}}>
                    ADAUGA CONTROL
                </Text>
            </TouchableOpacity>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={{flex: 1, height: 2, backgroundColor: 'black'}} />
                <Text style={{width: 150, textAlign: 'center', fontSize: 22}}>Lista Controale</Text>
                <View style={{flex: 1, height: 2, backgroundColor: 'black'}} />
            </View>
        </>
    );

    return (
        <View style={{flex: 1}}>
            <ScrollView style={{flex: 1}}>
                <Text style={{fontSize: 20, color: 'tomato'}}>
                    BUNA ZIUA {controlorName}!
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
                        navigation.navigate('ScanPaper', {controlor: controlor})
                    }}
                >
                    <Text
                        style={{
                            color: 'white',
                            fontSize: 24,
                            textAlign: 'center',
                        }}
                    >
                        ADAUGA CONTROL
                    </Text>
                </TouchableOpacity>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View
                        style={{flex: 1, height: 2, backgroundColor: 'black'}}
                    />
                    <View>
                        <Text
                            style={{
                                width: 150,
                                textAlign: 'center',
                                fontSize: 22,
                            }}
                        >
                            Lista Controale
                        </Text>
                    </View>
                    <View
                        style={{flex: 1, height: 2, backgroundColor: 'black'}}
                    />
                </View>
                <View style={[Style.container, style, {minHeight: cellHeight}]}>
                    <View style={{flex: 1}}>
                        <View style={{flex: 1, flexDirection: 'column'}}>
                            <View style={[Style.row, customStyles.row]}>
                                {createColumns(columns)}
                            </View>
                            {createRows(controls)}
                            {renderFilterOptions()}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    )
}
Controale.defaultProps = {
    controls: [],

    borders: false,
    headerBorders: false,
    style: {},
    customStyles: {},
    cellHeight: 40,
}

Controale.propTypes = {
    cellHeight: PropTypes.number,
    onCellChange: PropTypes.func,
    onColumnChange: PropTypes.func,
    customStyles: PropTypes.object,
    navigation: PropTypes.object,
    borders: PropTypes.bool,
    headerBorders: PropTypes.bool,
}
