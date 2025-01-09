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
  const markup = `<div class="loader"></div>`;
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

      tabContent.classList.add("university_content");

      const universityMarkup = `
        <h2>Universities in ${country}</h2>
        <div class="search">
          <input type="search" class="search-input" placeholder="Search universities..." />
        </div>
        <ul class="university-list">
          ${universityData
            .slice(0, 10)
            .map(
              (uni) => `
            <li class="university">
              <p class="university__name">${uni.name}</p>
              <span>Webpage: </span>
              <a href="${uni.web_pages[0]}" target="_blank" class="university__webpage">${uni.web_pages[0]}</a>
            </li>
          `
            )
            .join("")}
        </ul>
      `;
      tabContent.innerHTML = universityMarkup;
    } catch (err) {
      tabContent.innerHTML = `<p>Error loading universities: ${err.message}</p>`;
    }
  }
};

const init = async function () {
  await loadData();
  renderTabs();
  tabList.addEventListener("click", switchTab);
  await renderContent(0);
};

init();
