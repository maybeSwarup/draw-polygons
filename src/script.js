import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline';
import { Group } from 'three';

// Debug
// const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Lights
const pointLight = new THREE.PointLight(0xffffff, 0.1)
pointLight.position.x = 2
pointLight.position.y = 3
pointLight.position.z = 4
scene.add(pointLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    plane: {
        width: 10,
        height: 10
    }
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 5
scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
function animate() {
    requestAnimationFrame(animate);
    render()
}

function render() {

    renderer.render(scene, camera);
}

const colors = {
    line: '#038509',
    polygonEdge: '#080808',
    polygon: '#fa773e'
}

let dragObject = false
let movingObject = null

function makePlane(width, height) {
    const geometry = new THREE.PlaneBufferGeometry(width, height, width, height)
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geometry, material);
    return plane
}
function makeGrid(size, divisions) {
    const gridHelper = new THREE.GridHelper(size, divisions);
    gridHelper.rotateX(Math.PI / 2)
    return gridHelper
}
const plane = makePlane(sizes.plane.width, sizes.plane.height)
const grid = makeGrid(sizes.plane.width, sizes.plane.height)
scene.add(plane, grid);

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
const intersectionPoint = new THREE.Vector3()
const planeNormal = new THREE.Plane()

let polygonVertices = []

function assignMouseCoordinates(event) {

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
}

function handleClick(event) {

    if (dragObject) {
        dragObject = false
    } else {
        raycaster.setFromCamera(mouse, camera)
        // raycaster.ray.intersectPlane(plane, intersectionPoint)
        // console.log(intersectionPoint)

        const objects = [scene.children[2]]
        const intersects = raycaster.intersectObjects(objects)
        if (intersects.length > 0) {
            polygonVertices.push(intersects[0].point)
            // console.log('clicked on plane', polygonVertices)

            drawLineFromPolygonVertices(polygonVertices)
        }
    }
}

function drawLineFromPolygonVertices(polygonVertices) {
    if (polygonVertices.length > 1) {
        drawLine(polygonVertices.slice(polygonVertices.length - 2))
    }
}

function makeLine(points) {
    const material = new THREE.LineBasicMaterial({ color: colors.line, linewidth: 2 });
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    return line
}

function drawLine(points) {
    const line = makeLine(points)
    scene.add(line)
    // console.log('drawLine', scene)
}

function makePolygon(vertices) {
    // console.log('makePolygon', vertices)

    const points = vertices.map(v => new THREE.Vector2(v.x, v.y))

    const shape = new THREE.Shape(points);

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({ color: colors.polygon });
    const polygon = new THREE.Mesh(geometry, material);
    polygon.position.set(0, 0, 0.001)

    return polygon
}

function drawPolygon(vertices) {
    const polygon = makePolygon(vertices)
    scene.add(polygon)
}

function clickComplete(e) {
    // console.log('clickComplete', polygonVertices)
    if (polygonVertices.length < 3) {
        window.alert('Make atleast three vertices!')
    } else {
        polygonVertices.push(polygonVertices[0])
        drawLineFromPolygonVertices(polygonVertices)
        drawPolygon(polygonVertices)
        polygonVertices = []
    }
}

function clickCopy(e) {
    // console.log('clickCopy', scene)
    if (scene.children[scene.children.length - 1].type == 'Mesh') {
        dragObject = true

        const copiedObject = scene.children[scene.children.length - 1]

        const newObject = new THREE.Mesh(copiedObject.geometry, copiedObject.material)

        scene.add(newObject)
    } else {
        window.alert('Create a polygon first!')
    }
}

function moveObjectAlongMouse() {
    movingObject = scene.children[scene.children.length - 1]
    movingObject.position.set(mouse.x * 4.999, mouse.y * 4.999, 0.001)
}

function handleMousemove(e) {
    assignMouseCoordinates(e)
    if (dragObject) {
        moveObjectAlongMouse()
    }
}

function clickReset(e) {
    // console.log('clickReset', scene)
    while (scene.children.length > 4) {
        scene.children.pop()
    }
}

const completeButton = document.querySelector('#complete')
completeButton.addEventListener('click', clickComplete)

const copyButton = document.getElementById('copy')
copyButton.addEventListener('click', clickCopy)

const resetButton = document.getElementById('reset')
resetButton.addEventListener('click', clickReset)

canvas.addEventListener('click', handleClick)
canvas.addEventListener('mousemove', handleMousemove)

animate()