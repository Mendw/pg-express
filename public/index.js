let columnTypesLookup
let rows, columns, columnTypes

let canvas
let tableSelect

let xCol = {}
let yCol = {}
let cCol = {}

let chart
let tables

let applyButton

function optionPlaceholder(innerText, isDisabled=true) {
    let placeholder = document.createElement("option")

    placeholder.value = ""
    placeholder.disabled = isDisabled
    placeholder.selected = true
    placeholder.innerText = innerText

    return placeholder
}

function updateColSelect() {
    xCol.element.innerHTML = ''
    xCol.element.appendChild(optionPlaceholder("Seleccione"))

    yCol.element.innerHTML = ''
    yCol.element.appendChild(optionPlaceholder("Seleccione"))

    cCol.element.innerHTML = ''
    cCol.element.appendChild(optionPlaceholder("Ninguna", false))

    for(let column of columns) {
        let option = document.createElement("option")
        option.value = column.name
        option.innerText = column.name

        xCol.element.appendChild(option)
        yCol.element.appendChild(option.cloneNode(true))
        cCol.element.appendChild(option.cloneNode(true))
    }
}

async function fetchTable(table) {
    fetch(`/data/${table}`).then(res => res.json()).then(({
        rows: rows_, 
        columns: columns_
    }) => {
        rows = rows_
        columns = columns_

        columnTypes = columns.reduce((prev, current) => {
            return Object.assign(prev, {
                [current.name]: columnTypesLookup[current.dataTypeID]
            })
        }, {})

        console.log(columnTypes)
        updateColSelect()
    })
}

function updateTableSelect() {
    let placeholder = optionPlaceholder("Seleccionar tabla")

    tableSelect.innerHTML = ''
    tableSelect.appendChild(placeholder)

    for(let table of tables) {
        let option = document.createElement("option")
        option.value = table.tablename
        option.innerText = table.tablename

        tableSelect.appendChild(option)
    }
}

async function fetchInitial() {
    fetch('/data').then(res => res.json()).then(({tables: tables_, types}) => {
        tables = tables_
        columnTypesLookup = types
        updateTableSelect()
    })
}

let colors = ["red", "blue", "green", "brown", "chocolate", "black"]

function buildDataset() {
    if(xCol.element.value === '' || yCol.element.value === '') return
    if(xCol.type !== "NUMERIC" || yCol.type !== "NUMERIC") return
    if(cCol.element.value !== '' && cCol.type !== "VARCHAR") return

    let x = xCol.element.value
    let y = yCol.element.value
    let c = cCol.element.value

    if(c === '') {
        chart.data.datasets = [{
            label: tableSelect.value,
            data: rows.map(row => ({
                x: row[x],
                y: row[y]
            })),
            backgroundColor: colors[Math.floor(Math.random() * colors.length)]
        }]
    } else {
        console.log(c)
        let splitData = rows.reduce((prev, current) => {
            if(!(current[c] in prev)) {
                prev[current[c]] = [{
                    x: current[x],
                    y: current[y]
                }]
            } else {
                prev[current[c]].push({
                    x: current[x],
                    y: current[y]
                })
            }

            return prev
        }, {})

        chart.data.datasets = []

        let splitDataKeys = Object.keys(splitData)
        for(let index = 0; index < splitDataKeys.length; index++) {
            let key = splitDataKeys[index]

            chart.data.datasets.push({
                label: key,
                data: splitData[key],
                backgroundColor: colors[index % colors.length]
            })
        }
    }

    chart.update('none')
}

window.onload = () => {
    tableSelect = document.querySelector("#table-select")
    tableSelect.addEventListener('input', () => {
        xCol.element.value = ""
        delete xCol.type

        yCol.element.value = ""
        delete yCol.type

        cCol.element.value = ""
        delete cCol.type

        fetchTable(tableSelect.value)
    })

    xCol.element = document.querySelector("#x-col")
    xCol.element.addEventListener('input', () => {
        xCol.type = columnTypes[xCol.element.value]
    })

    yCol.element = document.querySelector("#y-col")
    yCol.element.addEventListener('input', () => {
        yCol.type = columnTypes[yCol.element.value]
    })

    cCol.element = document.querySelector('#c-col')
    cCol.element.addEventListener('input', () => {
        cCol.type = columnTypes[cCol.element.value]
    })

    canvas = document.querySelector("#chart")
    let ctx = canvas.getContext("2d")

    chart = new Chart(ctx, {
        type: "scatter",
        data: {
            datasets: []
        },
        options: {
            maintainAspectRatio: false,
            responsive: false
        }
    })

    applyButton = document.querySelector("#apply")
    applyButton.addEventListener('click', () => {
        buildDataset()
    })

    fetchInitial()
}   