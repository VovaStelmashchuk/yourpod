const { Database } = require("./client");


function getPublicPosts() {
  return Database.collection('posts').find({
    'visibility': 'public'
  }, {
    sort: {
      'publish_date': -1
    }
  }
  ).toArray();
}

function getAllPosts() {
  return Database.collection('posts').find({}, {
    sort: {
      'publish_date': -1
    }
  }
  ).toArray();
}

function updatePodcastNameBySlug(slug, podcastName) {
  return Database.collection('posts').updateOne({ slug: slug }, { $set: { title: podcastName } });
}

function getPostBySlug(slug) {
  return Database.collection('posts').findOne({ slug: slug });
}

module.exports = {
  getPublicPosts,
  getAllPosts,
  getPostBySlug,
  updatePodcastNameBySlug,
}
