const sortBy = document.getElementById("sort-by");
const sortVal = document.getElementById("sort-val");

const searchInput = document.getElementById("search");

const path = window.location.pathname;

if (path.endsWith("resources.html") || path.endsWith("index.html") || path === "/" || path.endsWith("/")) {
    window.onload = () => search(1, false);
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

const compare = (a, b) => {
  const sortByLocal = sortBy.value;
  const sortValLocal = sortVal.value;
  if (sortByLocal !== '') {
    const sortKey = sortByLocal;
    let valA = a[sortKey];
    let valB = b[sortKey];
    
    if (!isNaN(valA) && !isNaN(valB)) {
      valA = Number(valA);
      valB = Number(valB);
    }

    if (sortValLocal === 'ASC') {
      if (valA > valB) return 1;
      if (valA < valB) return -1;
    } else if (sortValLocal === 'DEC') {
      if (valA > valB) return -1;
      if (valA < valB) return 1;
    }
  }
  return 0;
}

async function sort() {
  await search(1, true);
}

async function search(page, sort) {
  const searchText = searchInput.value;
  try {
    const response = await fetch(`${API_BASE_URL}/search/?page=${page}&search=${searchText}`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch resources');
    }

    const data = await response.json();

    navbarLinks(data.isAuthenticated, data.loggedInUser?.role, data.loggedInUser?.email, 0);

    const container = document.getElementById('resource-grid');
    container.innerHTML = '';

    if (!data.resources || data.resources.length === 0) {
      container.innerHTML = '<h1>No Resources Found!</h1>';
      return;
    }

    const borrowedResources = data.loggedInUser?.role === 'user' ? data.loggedInUser?.borrowedItems?.resources || null : null;

    let detail = "./detail.html";

    if (path.endsWith("index.html") || path === "/" || path.endsWith("/")) {
      detail = "./shop/detail.html";
    }

    if (searchText.trim().length > 0 && sortBy.value !== '' && sortVal.value!== '') {
      sort = true;
    }

    if (page > 1 && sortBy.value !== '' && sortVal.value!== '') {
      sort = true;
    }

    if (sort === true) data.resources.sort(compare);

    let rows = '';
    let scope = 0;

    data.resources.forEach(resource => {
      const actionHTML = getActionButtonHTML(resource, borrowedResources);
      scope++;
      rows += `
        <tr>
          <th scope="row">${scope}</th>
          <td>⭐ ${resource.numericRating > 0 ? resource.numericRating : 0}</td>
          <td>${resource.copies}</td>
          <td><h5 class"mb-0">${resource.title}</h5></td>
          <td>${resource.author}</td>
          <td>${resource.publicationYear}</td>
          <td>${resource.genre}</td>
          <td><a class="link-peimary link-opacity-50-hover" href="${detail}?id=${resource._id}">Details</a></td>
          <td>${actionHTML}</td>
        </tr>
      `;
    });

    container.innerHTML = `
    <table class="table table-hover table-striped">
      <thead>
        <tr>
          <th scope="col">Row Num</th>
          <th scope="col">Rating</th>
          <th scope="col">Copies</th>
          <th scope="col">Title</th>
          <th scope="col">Author</th>
          <th scope="col">Year</th>
          <th scope="col">Genre</th>
          <th scope="col">Details</th>
          <th scope="col">Action</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    `;

    // data.resources.forEach(resource => {
    //   const div = document.createElement('div');
    //   div.classList.add('item');

    //   const actionHTML = getActionButtonHTML(resource, borrowedResources);

    //   div.innerHTML = `
    //     <div class="d-flex justify-content-between align-items-center mx-auto">
    //       <h3 class="mb-0">${resource.title} -</h3>
    //       <span class="p-2 d-flex flex-column">
    //         <span class="fw-bold rating text-warning">
    //           ⭐ ${resource.numericRating > 0 ? resource.numericRating : 0}
    //         </span>
    //         <span class="copies">
    //           Copies: ${resource.copies}
    //         </span>
    //       </span>
    //     </div>
    //     <p><strong>Author:</strong> ${resource.author}</p>
    //     <p><strong>Year:</strong> ${resource.publicationYear} - <strong>Genre:</strong> ${resource.genre}</p>
    //     <div class="buttons">
    //       <a class="link-peimary link-opacity-50-hover" href="${detail}?id=${resource._id}">Details</a>
    //       ${actionHTML}
    //     </div>
    //   `;

    //   container.appendChild(div);
    // });

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

  paginationContainer.innerHTML = `<div style="margin:auto">${html}</div>`;

  paginationContainer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const page = +event.target.getAttribute('data-page');
      search(page);
    });
  });
}


