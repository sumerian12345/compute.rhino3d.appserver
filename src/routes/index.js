const express = require('express')
const router = express.Router()
const io = require('../io')

// Return information related to the definitions on the server
router.get('/', function(req, res, next) {
  let definitions = []
  req.app.get('definitions').forEach( def => {
    let data = {name: def.name, inputs: def.inputs, outputs: def.outputs}
    definitions.push(data)
  })

  res.setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(definitions))
})

// Return information related to a specific definition
router.get('/:name', async function(req, res, next) {
  const definition = req.app.get('definitions').find(o => o.name === req.params.name)

  if (definition === undefined)
    throw new Error('Definition not found on server.')
  
  const baseurl = req.protocol + '://' + req.get('host')

  let data
  try {
    data = await io.getParams(definition, baseurl)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }

  res.json(data)
})

module.exports = router
