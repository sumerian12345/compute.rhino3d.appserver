const express = require('express')
const router = express.Router()
const io = require('../io')
const Mustache = require('mustache')
const fs = require('fs')
const path = require('path')

router.get('/:name', async (req, res, next) => {
  const definition = req.app.get('definitions').find(o => o.name === req.params.name)

  if (definition === undefined)
    res.status(404).json({ message: 'Definition not found on server.' })
  
  const baseurl = req.protocol + '://' + req.get('host')

  let data
  try {
    data = await io.getParams(definition, baseurl)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }

  view = {
    name: data.name
  }
  view.inputs = []
  for (const input of data.inputs) {
    const name = input.Name.split(':')[1]
    const id = name
    switch (input.ParamType) {
      case 'Integer':
        view.inputs.push({
          name: name,
          id: id,
          range: {
            min: 3,
            max: 4,
            value: 3,
            step: 1
          }
        })
        break;
      case 'Number':
        view.inputs.push({
          name: name,
          id: id,
          range: {
            min: 3,
            max: 4,
            value: 3,
            step: 1
          }
        })
        break
      case 'Boolean':
        view.inputs.push({
          name: name,
          id: id,
          bool: {
            value: false
          }
        })
      default:
        break;
    }
  }

  const mst = path.join(__dirname, '..', 'templates', 'basic.mustache')
  const template = fs.readFileSync(mst)
  const content = Mustache.render(template.toString(), view)

  res.send(content)
})

module.exports = router
