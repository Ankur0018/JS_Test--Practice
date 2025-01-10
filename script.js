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
    },
  ],
};

const data = {};
data.sortAscending = true;

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
    <div class="loader__container">
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

const switchTab = async function (e) {
  const tab = e.target.closest(".tab__item");
  if (!tab) return;

  Array.from(tabList.children).forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");

  const tabIndex = +tab.dataset.index;
  await renderContent(tabIndex);
};

const renderContent = async function (tabIndex) {
  renderSpinner(tabContent);

  tabContent.className = "tab__content";

  if (tabIndex === 0) {
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
  } else if (tabIndex === 1) {
    try {
      const country = data.profileInfo.country;
      const universityApi = `http://universities.hipolabs.com/search?country=${country}`;
      const universityData = await getJSON(universityApi);

      tabContent.classList.add("university__content");

      // Save full university list and initialize state
      data.universities = universityData;
      data.filteredUniversities = universityData;
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

      // Rendering Paginated Universities
      renderPaginatedUniversities();
    } catch (err) {
      tabContent.innerHTML = `<p>Error loading universities: ${err.message}</p>`;
    }
  } else if (tabIndex === 2 || tabIndex === 3) {
    tabContent.classList.add("placeholder__content");
    tabContent.innerHTML = `
      <h2>Coming Soon!</h2>
      <p>Content for this tab will be added soon. Stay tuned!</p>
    `;
  }
};

const renderPaginatedUniversities = function () {
  const start = (data.currentPage - 1) * data.itemsPerPage;
  const end = start + data.itemsPerPage;
  const universitiesSliced = data.filteredUniversities.slice(start, end);
  const maxPage = Math.ceil(
    data.filteredUniversities.length / data.itemsPerPage
  );

  // Rendering specific quantity of university in table
  renderUniversityTable(universitiesSliced);

  // Updated button states
  document.querySelector(".btn--prev").disabled = data.currentPage == 1;
  document.querySelector(".btn--first").disabled = data.currentPage == 1;
  document.querySelector(".btn--next").disabled = data.currentPage == maxPage;
  document.querySelector(".btn--last").disabled = data.currentPage == maxPage;

  // University_content event listeners
  attachUniversityEventListeners();
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

  // Search functionality
  searchInput.addEventListener("input", function () {
    const query = searchInput.value.toLowerCase();
    data.filteredUniversities = data.universities.filter((uni) =>
      uni.name.toLowerCase().includes(query)
    );
    data.currentPage = 1; // Reset to first page after search
    renderPaginatedUniversities();
  });

  // Previous button
  prevButton.addEventListener("click", function () {
    if (data.currentPage > 1) {
      data.currentPage--;
      renderPaginatedUniversities();
    }
  });

  // Next button
  nextButton.addEventListener("click", function () {
    if (data.currentPage < maxPage) {
      data.currentPage++;
      renderPaginatedUniversities();
    }
  });

  // First page button
  firstButton.addEventListener("click", function () {
    if (data.currentPage !== 1) {
      data.currentPage = 1;
      renderPaginatedUniversities();
    }
  });

  // Last page button
  lastButton.addEventListener("click", function () {
    if (data.currentPage !== maxPage) {
      data.currentPage = maxPage;
      renderPaginatedUniversities();
    }
  });

  // Sort Universities

  const sortUniversities = function () {
    data.filteredUniversities.sort((a, b) => {
      if (a.name.toLowerCase() < b.name.toLowerCase())
        return data.sortAscending ? -1 : 1;
      if (a.name.toLowerCase() > b.name.toLowerCase())
        return data.sortAscending ? 1 : -1;
      return 0;
    });

    data.sortAscending = !data.sortAscending; // Toggle the sort order

    document.querySelector(".btn--sort").textContent = data.sortAscending
      ? "Sort A-Z"
      : "Sort Z-A";

    data.currentPage = 1;
    renderPaginatedUniversities();
  };

  sortButton.addEventListener("click", function () {
    sortUniversities();
  });
};

const init = async function () {
  await loadData();
  renderTabs();
  tabList.addEventListener("click", switchTab);
  await renderContent(0);
};

init();
