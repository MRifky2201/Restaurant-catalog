import 'regenerator-runtime'; /* for async await transpile */
import '../styles/main.css';
import swRegister from './utils/sw-register';
import FavoriteRestaurantIdb from './db';

document.addEventListener('DOMContentLoaded', () => {
  initializeHamburgerMenu();
  initializeSearchFunctionality();
  initializeRouter();
  swRegister(); // Pastikan service worker terdaftar
});

function initializeRouter() {
  window.addEventListener('hashchange', router);
  window.addEventListener('load', router);
}

function router() {
  const { hash } = window.location;
  if (hash === '#favorites') {
    displayFavoriteRestaurants();
  } else if (hash.startsWith('#restaurant-')) {
    const id = hash.split('-')[1];
    fetchRestaurantDetails(id);
  } else {
    fetchAndDisplayRestaurants();
  }
}

function initializeHamburgerMenu() {
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav');

  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      const expanded = hamburger.getAttribute('aria-expanded') === 'true' || false;
      hamburger.setAttribute('aria-expanded', !expanded);
      nav.classList.toggle('nav--open');
    });

    document.addEventListener('click', (event) => {
      if (!nav.contains(event.target) && !hamburger.contains(event.target)) {
        nav.classList.remove('nav--open');
        hamburger.setAttribute('aria-expanded', false);
      }
    });
  }
}

function initializeSearchFunctionality() {
  const searchInput = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');

  if (searchInput && searchButton) {
    searchButton.addEventListener('click', () => {
      const searchTerm = searchInput.value.trim().toLowerCase();
      const cards = document.querySelectorAll('.card');

      cards.forEach((card) => {
        const restaurantName = card.querySelector('h1').textContent.toLowerCase();
        // eslint-disable-next-line no-param-reassign
        card.style.display = restaurantName.includes(searchTerm) ? 'block' : 'none';
      });
    });
  }
}

async function fetchAndDisplayRestaurants() {
  const apiBaseUrl = 'https://restaurant-api.dicoding.dev';

  try {
    showLoadingIndicator();
    const response = await fetch(`${apiBaseUrl}/list`);
    const data = await response.json();
    hideLoadingIndicator();
    displayRestaurants(data.restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
  }
}

function displayRestaurants(restaurants) {
  const restaurantContainer = document.querySelector('.wrapper');
  if (restaurantContainer) {
    restaurantContainer.innerHTML = '';

    restaurants.forEach((restaurant) => {
      const restaurantCard = createRestaurantCard(restaurant);
      restaurantContainer.appendChild(restaurantCard);
    });

    addEventListenersToCards();
  }
}

function createRestaurantCard(restaurant) {
  const apiBaseUrl = 'https://restaurant-api.dicoding.dev';
  const restaurantCard = document.createElement('div');
  restaurantCard.classList.add('card');
  restaurantCard.dataset.rating = restaurant.rating;
  restaurantCard.dataset.id = restaurant.id;

  restaurantCard.innerHTML = `
    <div class="poster">
      <img src="${apiBaseUrl}/images/medium/${restaurant.pictureId}" alt="${restaurant.name}">
    </div>
    <div class="details">
      <h1>${restaurant.name}</h1>
      <h2>${restaurant.city}</h2>
      <div class="rating">${generateStars(restaurant.rating)}</div>
      <p class="desc">${restaurant.description}</p>
      <div class="action-buttons">
        <a href="#restaurant-${restaurant.id}" class="cta-detail" data-id="${restaurant.id}">View Details</a>
        <div class="favorite-icon-container">
          <div class="favorite-icon" data-id="${restaurant.id}">&#10084;</div>
        </div>
      </div>
    </div>
  `;

  return restaurantCard;
}

function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  let stars = '';

  for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
  if (halfStar) stars += '<i class="fas fa-star-half-alt"></i>';
  for (let i = 0; i < emptyStars; i++) stars += '<i class="far fa-star"></i>';

  return `${stars} <span>${rating}/5</span>`;
}

function addEventListenersToCards() {
  const ctaDetails = document.querySelectorAll('.cta-detail');
  const favoriteIcons = document.querySelectorAll('.favorite-icon');

  if (ctaDetails && favoriteIcons) {
    ctaDetails.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const restaurantId = event.target.getAttribute('data-id');
        window.location.hash = `#restaurant-${restaurantId}`;
      });
    });

    favoriteIcons.forEach((icon) => {
      icon.addEventListener('click', (event) => {
        event.preventDefault();
        toggleFavorite(event.target);
      });
    });
  }
}

async function fetchRestaurantDetails(id) {
  const apiBaseUrl = 'https://restaurant-api.dicoding.dev';

  try {
    showLoadingIndicator();
    const response = await fetch(`${apiBaseUrl}/detail/${id}`);
    const data = await response.json();
    hideLoadingIndicator();
    displayRestaurantDetails(data.restaurant);
  } catch (error) {
    console.error('Error fetching restaurant details:', error);
  }
}

