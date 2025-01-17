"use strict";

if (module.hot) {
  module.hot.accept();
}

const config = {
  name: "",
  email: "",
  phone: "",
  username: "",
  api: "https://randomuser.me/api/",
  tabs: [
    {
      name: "Profile",
      // show all details of the user
    },
    {
      name: "University",
      api: "http://universities.hipolabs.com/search?country=SELECTED_USER_COUNTRY",
      // show universities data and implement search, sort(name), pagination.
    },
    {
      name: "tab-3",
    },
    {
      name: "tab-4",
      api: "https://randomuser.me/api/",
    },
    {
      name: "tab-5",
      api: "https://randomuser.me/api/",
    },
  ],
};

const data = {};
data.sortAscending = true;

let isFetching = false;

const timeout_sec = 10;

const brief = document.querySelector(".brief");
const tabList = document.querySelector(".tab__list");
const tabContent = document.querySelector(".tab__content");

const timeout = function (seconds) {
  return new Promise(function (_, reject) {
    setTimeout(function () {
      reject(new Error(`Request took too long!`));
    }, seconds * 1000);
  });
};

const getJSON = async function (url) {
  try {
    const res = await Promise.race([fetch(url), timeout(timeout_sec)]);
    const data = await res.json();

    if (!res.ok) throw new Error(`${data.message} (${res.status})`);
    return data;
  } catch (err) {
    throw err;
  }
};

const renderSpinner = function (parentEl) {
  const markup = `
    <div class="loader-container">
      <div class="loader"></div>
    </div>
  `;
  parentEl.innerHTML = "";
  parentEl.insertAdjacentHTML("afterbegin", markup);
};

const renderBriefContainer = function () {
  const markup = `
          <img src="${data.profileInfo.photo}" alt="profile_img" class="brief__img" />
          <p class="brief__name">${data.profileInfo.name}</p>
          <p class="brief__email">${data.profileInfo.email}</p>
          <p class="brief__phone">${data.profileInfo.phone}</p>
          <p class="brief__username">${data.profileInfo.username}</p>
  `;
  brief.innerHTML = "";
  brief.insertAdjacentHTML("afterbegin", markup);
};

const formatInfo = function (info) {
  return {
    name: Object.values(info.name).join(" "),
    username: info.login.username,
    email: info.email,
    gender: info.gender,
    phone: info.phone,
    cell: info.cell,
    photo: info.picture.large,
    country: info.location.country,
    dob: new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    }).format(new Date(info.dob.date)),
    address: `${info.location.street.number}, ${info.location.street.name}, ${info.location.city}, ${info.location.state}, Postcode: ${info.location.postcode}`,
  };
};

const loadData = async function () {
  renderSpinner(brief);
  const res = await getJSON(config.api);
  const info = res.results[0];
  data.profileInfo = formatInfo(info);
  renderBriefContainer();
};

console.log(data);

const renderTabs = function () {
  tabList.innerHTML = "";
  const tabListMarkup = config.tabs
    .map(
      (tab, i) =>
        `<li class="tab__item ${
          i !== 0 ? "" : "active"
        } tab-${tab.name.toLowerCase()}"  data-index ="${i}"> ${
          tab.name
        } </li> `
    )
    .join("");
  tabList.insertAdjacentHTML("afterbegin", tabListMarkup);
};

// const switchTab = async function (e) {
//   const tab = e.target.closest(".tab__item");
//   if (!tab) return;

//   Array.from(tabList.children).forEach((t) => t.classList.remove("active"));
//   tab.classList.add("active");

//   const tabIndex = +tab.dataset.index;
//   await renderContent(tabIndex);
// };

const switchTab = async function (e) {
  const tab = e.target.closest(".tab__item");
  if (!tab || isFetching) return;

  // Activate the selected tab visually
  Array.from(tabList.children).forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");

  const tabIndex = +tab.dataset.index;

  isFetching = true;
  await renderContent(tabIndex);
  isFetching = false;

  // Force UI to update after data load
  forceUIUpdate();
};

