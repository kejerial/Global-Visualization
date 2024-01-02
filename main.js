import * as THREE from 'three';
import gsap from './node_modules/gsap';
import countries from './countries.json';


const canvasContainer = document.querySelector('#canvasContainer');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, canvasContainer.offsetWidth / canvasContainer.offsetHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer(
  {
    antialias: true,
    canvas: document.querySelector('canvas')
});
renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight)
renderer.setPixelRatio(devicePixelRatio);

const globe = new THREE.Mesh( 
  new THREE.SphereGeometry(7, 50, 50), 
  new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('img/01-3.jpg')}));
const group = new THREE.Group();
group.add(globe);

scene.add(group);

camera.position.z = 15;

const starGeometry = new THREE.BufferGeometry()
const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff
})

const starVertices = []
for (let i = 0; i < 2500; i++) {
  const x = (Math.random() - 0.5) * 1000
  const y = (Math.random() - 0.5) * 1000
  const z = -Math.random() * 3000
  starVertices.push(x, y, z)
}

starGeometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(starVertices, 3)
)

const stars = new THREE.Points(starGeometry, starMaterial)
scene.add(stars)

const popUp = document.querySelector('#popUp');
const popUpName = document.querySelector('#name');
const popUpType = document.querySelector('#type');
const popUpValue = document.querySelector('#value');
const dropDown = document.querySelector('#stat-types');

countries.forEach((country) => {
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(.2, .2, 2),
    new THREE.MeshBasicMaterial({ 
      color: 0x3BF7FF,
      transparent: true,
      opacity: 0.5
    })
  );

  const radius = globe.geometry.parameters.radius;
  const latitude = (country.Latitude / 180) * Math.PI
  const longitude = (country.Longitude / 180) * Math.PI

  const x = radius * Math.cos(latitude) * Math.sin(longitude)
  const y = radius * Math.sin(latitude)
  const z = radius * Math.cos(latitude) * Math.cos(longitude)

  box.position.x = x
  box.position.y = y
  box.position.z = z

  box.lookAt(0, 0, 0);

  box.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 0));

  box.object = country;

  group.add(box);
});

globe.rotation.y = - Math.PI / 2;

const raycaster = new THREE.Raycaster();
const mouse = {
  x: undefined,
  y: undefined,
  x_0: undefined,
  y_0: undefined,
  down: false
}

const boxes = group.children.filter((mesh) => {
  return mesh.geometry.type === 'BoxGeometry';
});

function getHighest() {
  let highestValue = 0;
  for (let i = 0; i < countries.length; i++) {
    let value = String(countries[i][dropDown.value]);
    if (value != "") { 
      let num = (String(value)).replace(/[,]/g, '');
      num = Number(num.replace(/[$%]/g, ''));

      if (num > highestValue) {
        highestValue = num;
      }
    }
  }
  return highestValue;
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  raycaster.setFromCamera(mouse, camera);

  var highestValue = getHighest();

  group.children.forEach((mesh) => {
    mesh.material.opacity = 0.5;
  })

  // Errors for when value is int, 
  boxes.forEach(currentElement => {
    let curr = currentElement.object[dropDown.value];
    if (curr != "") {
      let num = (String(curr)).replace(/,/g, '');
      num = Number(num.replace(/[$%]/g, ''));
      currentElement.scale.set(1, 1, Math.max(num/highestValue, 1/9));
      //currentElement.scale.set(1, 1, .5);
    }
    else {
      currentElement.scale.set(1, 1, 0);
    }
  });

  gsap.set(popUp, {
    display: 'none'
  })

  const intersects = raycaster.intersectObjects(boxes);
  
  for (let i = 0; i < intersects.length; i++) {
    const box = intersects[i].object;
    box.material.opacity = 1;
    gsap.set(popUp, { 
      display: 'block'
    })
    popUpName.innerHTML = box.object.Country;
    popUpType.innerHTML = dropDown.options[dropDown.selectedIndex].text;
    if (box.object[dropDown.value] != "") {
      popUpValue.innerHTML = box.object[dropDown.value];
    } else {
      popUpValue.innerHTML = "N/A";
    }
  }

  renderer.render(scene, camera);
}
animate();

canvasContainer.addEventListener('mousedown', ({clientX, clientY}) => {
  mouse.down = true;
  mouse.x_0 = clientX;
  mouse.y_0 = clientY;
});

addEventListener('mouseup', (event) => {
  mouse.down = false;
});

addEventListener('mousemove', (event) => {
  event.preventDefault();

  mouse.x = (event.clientX / canvasContainer.clientWidth) * 2 - 1
  mouse.y = -((event.clientY - (innerHeight - canvasContainer.clientHeight)) / canvasContainer.clientHeight) * 2 + 1;

  gsap.set(popUp, {
    x: event.clientX,
    y: event.clientY
  })

  if (mouse.down) {
    group.rotation.y += (event.clientX - mouse.x_0) * 0.005;
    group.rotation.x += (event.clientY - mouse.y_0) * 0.005;
    mouse.x_0 = event.clientX;
    mouse.y_0 = event.clientY;
  }
});