function displayRestaurantDetails(restaurant) {
  const apiBaseUrl = 'https://restaurant-api.dicoding.dev';
  const restaurantDetail = document.createElement('div');
  restaurantDetail.classList.add('restaurant-detail');

  restaurantDetail.innerHTML = `
    <h1>${restaurant.name}</h1>
    <img src="${apiBaseUrl}/images/medium/${restaurant.pictureId}" alt="${restaurant.name}">
    <p class="detail-item">Rating: ${restaurant.rating}</p>
    <p class="detail-item">Address: ${restaurant.address}</p>
    <p class="detail-item">City: ${restaurant.city}</p>
    <p class="detail-item">Description: ${restaurant.description}</p>
    <h3>Menus</h3>
    <h4>Foods</h4>
    <ul>${restaurant.menus.foods.map((food) => `<li class="list">${food.name}</li>`).join('')}</ul>
    <h4>Drinks</h4>
    <ul>${restaurant.menus.drinks.map((drink) => `<li class="list">${drink.name}</li>`).join('')}</ul>
    <h3>Customer Reviews</h3>
    <ul>${restaurant.customerReviews.map((review) => `<li class="review-item">${review.name}: ${review.review} - ${review.date}</li>`).join('')}</ul>
    <div class="favorite-container">
      <div id="favorite-button" class="favorite-icon" data-id="${restaurant.id}">&#10084;</div>
    </div>
    <div class="review-form-container">
      <form id="review-form">
        <input type="text" id="reviewer-name" placeholder="Your name" required>
        <textarea id="review-content" placeholder="Your review" required></textarea>
        <button type="submit">Submit Review</button>
      </form>
    </div>
  `;

  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.innerHTML = '';
    mainContent.appendChild(restaurantDetail);

    const favoriteButton = document.getElementById('favorite-button');
    if (favoriteButton) {
      favoriteButton.addEventListener('click', (event) => {
        event.preventDefault();
        toggleFavorite(event.target);
      });
    }

    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
      reviewForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = document.getElementById('reviewer-name').value;
        const review = document.getElementById('review-content').value;
        submitReview(restaurant.id, name, review);
      });
    }
  }
}

async function submitReview(id, name, review) {
  const apiBaseUrl = 'https://restaurant-api.dicoding.dev';

  try {
    showLoadingIndicator();
    const response = await fetch(`${apiBaseUrl}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, review }),
    });
    const data = await response.json();
    hideLoadingIndicator();
    // eslint-disable-next-line no-alert
    alert('Review submitted successfully!');
    fetchRestaurantDetails(id);
  } catch (error) {
    console.error('Error submitting review:', error);
    // eslint-disable-next-line no-alert
    alert('Failed to submit review.');
  }
}

function toggleFavorite(element) {
  const restaurantId = element.getAttribute('data-id');
  const isFavorited = element.classList.contains('favorited');
  let restaurant;

  // Coba dapatkan elemen .card jika ada (untuk tampilan daftar)
  const restaurantCard = element.closest('.card');

  if (restaurantCard) {
    restaurant = {
      id: restaurantId,
      name: restaurantCard.querySelector('h1').textContent,
      city: restaurantCard.querySelector('h2').textContent,
      rating: parseFloat(restaurantCard.dataset.rating),
      pictureId: restaurantCard.querySelector('img').src.split('/').pop(),
      description: restaurantCard.querySelector('.desc').textContent,
    };
  } else {
    // Jika tidak ada elemen .card, kita berada di halaman detail
    const restaurantDetail = document.querySelector('.restaurant-detail');
    if (restaurantDetail) {
      restaurant = {
        id: restaurantId,
        name: restaurantDetail.querySelector('h1').textContent,
        city: restaurantDetail.querySelector('.detail-item:nth-child(2)').textContent.split(': ')[1],
        rating: parseFloat(restaurantDetail.querySelector('.detail-item:nth-child(1)').textContent.split(': ')[1]),
        pictureId: restaurantDetail.querySelector('img').src.split('/').pop(),
        description: restaurantDetail.querySelector('.detail-item:nth-child(3)').textContent.split(': ')[1],
      };
    }
  }

  if (isFavorited) {
    FavoriteRestaurantIdb.deleteRestaurant(restaurantId).then(() => {
      element.classList.remove('favorited');
      // eslint-disable-next-line no-alert
      alert('Removed from favorites');
    });
  } else {
    FavoriteRestaurantIdb.putRestaurant(restaurant).then(() => {
      element.classList.add('favorited');
      // eslint-disable-next-line no-alert
      alert('Added to favorites');
    });
  }
}

async function displayFavoriteRestaurants() {
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.innerHTML = '<h2>Favorite Restaurants</h2>';

    const favorites = await FavoriteRestaurantIdb.getAllRestaurants();
    if (favorites.length === 0) {
      mainContent.innerHTML += '<p>No favorite restaurants found.</p>';
      return;
    }

    const restaurantContainer = document.createElement('div');
    restaurantContainer.classList.add('wrapper');

    favorites.forEach((restaurant) => {
      const restaurantCard = createRestaurantCard(restaurant);
      restaurantContainer.appendChild(restaurantCard);
    });

    mainContent.appendChild(restaurantContainer);
    addEventListenersToCards();
  }
}

function showLoadingIndicator() {
  const loadingIndicator = document.createElement('div');
  loadingIndicator.classList.add('loading-indicator');
  loadingIndicator.innerText = 'Loading...';
  document.body.appendChild(loadingIndicator);
}

function hideLoadingIndicator() {
  const loadingIndicator = document.querySelector('.loading-indicator');
  if (loadingIndicator) loadingIndicator.remove();
}

document.querySelectorAll('a, button, input').forEach((e) => {
  if (e.offsetWidth < 44 || e.offsetHeight < 44) {
    console.log(e);
  }
});

const navbarFavorites = document.getElementById('navbar-favorites');
if (navbarFavorites) {
  navbarFavorites.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.hash = '#favorites';
  });
}
