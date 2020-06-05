const express = require('express');
let router = express.Router();
const compute = require('compute-rhino3d');

router.get('/',  function(req, res, next) {
  
  let definitions = [];
  req.app.get('definitions').forEach( def => {
    let data = {name: def.name, inputs: def.inputs, outputs: def.outputs};
    definitions.push(data);
  });

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(definitions));
});

// Solve GH definition
router.post('/:name', function(req, res, next) {

  let definition = req.app.get('definitions').find(o => o.name === req.params.name);
  
  if(definition === undefined)
    throw new Error('Definition not found on server.'); 

  compute.url = req.app.get('computeUrl');
  let fullUrl = req.protocol + '://' + req.get('host');

  // set parameters
  let trees = [];
  definition.inputs.forEach( input => {
      // match body object parameter to definition input
      let param = new compute.Grasshopper.DataTree(input);
      param.append([0], [req.body.inputs[input]]);
      trees.push(param);
  });

let definitionPath = fullUrl + '/definition/'+ definition.id;

compute.Grasshopper.evaluateDefinition(definitionPath, trees).then(result => {
  
  res.setHeader('Content-Type', 'application/json');
  res.send(result);

  }).catch( (error) => { 
      console.log(error);
      res.send('error in solve');
  });
    
});

module.exports = router;