function getActionButtonHTML(resource, borrowedResources = null) {
  if (!borrowedResources && !resource.availableStatus) {
    return `<p class="text-danger">Not Available</p>`;
  }

  if (!borrowedResources) {
    return `<p class="text-success">Available</p>`;
  }

  const hasBorrowed = borrowedResources.find(
    r => r.resourceId.toString() === resource._id.toString()
  );

  if (!hasBorrowed && resource.availableStatus) {
    return `<button class="btn btn-outline-success" onclick="borrowResource('${resource._id}')">Borrow</button>`;
  }

  if (!hasBorrowed && !resource.availableStatus) {
    return `<p class="text-danger">Not Available</p>`;
  }

  let checkout = './checkout.html';

  if (path.endsWith("index.html") || path === "/" || path.endsWith("/")) {
    checkout = "./shop/checkout.html";
  }

  if (hasBorrowed && !resource.availableStatus) {
    return `<a class="btn btn-outline-info" href="${checkout}?resourceId=${resource._id}">Return</a>`;
  }

  // This line is not needed any longer, because if a user has borrowed a book,
  // for the user, this book does not appear on the screen anymore 
  // return `<button class="btn btn-outline-success" onclick="borrowResource('${resource._id}')">Borrow</button>`;
}


function navbarLinks(isAuthenticated, role, email, activeLinkNUM) {
  const navLeftUl = document.getElementById('left-list');
  const navRightUl = document.getElementById('right-list');

  if (navLeftUl.getAttribute('data-rendered') === 'true') return;

  let borrow = "./borrow.html";
  let history = "./borrow-history.html";
  let adminEdit = "../admin/edit-resource.html";
  let adminResource = "../admin/resources.html";
  let adminReport = "../admin/report.html";

  if (path.endsWith("index.html") || path === "/" || path.endsWith("/")) {
    borrow = "./shop/borrow.html";
    history = "./shop/borrow-history.html";
    adminEdit = "./admin/edit-resource.html";
    adminResource = "./admin/resources.html";
    adminReport = "./admin/report.html";
  }

  if (isAuthenticated) {
    if (role === "user") {
      navLeftUl.insertAdjacentHTML('beforeend', `
        <li class="nav-item">
          <a class="nav-link p-2" href=${borrow} id="nav-1">Borrowed</a>
        </li>
        <li class="nav-item">
          <a class="nav-link p-2" href=${history} id="nav-2">Borrow History</a>
        </li>
      `);
    }
    if (role === "admin") {
      navLeftUl.insertAdjacentHTML('beforeend', `
        <li class="nav-item">
          <a class="nav-link p-2" href=${adminEdit} id="nav-3">Add Resource</a>
        </li>
        <li class="nav-item">
          <a class="nav-link p-2" href=${adminResource} id="nav-4">Admin Resources</a>
        </li>
        <li class="nav-item">
          <a class="nav-link p-2" href=${adminReport} id="nav-5">Report</a>
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

async function logout() {

  localStorage.removeItem('token');

  let resources = "./resources.html";

  if (path.endsWith("index.html") || path === "/" || path.endsWith("/")) {
    resources = "./shop/resources.html";
  }
  
  window.location.href = resources;
}

async function borrowResource(resourceId) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in to borrow resources.');
    return;
  }

  
  let borrow = './borrow.html';

  if (path.endsWith("index.html") || path === "/" || path.endsWith("/")) {
    borrow = "./shop/borrow.html";
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

    window.location.href = borrow;

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
    // console.log(resourceData)
    
    let rating = 0;
    resourceData.reviews.forEach(review => {
        rating += Number(review.response.rating);
    });

    if (resourceData.reviews.length > 0) {
      rating = (rating / resourceData.reviews.length).toFixed(1);
    } else {
      rating = 0;
    }

    navbarLinks(resourceData.isAuthenticated, resourceData.loggedInUser?.role, resourceData.loggedInUser?.email, 0);

    const container = document.getElementById('resource-grid');
    container.innerHTML = '';


    // const div = document.createElement('div');
    // div.classList.add('item');

    const borrowedResources = resourceData.loggedInUser?.role === 'user' ? resourceData.loggedInUser?.borrowedItems?.resources || null : null;

    const actionHTML = getActionButtonHTML(resourceData.resource, borrowedResources);

    let rows = '';
    let scope = 0;

    scope++;
    rows += `
      <tr>
        <th scope="row">${scope}</th>
        <td>⭐ ${resourceData.resource.numericRating > 0 ? resourceData.resource.numericRating : 0}</td>
        <td>${resourceData.resource.copies}</td>
        <td><h5 class="mb-0">${resourceData.resource.title}</h5></td>
        <td>${resourceData.resource.author}</td>
        <td>${resourceData.resource.publicationYear}</td>
        <td>${resourceData.resource.genre}</td>
    `;

    if (resourceData.isAuthenticated) {
      rows += `<td>${actionHTML}</td>`;
    }

    rows += `</tr>`;

    container.innerHTML = `
    <table class="table table-hover table-striped">
      <thead>
        <tr>
          <th scope="col">Row Num</th>
          <th scope="col">Rating</th>
          <th scope="col">Copies</th>
          <th scope="col">Title</th>
          <th scope="col">Author</th>
          <th scope="col">Year</th>
          <th scope="col">Genre</th>
          <th scope="col">Action</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    `;

    // div.innerHTML = `
    //   <div class="d-flex justify-content-between align-items-center mx-auto">
    //     <h3 class="mb-0">${resourceData.resource.title} -</h3>
    //     <span class="p-2 d-flex flex-column">
    //       <span class="fw-bold rating text-warning">
    //         ⭐ ${resourceData.resource.numericRating > 0 ? resourceData.resource.numericRating : 0}
    //       </span>
    //       <span class="copies">
    //         Copies: ${resourceData.resource.copies}
    //       </span>
    //     </span>
    //   </div>
    //   <p><strong>Author:</strong> ${resourceData.resource.author}</p>
    //   <p><strong>Year:</strong> ${resourceData.resource.publicationYear} - <strong>Genre:</strong> ${resourceData.resource.genre}</p>`;
    //   if (resourceData.isAuthenticated) {
    //     div.innerHTML += `
    //     <div class="buttons">
    //       ${actionHTML}
    //     </div>
    //   `;
    //   }
    //   container.appendChild(div);

      const reviewContainer = document.getElementById('reviewsContainer');
      
      resourceData.reviews.forEach(review => {
        rating += review.response.rating;
        const div2 = document.createElement('div');

        div2.classList.add('col-12', 'mb-3');

        div2.innerHTML = `
          <div class="container">
            <div class="row" id="container">
              <div class="card">
                <div class="card-body">
                  <p class="card-text">${review.response.input}</p>
                </div>
              </div>

            </div>
          </div>
        `;

        reviewContainer.appendChild(div2);
      });
    
  } catch (error) {
    console.error(error);
    document.getElementById('resource-grid').innerHTML = '<h1>Error loading resource.</h1>';
  }


  const params = new URLSearchParams(window.location.search);
  const resourceId = params.get('id');
  const response = await fetch(`${API_BASE_URL}/recommendation/${resourceId}`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });

    const resourceData = await response.json();
    console.log(resourceData)

    const container = document.getElementById('recommendation-resource-grid');
    container.innerHTML = '';

    if (!resourceData.resource || resourceData.resource.length === 0) {
      container.innerHTML = '<h1>No Resources Found!</h1>';
      return;
    }

    const borrowedResources = resourceData.loggedInUser?.role === 'user' ? resourceData.loggedInUser?.borrowedItems?.resources || null : null;

    let rows = '';
    let scope = 0;

    resourceData.resource.forEach(resource => {
      const actionHTML = getActionButtonHTML(resource, borrowedResources);
      console.log(resource)
      scope++;
      rows += `
        <tr>
          <th scope="row">${scope}</th>
          <td>⭐ ${resource.numericRating > 0 ? resource.numericRating : 0}</td>
          <td>${resource.copies}</td>
          <td><h5 class"mb-0">${resource.title}</h5></td>
          <td>${resource.relationshipScore}</td>
          <td>${resource.author}</td>
          <td>${resource.publicationYear}</td>
          <td>${resource.genre}</td>
          <td><a class="link-peimary link-opacity-50-hover" href="./detail.html?id=${resource._id}">Details</a></td>
          <td>${actionHTML}</td>
        </tr>
      `;
    });

    container.innerHTML = `
    <table class="table table-hover table-striped">
      <thead>
        <tr>
          <th scope="col">Row Num</th>
          <th scope="col">Rating</th>
          <th scope="col">Copies</th>
          <th scope="col">Title</th>
          <th scpoe="col">Relationship Score</th>
          <th scope="col">Author</th>
          <th scope="col">Year</th>
          <th scope="col">Genre</th>
          <th scope="col">Details</th>
          <th scope="col">Action</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    `;

    // resourceData.resource.forEach(resource => {
    //   const div = document.createElement('div');
    //   div.classList.add('item');

    //   const actionHTML = getActionButtonHTML(resource, borrowedResources);

    //   div.innerHTML = `
    //     <h3 class="mb-0">${resource.title}</h3>
    //     <div class="d-flex justify-content-between align-items-center mx-auto w-75">
    //       <p class="mt-3"><strong>Relationship Score:</strong> ${resource.relationshipScore}</p>
    //       <span class="p-2 d-flex flex-column">
    //         <span class="fw-bold rating text-warning">
    //           ⭐ ${resource.numericRating > 0 ? resource.numericRating : 0}
    //         </span>
    //         <span class="copies">
    //           Copies: ${resource.copies}
    //         </span>
    //       </span>
    //     </div>
    //     <p><strong>Author:</strong> ${resource.author}</p>
    //     <p><strong>Year:</strong> ${resource.publicationYear} - <strong>Genre:</strong> ${resource.genre}</p>
    //     <div class="buttons">
    //       <a class="link-peimary link-opacity-50-hover" href="./detail.html?id=${resource._id}">Details</a>
    //       ${actionHTML}
    //     </div>
    //   `;

    //   container.appendChild(div);
    // });
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
        
        navbarLinks(borrowedResources.isAuthenticated, borrowedResources.loggedInUser.role, borrowedResources.loggedInUser.email, 1);

        const container = document.getElementById('resource-grid');
        container.innerHTML = '';

        if (!borrowedResources.resources || borrowedResources.resources.length === 0) {
            container.innerHTML = '<h1>No Resources Found!</h1>';
            return;
        }

        let rows = '';
        let scope = 0;

        borrowedResources.resources.forEach(resource => {
          scope++;
          rows += `
            <tr>
              <th scope="row">${scope}</th>
              <td>⭐ ${resource.numericRating > 0 ? resource.numericRating : 0}</td>
              <td>${resource.copies}</td>
              <td><h5 class"mb-0">${resource.title}</h5></td>
              <td>${resource.author}</td>
              <td>${resource.publicationYear}</td>
              <td>${resource.genre}</td>
              <td><h6 class="text-success">${resource.dueDate || 'N/A'}</h6></td>
              <td><a class="btn btn-outline-info" href="./checkout.html?resourceId=${resource._id}">Return</a></td>
            </tr>
          `;
        });

        container.innerHTML = `
        <table class="table table-hover table-striped">
          <thead>
            <tr>
              <th scope="col">Row Num</th>
              <th scope="col">Rating</th>
              <th scope="col">Copies</th>
              <th scope="col">Title</th>
              <th scope="col">Author</th>
              <th scope="col">Year</th>
              <th scope="col">Genre</th>
              <th scope="col">Due Date</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        `;

        // borrowedResources.resources.forEach(resource => {
        //     const div = document.createElement('div');
        //     div.classList.add('item');

        //     div.innerHTML = `
        //         <div class="d-flex justify-content-between align-items-center mx-auto">
        //           <h3 class="mb-0">${resource.title} -</h3>
        //           <span class="p-2 d-flex flex-column">
        //             <span class="fw-bold rating text-warning">
        //               ⭐ ${resource.numericRating > 0 ? resource.numericRating : 0}
        //             </span>
        //             <span class="copies">
        //               Copies: ${resource.copies}
        //             </span>
        //           </span>
        //         </div>
        //         <h6 class="text-success">Due Date: ${resource.dueDate || 'N/A'}</h6>
        //         <p><strong>Author:</strong> ${resource.author}</p>
        //         <p><strong>Year:</strong> ${resource.publicationYear} - <strong>Genre:</strong> ${resource.genre}</p>
        //         <div class="buttons">
        //             <a class="btn btn-outline-info" href="./checkout.html?resourceId=${resource._id}">Return</a>
        //         </div>
        //     `;

        //     container.appendChild(div);
        // });
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

    navbarLinks(borrowHistoryData.isAuthenticated, borrowHistoryData.loggedInUser.role, borrowHistoryData.loggedInUser.email, 2);

    const container = document.getElementById('resource-grid');
    container.innerHTML = '';

    if (!borrowHistoryData.returneds || borrowHistoryData.returneds.length === 0) {
      container.innerHTML = '<h1>No Borrow History Found!</h1>';
      return;
    }

    let rows = '';
    let scope = 0;

    borrowHistoryData.returneds.forEach(record => {
      const recordDiv = document.createElement('div');
      recordDiv.classList.add('record-entry');
      
      scope++;
      rows = `
        <tr>
          <th scope="row">${scope}</th>
          <td>⭐ ${record.resources.numericRating > 0 ? record.resources.numericRating : 0}</td>
          <td>${record.resources.copies}</td>
          <td><h5 class"mb-0">${record.resources.title}</h5></td>
          <td>${record.resources.author}</td>
          <td>${record.resources.publicationYear}</td>
          <td>${record.resources.genre}</td>
          <td><h6 class="text-success">${record.resources.returnedDate || 'N/A'}</h6></td>
        </tr>
      `;

      const innerItems = `

    <table class="table table-hover table-striped">
      <thead>
        <tr>
          <th scope="col">Row Num</th>
          <th scope="col">Rating</th>
          <th scope="col">Copies</th>
          <th scope="col">Title</th>
          <th scope="col">Author</th>
          <th scope="col">Year</th>
          <th scope="col">Genre</th>
          <th scope="col">Returned Date</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    `;

      //     <div class="item">
      //       <div class="d-flex justify-content-between align-items-center mx-auto">
      //       <h3 class="mb-0">${record.resources.title} -</h3>
      //       <span class="p-2 d-flex flex-column">
      //         <span class="fw-bold rating text-warning">
      //           ⭐ ${record.resources.numericRating > 0 ? record.resources.numericRating : 0}
      //         </span>
      //         <span class="copies">
      //           Copies: ${record.resources.copies}
      //         </span>
      //       </span>
      //     </div>
      //     <p><strong>Author:</strong> ${record.resources.author}</p>
      //     <p><strong>Year:</strong> ${record.resources.publicationYear} - <strong>Genre:</strong> ${record.resources.genre}</p>
      //     <p><strong>Returned Date:</strong> ${record.resources.returnedDate || 'N/A'}</p>
      //   </div>
      // `;

      recordDiv.innerHTML = `
        <h3>#${record._id} - <button class="btn text-warning bg-dark" onclick="downloadInvoice('${record._id}')" style="border: none;">Invoice</button></h3>
        <div class="container">
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
