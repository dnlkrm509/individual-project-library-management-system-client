if (window.location.href.match('resources.html') !== null) {
    window.onload = fetchResources;
} if (window.location.pathname.includes('edit-resource.html')) {
  window.onload = loadEditForm;
}


const hostname = window.location.hostname;

const isLocal =
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "::1" ||
  hostname.startsWith("192.168.") ||
  hostname.startsWith("10.");

let API_BASE_URL;

if (isLocal) {
  API_BASE_URL = "http://localhost:8080";
} else {
  API_BASE_URL = "https://individual-project-library-management.onrender.com";
}

async function loadEditForm() {
  const urlParams = new URLSearchParams(window.location.search);
  const resourceId = urlParams.get('id');

  const response = await fetch(`${API_BASE_URL}/admin/user`, {
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get admin email.');
  }

  const data = await response.json();
  navbarLinks(true, data.loggedInUser.role, data.loggedInUser.email, 3);

  if (!resourceId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/admin/resource/${resourceId}`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch resource for editing.');
    }

    const data = await response.json();

    // Populate form
    document.getElementById('resourceId').value = data._id;
    document.getElementById('title').value = data.title;
    document.getElementById('author').value = data.author;
    document.getElementById('publicationYear').value = data.publicationYear;
    document.getElementById('genre').value = data.genre;

    document.querySelector('.edit-form .btn').textContent = 'Update Resource';

  } catch (err) {
    console.error(err);
    alert('Failed to load resource data.');
  }
}


function navbarLinks(isAuthenticated, role, email, activeLinkNUM) {
  const navLeftUl = document.getElementById('left-list');
  const navRightUl = document.getElementById('right-list');

  if (navLeftUl.getAttribute('data-rendered') === 'true') return;

  if (isAuthenticated) {
    if (role === "user") {
      navLeftUl.insertAdjacentHTML('beforeend', `
        <li class="nav-item">
          <a class="nav-link p-2" href="../shop/borrow.html" id="nav-1">Borrowed</a>
        </li>
        <li class="nav-item">
          <a class="nav-link p-2" href="../shop/borrow-history.html" id="nav-2">Borrow History</a>
        </li>
      `);
    }
    if (role === "admin") {
      navLeftUl.insertAdjacentHTML('beforeend', `
        <li class="nav-item">
          <a class="nav-link p-2" href="../admin/edit-resource.html" id="nav-3">Add Resource</a>
        </li>
        <li class="nav-item">
          <a class="nav-link p-2" href="../admin/resources.html" id="nav-4">Admin Resources</a>
        </li>
      `);
    }
    navLeftUl.setAttribute('data-rendered', 'true');

    const activeLink = document.getElementById(`nav-${activeLinkNUM}`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  if (!isAuthenticated) {
    navRightUl.innerHTML = `
      <li class="nav-item">
        <a  href="#" class="nav-link p-2" data-bs-toggle="modal" data-bs-target="#loginModal">Login</a>
      </li>
      <li class="nav-item">
        <a  href="#" class="nav-link p-2" data-bs-toggle="modal" data-bs-target="#registerModal">Signup</a>
      </li>
    `;
  } else {
    navRightUl.innerHTML = `
      <span class="navbar-text">
        Welcome back ${email}
      </span>
      <li class="nav-item">
        <a href="#" class="nav-link p-2" onclick="logout()">Logout</a>
      </li>
    `;
  }
}

async function fetchResources() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/resources`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch resources');
    }

    const data = await response.json();

    navbarLinks(data.isAuthenticated, data.loggedInUser?.role, data.loggedInUser?.email, 4);

    const container = document.getElementById('resource-grid');
    container.innerHTML = '';

    if (!data.resources || data.resources.length === 0) {
      container.innerHTML = '<h1>No Resources Found!</h1>';
      return;
    }

    data.resources.forEach(resource => {
      const div = document.createElement('div');
      div.classList.add('item');

      div.innerHTML = `
        <h3>${resource.title}</h3>
        <p><strong>Author:</strong> ${resource.author}</p>
        <p><strong>Year:</strong> ${resource.publicationYear}</p>
        <p><strong>Genre:</strong> ${resource.genre}</p>
        <div class="buttons">
          <a class="btn text-success" href="edit-resource.html?id=${resource._id}">Edit</a>
          <button class="btn btn-outline-danger" type="button" onclick="deleteResource('${resource._id}')">Delete</button>
        </div>
      `;

      container.appendChild(div);
    });

  } catch (error) {
    console.error(error);
    document.getElementById('resource-grid').innerHTML = '<h1>Error loading resources.</h1>';
  }
}

async function logout() {

  localStorage.removeItem('token');
  
  window.location.href = '../shop/resources.html';
}

async function updateResource() {
  const resourceId = document.getElementById('resourceId').value.trim();
  const title = document.getElementById('title').value.trim();
  const author = document.getElementById('author').value.trim();
  const year = document.getElementById('publicationYear').value.trim();
  const genre = document.getElementById('genre').value.trim();

  const payload = {
    title,
    author,
    year,
    genre
  };


  const method = resourceId ? 'PUT' : 'POST';
  const url = resourceId 
    ? `${API_BASE_URL}/admin/edit-resource/${resourceId}` 
    : `${API_BASE_URL}/admin/add-resource`;

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log(`Error: ${errorData.message || 'Something went wrong.'}`);
      return;
    }

    const result = await response.json();
    console.log(resourceId ? 'Resource updated!' : 'Resource added!');
    window.location.href = '../shop/resources.html';

  } catch (err) {
    console.error('Fetch error:', err);
    alert('Failed to save the resource. Try again.');
  }
}

const deleteResource = async (resourceId) => {
    const response = await fetch(`${API_BASE_URL}/admin/resource/` + resourceId, {
        method: 'DELETE',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    })
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log(`Error: ${errorData.message || 'Something went wrong.'}`);
      return;
    }

    const data = await response.json();
    console.log(data);
    window.location.href = './resources.html'
};