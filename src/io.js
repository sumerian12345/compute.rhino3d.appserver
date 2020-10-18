const compute = require('compute-rhino3d')

compute.url = process.env.RHINO_COMPUTE_URL
compute.apiKey = process.env.RHINO_COMPUTE_KEY

async function getParams(definition, baseurl) {
  
  let data = { name: definition.name }

  if (Object.prototype.hasOwnProperty.call(definition, 'inputs') &&
      Object.prototype.hasOwnProperty.call(definition, 'outputs')) {
    data.inputs = definition.inputs
    data.outputs = definition.outputs
    return data
  }
  
  let definitionPath = `${baseurl}/definition/${definition.id}`

  const response = await compute.computeFetch('io', { 'pointer': definitionPath }, false)

  // throw error if response not ok
  if (!response.ok) {
    throw new Error(response.statusText)
  }

  const result = await response.json()

  let inputs = result.inputs === undefined ? result.inputNames : result.inputs
  let outputs = result.outputs === undefined ? result.outputNames: result.outputs

  data.inputs = inputs
  data.outputs = outputs

  definition.inputs = inputs
  definition.outputs = outputs

  return data
}

module.exports = {
  getParams: getParams
}
