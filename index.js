import express from 'express'
import pg from 'pg'
import format from 'pg-format'

import 'dotenv/config'

const types = pg.types
types.setTypeParser(types.builtins.NUMERIC, val => +val)

const app = express()
const port = 3000

const client = new pg.Client()
await client.connect()

let reverseTypes = Object.keys(types.builtins).reduce((prev, current) => {
    return Object.assign(prev, {
        [types.builtins[current]]: current
    })
}, {})

app.use(express.static('public'))

app.get('/data', async (req, res) => {
    console.log
    let data = await client.query(`
    SELECT *
    FROM pg_catalog.pg_tables
    WHERE schemaname != 'pg_catalog' AND 
        schemaname != 'information_schema';
`)

    res.json({
        tables: data.rows,
        types: reverseTypes
    })
})

app.get('/data/:tablename', async (req, res) => {
    let table = req.params.tablename
    let data = await client.query(format("SELECT * FROM %I", table))

    res.json({
        rows: data.rows,
        columns: data.fields
    })
})

app.listen(port, () => {
    console.log("listening on " + port)
})

async function cleanup() {
    console.log("\ncleaning up")
    await client.end()

    process.exit()
}

process.on('SIGTERM', async () => await cleanup())
process.on('SIGINT',  async () => await cleanup())