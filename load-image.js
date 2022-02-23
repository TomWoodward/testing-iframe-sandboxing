console.log('here');

try {
  console.log('embed cookies: ', document.cookie);
} catch (e) {
  console.log('cant read cookies');
}

fetch('https://openstax.org/rex/release.json')
  .then(response => response.json())
  .then(json => console.log(json))
  .catch(() => console.log('fetch request failed'))
;

window.addEventListener("message", (event) => {
    console.log(event);
}, false);

const img1 = document.createElement('img');
img1.src = 'http://localhost:8080/test-image.png'
img1.style.maxWidth = '30%';
const img2 = document.createElement('img');
img2.src = 'http://localhost:8081/test-image.png'
img2.style.maxWidth = '30%';
const img3 = document.createElement('img');
img3.src = 'http://localhost:8082/test-image.png'
img3.style.maxWidth = '30%';
const img4 = document.createElement('img');
img4.src = 'http://localhost:8083/test-image.png'
img4.style.maxWidth = '30%';

// try to remove csp meta tag (does nothing)
document.querySelectorAll('meta').forEach(e => e.remove());

window.onload = () => {
  console.log('loaded');

  // try to remove csp meta tag (does nothing)
  document.querySelectorAll('meta').forEach(e => e.remove());

  alert('asdf');

  setTimeout(() => {
    document.body.appendChild(img1)
    document.body.appendChild(img2)
    document.body.appendChild(img3)
    document.body.appendChild(img4)
  }, 1000);

  window.parent.document.body.style.backgroundColor = 'red'
}
