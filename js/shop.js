const path = window.location.pathname;

if (path.endsWith("resources.html") || path.endsWith("index.html") || path === "/" || path.endsWith("/")) {
    window.onload = fetchResources;
} else if (window.location.href.match('detail.html') !== null) {
    window.onload = fetchResource;
} else if (window.location.href.match('borrow.html') !== null) {
    window.onload = fetchBorrowed;
} else if (window.location.href.match('borrow-history.html') !== null) {
    window.onload = fetchBorrowedHistory;
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

function renderPagination({ currentPage, previousPage, nextPage, lastPage, hasPreviousPage, hasNextPage }) {
  const paginationContainer = document.getElementById('pagination');
  if (!paginationContainer) return;

  let html = '';

  if (currentPage !== 1 && previousPage !== 1) {
    html += `<a href="#" data-page="1">1</a>`;
  }
  if (hasPreviousPage) {
    html += `<a href="#" data-page="${previousPage}">${previousPage}</a>`;
  }

  // Current page - highlighted
  html += `<a href="#" class="active" data-page="${currentPage}">${currentPage}</a>`;

  if (hasNextPage) {
    html += `<a href="#" data-page="${nextPage}">${nextPage}</a>`;
  }
  if (currentPage !== lastPage && nextPage !== lastPage) {
    html += `<a href="#" data-page="${lastPage}">${lastPage}</a>`;
  }

  paginationContainer.innerHTML = html;

  paginationContainer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const page = +event.target.getAttribute('data-page');
      fetchResources(page);
    });
  });
}


function getActionButtonHTML(resource, borrowedResources = null) {
  if (!borrowedResources) {
    return '';
  }

  const hasBorrowed = borrowedResources.find(
    r => r.resourceId.toString() === resource._id.toString()
  );

  if (!hasBorrowed && resource.availableStatus) {
    return `<button class="btn" onclick="borrowResource('${resource._id}')">Borrow</button>`;
  }

  if (!hasBorrowed && !resource.availableStatus) {
    return `<p style="color: red; margin-top: 0.75rem;">Item is not available</p>`;
  }

  if (hasBorrowed && !resource.availableStatus) {
    return `<a class="btn" href="./checkout.html?resourceId=${resource._id}">Return</a>`;
  }

  return `<button class="btn" onclick="borrowResource('${resource._id}')">Borrow</button>`;
}