const renderProfileContent = function () {
  tabContent.classList.add("profile_content");

  const profileMarkup = `
      <h2>Profile Details</h2>
      <p><span>Name:</span> ${data.profileInfo.name}</p>
      <p><span>Email:</span> ${data.profileInfo.email}</p>
      <p><span>Phone:</span> ${data.profileInfo.phone}</p>
      <p><span>Username:</span> ${data.profileInfo.username}</p>
      <p><span>Gender:</span> ${data.profileInfo.gender}</p>
      <p><span>Country:</span> ${data.profileInfo.country}</p>
      <p><span>Date of Birth:</span> ${data.profileInfo.dob}</p>
      <p><span>Address:</span> ${data.profileInfo.address}</p>
    `;
  tabContent.innerHTML = profileMarkup;
};

const renderDynamicContent = function (apiData) {
  if (Array.isArray(apiData)) {
    const listItems = apiData
      .map(
        (item) => `
          <div class="dynamic-item">
            <h3>${item.name || "Unnamed"}</h3>
            <p>${item.description || JSON.stringify(item)}</p>
          </div>
        `
      )
      .join("");
    tabContent.innerHTML = `<div class="dynamic-list">${listItems}</div>`;
  } else {
    tabContent.innerHTML = `<pre>${JSON.stringify(apiData, null, 2)}</pre>`;
  }
};

const forceUIUpdate = () => {
  tabList.removeEventListener("click", switchTab);
  tabList.addEventListener("click", switchTab);
};

// const renderContent = async function (tabIndex) {
//   const selectedTab = config.tabs[tabIndex];

//   tabContent.innerHTML = ""; // Clear content
//   renderSpinner(tabContent);

//   if (selectedTab.api) {
//     let apiUrl = selectedTab.api;

//     if (tabIndex === 1) {
//       apiUrl = apiUrl.replace(
//         "SELECTED_USER_COUNTRY",
//         data.profileInfo.country
//       );
//     }

//     try {
//       const apiData = await getJSON(apiUrl);

//       if (tabIndex === 1) {
//         data.universities = apiData;
//         data.filteredUniversities = apiData;
//         data.currentPage = 1;
//         data.itemsPerPage = 10;

//         tabContent.innerHTML = `
//                     <h2>Universities in ${data.profileInfo.country}</h2>
//                     <div class="university-controls">
//                         <input type="search" class="search-input" placeholder="Search universities..." />
//                         <button class="btn btn--sort">Sort A-Z</button>
//                     </div>
//                     <div class="university-table-container"></div>
//                 `;
//         renderPaginatedUniversities();
//       } else {
//         renderDynamicContent(apiData);
//       }
//     } catch (err) {
//       tabContent.innerHTML = `<p>Error loading data: ${err.message}</p>`;
//     }
//   } else if (tabIndex === 0) {
//     renderProfileContent();
//   } else {
//     tabContent.innerHTML = `<h2>Coming Soon!</h2>`;
//   }
// };

const renderContent = async function (tabIndex) {
  const selectedTab = config.tabs[tabIndex];

  tabContent.innerHTML = ""; // Clear content
  renderSpinner(tabContent);

  if (selectedTab.api) {
    let apiUrl = selectedTab.api;

    if (tabIndex === 1) {
      apiUrl = apiUrl.replace(
        "SELECTED_USER_COUNTRY",
        data.profileInfo.country
      );
    }

    try {
      const apiData = await getJSON(apiUrl);

      if (tabIndex === 1) {
        data.universities = apiData;
        data.filteredUniversities = apiData;
        data.currentPage = 1;
        data.itemsPerPage = 10;

        tabContent.innerHTML = `
                    <h2>Universities in ${data.profileInfo.country}</h2>
                    <div class="university-controls">
                        <input type="search" class="search-input" placeholder="Search universities..." />
                        <button class="btn btn--sort">Sort A-Z</button>
                    </div>
                    <div class="university-table-container"></div>
                `;
        renderPaginatedUniversities();
      } else {
        renderDynamicContent(apiData);
      }
    } catch (err) {
      tabContent.innerHTML = `<p>Error loading data: ${err.message}</p>`;
    }
  } else if (tabIndex === 0) {
    renderProfileContent();
  } else {
    tabContent.innerHTML = `<h2>Coming Soon!</h2>`;
  }

  // Force UI update after loading content
  forceUIUpdate();
};

