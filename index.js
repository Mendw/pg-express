import express from 'express'
import pg from 'pg'
import cors from 'cors'
import fileUpload from 'express-fileupload'

import format from 'pg-format'

import 'dotenv/config'

const types = pg.types
const builtinTypes = types.builtins

const app = express()
const port = 3000

const client = new pg.Client()
await client.connect()

let reverseTypes = Object.keys(builtinTypes).reduce((prev, current) => {
    return Object.assign(prev, {
        [builtinTypes[current]]: current
    })
}, {})

app.use(cors())
app.use(fileUpload())

app.get('/', async (req, res) => {
    res.json({
        types: reverseTypes
    })
})

app.get('/tables', async (req, res) => {
    await client.query(`
    SELECT *
        FROM pg_catalog.pg_tables
        WHERE schemaname != 'pg_catalog' AND 
            schemaname != 'information_schema';
    `).then(data => {
        res.json({
            tables: data.rows
        })
    })
})

app.get('/tables/:name', async (req, res) => {
    let table = req.params.name

    await client.query(
        format("SELECT * FROM %I", table)
    ).then(data => {
        res.json({
            rows: data.rows,
            columns: data.fields
        })
    })
})

app.post('/parse', async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    let dataFile = req.files.dataFile
    dataFile.mv(`./data/${dataFile.name}`, (err) => {
        if(err) return res.status(500).send("oopsy")
        res.status(200).send('Uplodaded!')
    })
})

app.listen(port, () => {
    console.log("App started\nListening on port " + port)
})

async function cleanup() {
    await client.end()
    process.exit()
}

process.on('SIGTERM', async () => await cleanup())
process.on('SIGINT',  async () => await cleanup())