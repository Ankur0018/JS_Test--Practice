if (module.hot) {
  module.hot.accept();
}

const state = {
  country: "",
};

const get_randomUserData = async function () {
  const response = await fetch("https://randomuser.me/api/");
  const data = await response.json();
  console.log(data);
  state.country = data.results[0].location.country;
};

get_randomUserData();
console.log(state);

const get_UniversityData = async function () {
  const response = await fetch(
    `http://universities.hipolabs.com/search?country=${state.country}`
  );
  const data = await response.json();
  console.log(data);
};

get_UniversityData();