const attachUniversityEventListeners = function () {
  const sortButton = document.querySelector(".btn--sort");
  const prevButton = document.querySelector(".btn--prev");
  const nextButton = document.querySelector(".btn--next");
  const firstButton = document.querySelector(".btn--first");
  const lastButton = document.querySelector(".btn--last");
  const searchInput = document.querySelector(".search-input");
  const maxPage = Math.ceil(
    data.filteredUniversities.length / data.itemsPerPage
  );

  // Null checks for buttons
  if (sortButton) {
    sortButton.removeEventListener("click", sortUniversities);
    sortButton.addEventListener("click", sortUniversities);
  }

  // Debounced Search Input
  if (searchInput) {
    searchInput.removeEventListener("input", handleSearch);
    searchInput.addEventListener("input", handleSearch);
  }

  // Pagination Buttons with null checks
  if (prevButton) {
    prevButton.onclick = () => {
      if (data.currentPage > 1) {
        data.currentPage--;
        renderPaginatedUniversities();
      }
    };
  }

  if (nextButton) {
    nextButton.onclick = () => {
      if (data.currentPage < maxPage) {
        data.currentPage++;
        renderPaginatedUniversities();
      }
    };
  }

  if (firstButton) {
    firstButton.onclick = () => {
      data.currentPage = 1;
      renderPaginatedUniversities();
    };
  }

  if (lastButton) {
    lastButton.onclick = () => {
      data.currentPage = maxPage;
      renderPaginatedUniversities();
    };
  }
};

// Search Handler
const handleSearch = function () {
  const query = document.querySelector(".search-input").value.toLowerCase();

  // Avoid unnecessary filtering when input is empty
  if (!query.trim()) {
    data.filteredUniversities = data.universities;
  } else {
    data.filteredUniversities = data.universities.filter((uni) =>
      uni.name.toLowerCase().includes(query)
    );
  }

  data.currentPage = 1;
  renderPaginatedUniversities();
};

// Safeguard Pagination Button State Updates
const renderPaginatedUniversities = function () {
  const start = (data.currentPage - 1) * data.itemsPerPage;
  const end = start + data.itemsPerPage;
  const universitiesSliced = data.filteredUniversities.slice(start, end);
  const maxPage = Math.ceil(
    data.filteredUniversities.length / data.itemsPerPage
  );

  renderUniversityTable(universitiesSliced);

  // Null check for pagination buttons
  const prevButton = document.querySelector(".btn--prev");
  const nextButton = document.querySelector(".btn--next");
  const firstButton = document.querySelector(".btn--first");
  const lastButton = document.querySelector(".btn--last");

  if (prevButton && nextButton && firstButton && lastButton) {
    prevButton.disabled = data.currentPage === 1;
    firstButton.disabled = data.currentPage === 1;
    nextButton.disabled = data.currentPage === maxPage;
    lastButton.disabled = data.currentPage === maxPage;
  }

  attachUniversityEventListeners(); // Reattach after rendering
};

const renderUniversityTable = function (universities) {
  const totalPages = Math.ceil(
    data.filteredUniversities.length / data.itemsPerPage
  );

  const tableMarkup = universities.length
    ? `
      <div class="table-wrapper">
        <table class="university-table">
          <thead>
            <tr>
              <th>University Name</th>
              <th>Website</th>
            </tr>
          </thead>
          <tbody>
            ${universities
              .map(
                (uni) => `
                <tr>
                  <td>${uni.name}</td>
                  <td><a href="${uni.web_pages[0]}" target="_blank">${uni.web_pages[0]}</a></td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <button class="btn btn--first" disabled>&laquo; First</button>
        <button class="btn btn--prev" disabled>&larr; Prev</button>
        <span class="page_count"> Page ${
          data.currentPage
        } / ${totalPages} </span>
        <button class="btn btn--next">Next &rarr;</button>
        <button class="btn btn--last">Last &raquo;</button>
      </div>
    `
    : `<p class="no-results">No universities found matching your search.</p>`;

  const tableContainer = document.querySelector(".university-table-container");
  tableContainer.innerHTML = tableMarkup;
};

const sortUniversities = function () {
  data.filteredUniversities.sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    return data.sortAscending
      ? nameA.localeCompare(nameB)
      : nameB.localeCompare(nameA);
  });

  data.sortAscending = !data.sortAscending;

  const sortButton = document.querySelector(".btn--sort");
  sortButton.textContent = data.sortAscending ? "Sort A-Z" : "Sort Z-A";

  data.currentPage = 1;
  renderPaginatedUniversities();
};

const init = async function () {
  if (window._initialized) return;
  window._initialized = true;

  await loadData();
  renderTabs();
  tabList.addEventListener("click", switchTab);
  await renderContent(0);

  // Force UI update on load
  forceUIUpdate();
};

init();
