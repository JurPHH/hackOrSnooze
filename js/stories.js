"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDeleteBtn = false) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  const showStar = Boolean(currentUser);

  return $(`
      <li id="${story.storyId}">
        <div>
          ${showDeleteBtn ? getDeleteBtnHTML() : ""}
          ${showStar ? getStarHTML(story, currentUser) : ""}
          <a href="${story.url}" target="a_blank" class="story-link">
            <b>${story.title}</b>
          </a>
          <small class="story-hostname">(${hostName})</small>
          <div class="story-author">by ${story.author}</div>
          <div class="story-user">&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp posted by ${story.username}</div>
        </div>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

async function addUserStoryToStoryList(evt) {
  console.debug("addUserStoryToStoryList");
  evt.preventDefault();

  const title = $("#title").val();
  const author = $("#author").val();
  const url = $("#url").val();
  const storyData =  await storyList.addStory(currentUser, {title, author, url});
  
  const story = generateStoryMarkup(storyData, true);
  $allStoriesList.prepend(story);
  
  $storyForm.hide();
  $storyForm.trigger("reset");
  $allStoriesList.show();
}

$storyForm.on("submit", addUserStoryToStoryList)

function getDeleteBtnHTML() {
  return `
      <span class="trash-can">
        <i class="fas fa-trash-alt"></i>
      </span>`;
}

function getStarHTML(story, user) {
  const isFavorite = user.isFavorite(story);
  const starType = isFavorite ? "fas" : "far";
  return `
      <span class="star">
        <i class="${starType} fa-star"></i>&nbsp&nbsp
      </span>`;
}

async function deleteStory(evt) {
  console.debug("deleteStory");

  const $closestLi = $(evt.target).closest("li");
  const storyId = $closestLi.attr("id");

  await storyList.removeStory(currentUser, storyId);

  hidePageComponents();
  await putStoriesOnPage();
}

$allStoriesList.on("click", ".trash-can", deleteStory);

function putFavoritesListOnPage() {
  console.debug("putFavoritesListOnPage");

  $favoritedStories.empty();

  if (currentUser.favorites.length === 0) {
    $favoritedStories.append("<h5>No favorites added!</h5>");
  } else {
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      $favoritedStories.prepend($story);
    }
  }

  $favoritedStories.show();
}

async function toggleStoryFavorite(evt) {
  console.debug("toggleStoryFavorite");

  const $tgt = $(evt.target);
  const $closestLi = $tgt.closest("li");
  const storyId = $closestLi.attr("id");
  const story = storyList.stories.find(s => s.storyId === storyId);

  if ($tgt.hasClass("fas")) {
    await currentUser.removeFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  } else {
    await currentUser.addFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  }

  const targetOl = $tgt.parent().parent().parent().parent();
  if (targetOl.attr("id") === "favorited-stories"){
    hidePageComponents();
    putFavoritesListOnPage();
  }
}

$allStoriesList.on("click", ".star", toggleStoryFavorite);
$favoritedStories.on("click", ".star", toggleStoryFavorite);