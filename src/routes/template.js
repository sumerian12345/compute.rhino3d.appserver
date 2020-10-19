const express = require('express')
const router = express.Router()
const io = require('../io')
const registerDefinitions = require('../registerDefinitions.js')
const Mustache = require('mustache')
const fs = require('fs')
const path = require('path')
var multer  = require('multer')

var storage = multer.diskStorage({
  destination: 'src/files/',
  filename: function (req, file, cb) {
    // HACK: use original filename for upload so we know where to redirect
    cb(null, file.originalname)
  }
})

var upload = multer({ storage: storage })

router.get('/', (req, res) => {
  // moved to static example files
  res.redirect('/example/upload')
})

router.post('/upload', upload.single('file'), (req, res) => {
  console.log(req.file)

  // TODO: only register the new definition
  const definitions = registerDefinitions()
  req.app.set('definitions', definitions)

  res.status(201).json({ url: '/template/' + req.file.filename })
})

router.get('/:name', async (req, res, next) => {
  const definition = req.app.get('definitions').find(o => o.name === req.params.name)

  if (definition === undefined) {
    res.status(404).json({ message: 'Definition not found on server.' })
    return
  }
  
  const baseurl = req.protocol + '://' + req.get('host')

  let data
  try {
    data = await io.getParams(definition, baseurl)
  } catch (error) {
    res.status(500).json({ message: error.message })
    return
  }

  view = {
    name: data.name
  }
  view.inputs = []
  for (const input of data.inputs) {
    const name = input.name
    const id = name
    switch (input.paramType) {
      case 'Integer':
        view.inputs.push({
          name: name,
          id: id,
          number: {
            value: input.integer.value
          }
        })
        break;
      case 'Number':
        view.inputs.push({
          name: name,
          id: id,
          number: {
            value: input.number.value
          }
        })
        break
      case 'Boolean':
        view.inputs.push({
          name: name,
          id: id,
          bool: {
            value: input.boolean.value
          }
        })
        break
      case 'Slider':
        view.inputs.push({
          name: name,
          id: id,
          range: {
            min: input.range.min,
            max: input.range.max,
            value: input.range.value,
            step: 1
          }
        })
        break
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