function navbarLinks(isAuthenticated, activeLinkNUM) {
  const navLeftUl = document.getElementById('left-list');
  const navRightUl = document.getElementById('right-list');

  if (navLeftUl.getAttribute('data-rendered') === 'true') return;

  let borrow = "./shop/borrow.html";
  let history = "./shop/borrow-history.html";
  let adminEdit = "./admin/edit-resource.html";
  let adminResource = "./admin/resources.html";

  if (window.location.href.match('index.html') === null) {
    borrow = "./borrow.html";
    history = "./borrow-history.html";
    adminEdit = "../admin/edit-resource.html";
    adminResource = "../admin/resources.html";
  }

  if (isAuthenticated) {
    navLeftUl.insertAdjacentHTML('beforeend', `
      <li><a href=${borrow} id="nav-1">Borrowed</a></li>
      <li><a href=${history} id="nav-2">Borrow History</a></li>
      <li><a href=${adminEdit} id="nav-3">Add Resource</a></li>
      <li><a href=${adminResource} id="nav-4">Admin Resources</a></li>
    `);
    navLeftUl.setAttribute('data-rendered', 'true');

    const activeLink = document.getElementById(`nav-${activeLinkNUM}`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  let login = "./auth/login.html";
  let signup = "./auth/signup.html";

  if (window.location.href.match('index.html') === null) {
    login = "../auth/login.html";
    signup = "../auth/signup.html";
  }

  if (!isAuthenticated) {
    navRightUl.innerHTML = `
      <li style="margin-right: 15px;">
        <a href=${login}>Login</a>
      </li>
      <li>
        <a href=${signup}>Signup</a>
      </li>
    `;
  } else {
    navRightUl.innerHTML = `
      <li>
        <button class="btn" style="border: none; color: lightgray;" type="button" onclick="logout()">Logout</button>
      </li>
    `;
  }
}



async function fetchResources(page = 1) {
  try {
    const response = await fetch(`${API_BASE_URL}/?page=${page}`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch resources');
    }

    const data = await response.json();

    navbarLinks(data.isAuthenticated, 0);

    const container = document.getElementById('resource-grid');
    container.innerHTML = '';

    if (!data.resources || data.resources.length === 0) {
      container.innerHTML = '<h1>No Resources Found!</h1>';
      return;
    }

    const borrowedResources = data.loggedInUser?.borrowedItems?.resources || null;

    data.resources.forEach(resource => {
      const div = document.createElement('div');
      div.classList.add('item');

      const actionHTML = getActionButtonHTML(resource, borrowedResources);

      div.innerHTML = `
        <h3>${resource.title}</h3>
        <p><strong>Author:</strong> ${resource.author}</p>
        <p><strong>Year:</strong> ${resource.publicationYear}</p>
        <p><strong>Genre:</strong> ${resource.genre}</p>
        <div class="buttons">
          <a class="btn" href="detail.html?id=${resource._id}">Details</a>
          ${actionHTML}
        </div>
      `;

      container.appendChild(div);
    });

    // Render pagination
    renderPagination({
      currentPage: data.currentPage,
      previousPage: data.previousPage,
      nextPage: data.nextPage,
      lastPage: data.lastPage,
      hasPreviousPage: data.hasPreviousPage,
      hasNextPage: data.hasNextPage,
    });

  } catch (error) {
    console.error(error);
    document.getElementById('resource-grid').innerHTML = '<h1>Error loading resources.</h1>';
  }
}


async function logout() {

  localStorage.removeItem('token');
  
  window.location.href = './resources.html';
}

async function borrowResource(resourceId) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in to borrow resources.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/borrow`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ resourceId })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Borrow failed');
    }

    window.location.href = './borrow.html';

  } catch (error) {
    console.error(error);
  }
}

async function fetchResource() {
  try {
    const params = new URLSearchParams(window.location.search);
    const resourceId = params.get('id');

    if (!resourceId) {
      throw new Error('Missing resource ID');
    }

    const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch resource');
    }

    const resourceData = await response.json();

    navbarLinks(resourceData.isAuthenticated, 0);


    const container = document.getElementById('resource-grid');
    container.innerHTML = '';


    const div = document.createElement('div');
    div.classList.add('item');

    const borrowedResources = resourceData.loggedInUser?.borrowedItems?.resources || [];

    const actionHTML = getActionButtonHTML(resourceData.resource, borrowedResources);

    div.innerHTML = `
      <h3>${resourceData.resource.title}</h3>
      <p><strong>Author:</strong> ${resourceData.resource.author}</p>
      <p><strong>Year:</strong> ${resourceData.resource.publicationYear}</p>
      <p><strong>Genre:</strong> ${resourceData.resource.genre}</p>`;
      if (resourceData.isAuthenticated) {
        div.innerHTML += `
        <div class="buttons">
          ${actionHTML}
        </div>
      `;
      }
    
    container.appendChild(div);
  } catch (error) {
    console.error(error);
    document.getElementById('resource-grid').innerHTML = '<h1>Error loading resource.</h1>';
  }
}

async function fetchBorrowed() {
    try {
        const response = await fetch(`${API_BASE_URL}/borrow`, {
            method: 'GET',
            headers: {
                'Authorization' : 'Bearer ' + localStorage.getItem('token'),
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch borrowed resources');
        }

        const borrowedResources = await response.json();

        navbarLinks(borrowedResources.isAuthenticated, 1);

        const container = document.getElementById('resource-grid');
        container.innerHTML = '';

        if (!borrowedResources.resources || borrowedResources.resources.length === 0) {
            container.innerHTML = '<h1>No Resources Found!</h1>';
            return;
        }

        borrowedResources.resources.forEach(resource => {
            const div = document.createElement('div');
            div.classList.add('item');

            div.innerHTML = `
                <h3>${resource.title}</h3>
                <hr />
                <h5>Due Date: ${resource.dueDate || 'N/A'}</h5>
                <p><strong>Author:</strong> ${resource.author}</p>
                <p><strong>Year:</strong> ${resource.publicationYear}</p>
                <p><strong>Genre:</strong> ${resource.genre}</p>
                <div class="buttons">
                    <a class="btn" href="./checkout.html?resourceId=${resource._id}">Return</a>
                </div>
            `;

            container.appendChild(div);
        });
    } catch (error) {
        console.error(error);
        document.getElementById('resource-grid').innerHTML = '<h1>Error loading borrowed resources.</h1>';
    }
};

async function fetchBorrowedHistory() {
  try {
    const response = await fetch(`${API_BASE_URL}/borrow-history`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch borrow history');
    }

    const borrowHistoryData = await response.json();

    navbarLinks(borrowHistoryData.isAuthenticated, 2);

    const container = document.getElementById('resource-grid');
    container.innerHTML = '';

    if (!borrowHistoryData.returneds || borrowHistoryData.returneds.length === 0) {
      container.innerHTML = '<h1>No Borrow History Found!</h1>';
      return;
    }

    borrowHistoryData.returneds.forEach(record => {
      const recordDiv = document.createElement('div');
      recordDiv.classList.add('record-entry');

      const innerItems = record.resources.map(resource => `
        <div class="item">
          <h3>${resource.title}</h3>
          <p><strong>Author:</strong> ${resource.author}</p>
          <p><strong>Year:</strong> ${resource.publicationYear}</p>
          <p><strong>Genre:</strong> ${resource.genre}</p>
          <p><strong>Returned Date:</strong> ${resource.returnedDate || 'N/A'}</p>
        </div>
      `).join('');

      recordDiv.innerHTML = `
        <h3>#${record._id} - <button onclick="downloadInvoice('${record._id}')" class="btn" style="border: none;">Invoice</button></h3>
        <div class="item-grid">
          ${innerItems}
        </div>
      `;

      container.appendChild(recordDiv);
    });

  } catch (error) {
    console.error(error);
    document.getElementById('resource-grid').innerHTML = '<h1>Error loading borrow history.</h1>';
  }
}

function downloadInvoice(id) {
  const token = localStorage.getItem('token');

  fetch(`${API_BASE_URL}/borrow-history/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to download invoice');
    }
    return response.blob();
  })
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  })
  .catch(err => {
    console.error(err);
    alert('Error downloading invoice');
  });
}
