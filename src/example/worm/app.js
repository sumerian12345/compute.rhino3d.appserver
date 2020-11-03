import * as THREE from 'https://unpkg.com/three@0.122.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.122.0/examples/jsm/controls/OrbitControls.js';

let data = {}
data.definition = 'worm.gh'
data.inputs = {
  'curve':null
}

let _threeMesh, _threeMaterial, rhino

rhino3dm().then(async m => {
  console.log('Loaded rhino3dm.')
  rhino = m // global

  init()
  compute()
})

/**
 * Call appserver
 */
async function compute() {

  const crvPoints = new rhino.Point3dList()
  crvPoints.add( 0, 0, 0,)
  crvPoints.add( 10, 10, 0,)
  crvPoints.add( 20, -10, 0,)
  crvPoints.add( 30, 10, 20,)
  crvPoints.add( 40, -10, -20,)
  crvPoints.add( 50, 0, 0,)

  const nCrv = rhino.NurbsCurve.create( false, 3, crvPoints)

  data.inputs.curve = JSON.stringify( nCrv.encode() )

  const request = {
    'method':'POST',
    'body': JSON.stringify(data),
    'headers': {'Content-Type': 'application/json'}
  }

  try {
    const response = await fetch('/solve', request)

    if(!response.ok)
      throw new Error(response.statusText)

    const responseJson = await response.json()

    // Request finished. Do processing here.

    // hide spinner
    document.getElementById('loader').style.display = 'none'

    // process mesh
    let mesh_data = JSON.parse(responseJson.values[0].InnerTree['{ 0; }'][0].data)
    let mesh = rhino.CommonObject.decode(mesh_data)

    console.log(mesh)
 
    if (!_threeMaterial) {
      _threeMaterial = new THREE.MeshBasicMaterial({vertexColors:true, side:2})
    }
    let threeMesh = meshToThreejs(mesh, _threeMaterial)

    scene.add(threeMesh);
    //data.inputs.mesh.delete()
    //replaceCurrentMesh(threeMesh)
    
  } catch(error){
    console.error(error)
  }


}

// BOILERPLATE //

var scene, camera, renderer, controls

function init () {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(1,1,1)
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 1, 1000 )

  renderer = new THREE.WebGLRenderer({antialias: true})
  renderer.setPixelRatio( window.devicePixelRatio )
  renderer.setSize( window.innerWidth, window.innerHeight )
  let canvas = document.getElementById('canvas')
  canvas.appendChild( renderer.domElement )

  controls = new OrbitControls( camera, renderer.domElement  )

  camera.position.z = 50

  window.addEventListener( 'resize', onWindowResize, false )

  animate()
}

var animate = function () {
  requestAnimationFrame( animate )
  controls.update()
  renderer.render( scene, camera )
}
  
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize( window.innerWidth, window.innerHeight )
  animate()
}

function replaceCurrentMesh (threeMesh) {
  if (_threeMesh) {
    scene.remove(_threeMesh)
    _threeMesh.geometry.dispose()
  }
  _threeMesh = threeMesh
  scene.add(_threeMesh)

}

function meshToThreejs (mesh, material) {
  let loader = new THREE.BufferGeometryLoader()
  var geometry = loader.parse(mesh.toThreejsJSON())
  return new THREE.Mesh(geometry, material)
}
